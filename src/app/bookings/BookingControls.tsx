"use client";

import { useState, useTransition } from "react";
import { cancelBooking, rescheduleBooking } from "@/app/actions/bookings";

type Option = { id: string; label: string };

export default function BookingControls({
  bookingId,
  options,
}: {
  bookingId: string;
  options: Option[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [target, setTarget] = useState("");

  function onCancel() {
    setError(null);
    startTransition(async () => {
      const res = await cancelBooking(bookingId);
      if (!res.ok) setError(res.message ?? "Something went wrong.");
    });
  }

  function onReschedule() {
    if (!target) {
      setError("Pick a slot to move to.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await rescheduleBooking(bookingId, target);
      if (!res.ok) setError(res.message ?? "Something went wrong.");
      else setPicking(false);
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {picking ? (
        <div className="flex items-center gap-2">
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="max-w-[16rem] rounded-lg border border-slateline bg-white px-2 py-1.5 text-sm"
          >
            <option value="">Move to…</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            onClick={onReschedule}
            disabled={pending}
            className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-60"
          >
            {pending ? "…" : "Confirm"}
          </button>
          <button
            onClick={() => {
              setPicking(false);
              setError(null);
            }}
            className="text-sm text-muted hover:text-ink"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPicking(true)}
            className="rounded-lg border border-slateline bg-white px-3 py-1.5 text-sm font-medium hover:border-accent hover:text-accent transition-colors"
          >
            Reschedule
          </button>
          <button
            onClick={onCancel}
            disabled={pending}
            className="rounded-lg border border-slateline bg-white px-3 py-1.5 text-sm font-medium text-taken hover:bg-taken-dim transition-colors disabled:opacity-60"
          >
            {pending ? "…" : "Cancel"}
          </button>
        </div>
      )}
      {error ? <span className="text-xs text-taken">{error}</span> : null}
    </div>
  );
}
