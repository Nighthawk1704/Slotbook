# Decisions

## The two things that actually matter

**One slot, one booking.** The whole app hinges on this being correct under
concurrent requests, so I pushed the guarantee down to the database instead of
guarding it in application code. There's a partial unique index:

```sql
CREATE UNIQUE INDEX one_active_booking_per_slot
  ON bookings (slot_id) WHERE status = 'active';
```

Booking is a bare `INSERT` — no check-then-write, so there's no read-to-write
race window. If two requests try to book the same slot, Postgres accepts one and
rejects the other with a unique-violation (`23505`), which I catch and turn into
"someone just booked this slot." Because the index is *partial* (active only), a
cancelled booking frees the slot for rebooking without any extra bookkeeping.
I considered `SELECT … FOR UPDATE` and an `UPDATE … WHERE status='available'`
compare-and-swap; both work, but the index needs no lock management and can't be
bypassed by a future code path that forgets to lock. Availability is *derived*
(a slot with no active booking) rather than a mutable `slots.status` column, so
there's a single source of truth that can't drift.

**Time zones.** Every instant is stored as `timestamptz` in UTC; wall-clock math
is never done by hand. Each user has an IANA zone (e.g. `Asia/Kolkata`), and
display converts UTC → that zone at render via `Intl.DateTimeFormat`, which
handles DST and half-hour offsets for free. Slots show in the viewer's zone with
the provider's local time underneath when they differ — so the conversion is
visible, not just claimed. Verified with a round-trip test across four zones.

## Other choices

- **Drizzle** over Prisma so the partial index lives in the schema explicitly and
  is easy to read in the generated migration.
- **Auth**: email + password (bcrypt) with a signed JWT in an httpOnly cookie via
  `jose`. Deliberately minimal — enough to have real per-user ownership without
  spending the budget on an OAuth setup. Ownership is enforced in query `WHERE`
  clauses (you can only cancel *your* active booking), not just in the UI.
- **Reschedule** = cancel-old + book-new inside one transaction, so you can never
  end up cancelled-but-not-rebooked or double-booked; if the new slot is taken,
  the whole thing rolls back.
- **Filtering/pagination** state lives in the URL (`?provider=&date=&page=`), so
  views are shareable and the back button works. Pagination is offset-based with
  a fetch-one-extra trick to know if there's a next page.

## What's weak / what I'd do next

- **Offset pagination** is fine at this scale but drifts if rows are inserted
  between page loads; I'd move to keyset (cursor on `start_at`) for correctness at
  volume.
- **No provider UI** — slots are created via seed. A provider dashboard to publish
  slots is the obvious next feature; the data model already supports it.
- **Auth is basic** — no refresh tokens, rate limiting, or email verification. For
  production I'd use a vetted library and add lockout on failed logins.
- **Date filter** treats the day as a UTC boundary; a user near midnight in a far
  zone could see a slot filed under an adjacent day. I'd filter on the viewer's
  civil day instead.
- **No automated tests in the repo** — I verified the timezone math and the index
  SQL manually. The first tests I'd add: a concurrent-booking race test and a
  reschedule-rollback test.

## Cut on purpose

Provider slot-management UI, email/magic-link auth, real-time updates, and a test
suite — all cut to stay inside the time budget. The core (concurrency + time
zones + the required user flows) is where I spent the time, because that's what
the brief said was trickier than it looks.
