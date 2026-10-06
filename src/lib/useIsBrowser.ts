import { useSyncExternalStore } from "react";

const subscribeNever = () => () => {};

/**
 * False during server render and hydration, true afterwards. Lets a component
 * read localStorage in its initial state without a hydration mismatch.
 */
export function useIsBrowser() {
  return useSyncExternalStore(subscribeNever, () => true, () => false);
}
