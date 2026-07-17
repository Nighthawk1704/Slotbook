import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/slots");

  return (
    <main className="mx-auto grid min-h-screen max-w-5xl place-items-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-ink text-paper font-semibold">
            S
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">Slotbook</h1>
        </div>
        <p className="mb-6 text-muted">Book time across time zones.</p>

        <LoginForm />

        <div className="mt-8 rounded-lg border border-slateline bg-white p-4 text-sm">
          <p className="mb-2 font-medium">Seeded accounts</p>
          <p className="text-muted">Password for all: <span className="tnum">password123</span></p>
          <ul className="mt-2 space-y-1 text-muted">
            <li>reed@provider.test — provider, New York</li>
            <li>osei@provider.test — provider, Kolkata</li>
            <li>alice@user.test — user, London</li>
            <li>bob@user.test — user, Tokyo</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
