import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logout } from "@/app/actions/auth";
import { zoneCity } from "@/lib/time";

export default async function Nav() {
  const user = await getCurrentUser();
  return (
    <header className="border-b border-slateline bg-paper">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/slots" className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-ink text-paper text-sm font-semibold">
            S
          </span>
          <span className="text-lg font-semibold tracking-tight">Slotbook</span>
        </Link>
        {user ? (
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/slots" className="text-muted hover:text-ink transition-colors">
              Available slots
            </Link>
            <Link href="/bookings" className="text-muted hover:text-ink transition-colors">
              My bookings
            </Link>
            <span className="hidden text-muted sm:inline">
              {user.name} · {zoneCity(user.timezone)}
            </span>
            <form action={logout}>
              <button className="text-muted hover:text-ink transition-colors" type="submit">
                Sign out
              </button>
            </form>
          </nav>
        ) : null}
      </div>
    </header>
  );
}
