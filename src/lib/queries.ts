import { and, asc, desc, eq, gt, gte, lt, sql, notExists } from "drizzle-orm";
import { db } from "@/db";
import { slots, bookings, users } from "@/db/schema";

export const PAGE_SIZE = 8;

export type SlotFilters = {
  providerId?: string;
  /** ISO date (yyyy-mm-dd) interpreted as a UTC day boundary for simplicity. */
  date?: string;
  page: number;
};

export async function getProviders() {
  return db
    .select({ id: users.id, name: users.name, timezone: users.timezone })
    .from(users)
    .where(eq(users.role, "provider"))
    .orderBy(asc(users.name));
}

/** Available = future slots with no active booking. Supports filter + pagination. */
export async function getAvailableSlots(filters: SlotFilters) {
  const now = new Date();

  const conds = [gt(slots.startAt, now)];
  if (filters.providerId) conds.push(eq(slots.providerId, filters.providerId));
  if (filters.date) {
    const start = new Date(`${filters.date}T00:00:00.000Z`);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    conds.push(gte(slots.startAt, start));
    conds.push(lt(slots.startAt, end));
  }

  // Exclude slots that already have an active booking.
  const noActiveBooking = notExists(
    db
      .select({ one: sql`1` })
      .from(bookings)
      .where(
        and(eq(bookings.slotId, slots.id), eq(bookings.status, "active")),
      ),
  );
  conds.push(noActiveBooking);

  const where = and(...conds);
  const offset = (filters.page - 1) * PAGE_SIZE;

  const rows = await db
    .select({
      id: slots.id,
      startAt: slots.startAt,
      endAt: slots.endAt,
      providerName: users.name,
      providerTz: users.timezone,
    })
    .from(slots)
    .innerJoin(users, eq(slots.providerId, users.id))
    .where(where)
    .orderBy(asc(slots.startAt))
    .limit(PAGE_SIZE + 1) // fetch one extra to know if there's a next page
    .offset(offset);

  const hasNext = rows.length > PAGE_SIZE;
  return { slots: rows.slice(0, PAGE_SIZE), hasNext, page: filters.page };
}

/** A user's own bookings (active first, then cancelled), with slot + provider info. */
export async function getMyBookings(userId: string) {
  return db
    .select({
      bookingId: bookings.id,
      status: bookings.status,
      startAt: slots.startAt,
      endAt: slots.endAt,
      providerName: users.name,
      providerTz: users.timezone,
    })
    .from(bookings)
    .innerJoin(slots, eq(bookings.slotId, slots.id))
    .innerJoin(users, eq(slots.providerId, users.id))
    .where(eq(bookings.userId, userId))
    .orderBy(desc(bookings.status), asc(slots.startAt));
}
