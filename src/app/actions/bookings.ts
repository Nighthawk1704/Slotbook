"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { bookings, slots } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export type ActionResult = { ok: boolean; message?: string };

/** Postgres unique-violation error code. */
const UNIQUE_VIOLATION = "23505";

function isUniqueViolation(e: unknown): boolean {
  return typeof e === "object" && e !== null && "code" in e &&
    (e as { code?: string }).code === UNIQUE_VIOLATION;
}

export async function bookSlot(slotId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in." };

  // Guard: slot must exist and not be in the past.
  const [slot] = await db.select().from(slots).where(eq(slots.id, slotId));
  if (!slot) return { ok: false, message: "That slot no longer exists." };
  if (slot.startAt.getTime() <= Date.now()) {
    return { ok: false, message: "That slot is in the past." };
  }

  try {
    // The partial unique index (one active booking per slot) is what actually
    // prevents double-booking under concurrent requests. We don't check-then-
    // insert; we just insert and let the DB reject a second active booking.
    await db.insert(bookings).values({ slotId, userId: user.id, status: "active" });
  } catch (e) {
    if (isUniqueViolation(e)) {
      return { ok: false, message: "Someone just booked this slot. Try another." };
    }
    throw e;
  }

  revalidatePath("/slots");
  revalidatePath("/bookings");
  return { ok: true, message: "Booked." };
}

export async function cancelBooking(bookingId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in." };

  // Ownership + status enforced in the WHERE clause: only the owner's own
  // active booking is affected. rowCount tells us whether it applied.
  const res = await db
    .update(bookings)
    .set({ status: "cancelled", cancelledAt: new Date() })
    .where(
      and(
        eq(bookings.id, bookingId),
        eq(bookings.userId, user.id),
        eq(bookings.status, "active"),
      ),
    );

  if (res.count === 0) {
    return { ok: false, message: "Couldn't cancel that booking." };
  }
  revalidatePath("/slots");
  revalidatePath("/bookings");
  return { ok: true, message: "Cancelled." };
}

/**
 * Reschedule = free the old slot and claim a new one, atomically.
 * Done in a transaction so we never end up cancelled-but-not-rebooked
 * (or double-booked). If the new slot is taken, the whole thing rolls back.
 */
export async function rescheduleBooking(
  bookingId: string,
  newSlotId: string,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in." };

  const [newSlot] = await db.select().from(slots).where(eq(slots.id, newSlotId));
  if (!newSlot) return { ok: false, message: "That new slot no longer exists." };
  if (newSlot.startAt.getTime() <= Date.now()) {
    return { ok: false, message: "That new slot is in the past." };
  }

  try {
    const result = await db.transaction(async (tx) => {
      const cancelled = await tx
        .update(bookings)
        .set({ status: "cancelled", cancelledAt: new Date() })
        .where(
          and(
            eq(bookings.id, bookingId),
            eq(bookings.userId, user.id),
            eq(bookings.status, "active"),
          ),
        );
      if (cancelled.count === 0) {
        // Nothing to reschedule; abort without touching the new slot.
        return { ok: false as const, message: "Original booking not found." };
      }
      await tx.insert(bookings).values({
        slotId: newSlotId,
        userId: user.id,
        status: "active",
      });
      return { ok: true as const };
    });

    if (!result.ok) return result;
  } catch (e) {
    if (isUniqueViolation(e)) {
      return { ok: false, message: "That new slot was just taken. Pick another." };
    }
    throw e;
  }

  revalidatePath("/slots");
  revalidatePath("/bookings");
  return { ok: true, message: "Rescheduled." };
}
