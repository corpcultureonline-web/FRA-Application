import Link from "next/link";
import { Logo } from "./Logo";

export function AuditHeader() {
  return (
    <header className="border-b border-black/10">
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-5 sm:h-20 sm:px-8 xl:px-0">
        <Link href="/" aria-label="Corporate Culture home">
          <Logo compact />
        </Link>
        <p className="text-sm font-bold text-muted sm:text-[15px]">Franchise Readiness Audit</p>
      </div>
    </header>
  );
}
