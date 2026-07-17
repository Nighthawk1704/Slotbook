"use client";

import { useState, useTransition } from "react";
import { bookSlot } from "@/app/actions/bookings";

export default function BookButton({ slotId }: { slotId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    setError(null);
    startTransition(async () => {
      const res = await bookSlot(slotId);
      if (!res.ok) setError(res.message ?? "Something went wrong.");
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={onClick}
        disabled={pending}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-60"
      >
        {pending ? "Booking…" : "Book"}
      </button>
      {error ? <span className="text-xs text-taken">{error}</span> : null}
    </div>
  );
}
