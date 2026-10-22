"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eventContext, type EventContext } from "@/lib/events/server";
import { reportError } from "@/lib/monitoring/report-error";
import { consumeLink, endSession, panelUser, requestSignIn, type PanelUser } from "@/lib/panel/auth";
import { approve, PanelError, refund, returnReport, saveEdit } from "@/lib/panel/reviews";

/**
 * The review panel's Server Actions. Each is reachable by a direct POST, so
 * each checks the session and the role itself (Admin §6; Next.js data security).
 */

export type ActionState = { error: string | null };

async function signedIn(): Promise<PanelUser> {
  const user = await panelUser();
  if (!user) redirect("/manage/sign-in");
  return user;
}

/** Panel actions are staff activity: marked internal so they never count as a founder's (Event-Log-Spec §7). */
async function staffContext(): Promise<EventContext> {
  return { ...eventContext(await headers()), internal: true };
}

const orderIdOf = (form: FormData) => {
  const id = Number(form.get("orderId"));
  if (!Number.isInteger(id) || id <= 0) throw new PanelError("Unknown order.");
  return id;
};

async function run(orderId: number, task: () => Promise<void>): Promise<ActionState> {
  try {
    await task();
  } catch (error) {
    if (error instanceof PanelError) return { error: error.message };
    reportError("Review panel action failed", error, { order_id: orderId });
    return { error: "That did not go through. Nothing was changed — try again." };
  }
  revalidatePath(`/manage/reports/${orderId}`);
  revalidatePath("/manage");
  return { error: null };
}

export async function requestLinkAction(form: FormData) {
  await requestSignIn(String(form.get("email") ?? ""));
  redirect("/manage/sign-in?sent=1");
}

export async function signInAction(form: FormData) {
  const ok = await consumeLink(String(form.get("token") ?? ""));
  redirect(ok ? "/manage" : "/manage/sign-in?expired=1");
}

export async function signOutAction() {
  await endSession();
  redirect("/manage/signed-out");
}

export async function saveEditAction(_state: ActionState, form: FormData): Promise<ActionState> {
  const user = await signedIn();
  const orderId = orderIdOf(form);
  const restore = form.get("restore") === "1";
  return run(orderId, () => saveEdit(user, orderId, String(form.get("slot") ?? ""), restore ? null : String(form.get("text") ?? "")));
}

export async function approveAction(_state: ActionState, form: FormData): Promise<ActionState> {
  const user = await signedIn();
  const orderId = orderIdOf(form);
  return run(orderId, async () => approve(user, await staffContext(), orderId));
}

export async function returnAction(_state: ActionState, form: FormData): Promise<ActionState> {
  const user = await signedIn();
  const orderId = orderIdOf(form);
  return run(orderId, async () => returnReport(user, await staffContext(), orderId, String(form.get("note") ?? "")));
}

export async function refundAction(_state: ActionState, form: FormData): Promise<ActionState> {
  const user = await signedIn();
  const orderId = orderIdOf(form);
  return run(orderId, async () => refund(user, await staffContext(), orderId));
}
