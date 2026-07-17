"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/actions/auth";

const initial: LoginState = {};

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initial);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue="alice@user.test"
          className="w-full rounded-lg border border-slateline bg-white px-3 py-2 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          defaultValue="password123"
          className="w-full rounded-lg border border-slateline bg-white px-3 py-2 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </div>
      {state.error ? (
        <p className="text-sm text-taken">{state.error}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-accent px-3 py-2 font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
