# Slotbook

A small appointment-booking app. Providers publish time slots; users book, cancel,
and reschedule them. A slot can be held by only one person at a time, and every time
is shown correctly for whoever is looking at it, regardless of time zone.

Built with **Next.js (App Router) + PostgreSQL + Drizzle ORM**.

---

## Run it

You need Docker (for Postgres) and Node 20+.

```bash
# 1. Install deps
npm install

# 2. Start Postgres
docker compose up -d

# 3. Configure env (defaults already match docker-compose)
cp .env.example .env

# 4. Create the schema and seed data
npm run db:push
npm run db:seed

# 5. Run
npm run dev
```

Open http://localhost:3000.

### Seeded accounts

Password for all of them is `password123`.

| Email                | Role     | Time zone       |
| -------------------- | -------- | --------------- |
| reed@provider.test   | provider | America/New_York |
| osei@provider.test   | provider | Asia/Kolkata     |
| alice@user.test      | user     | Europe/London    |
| bob@user.test        | user     | Asia/Tokyo       |

The providers and users are deliberately in different zones so the timezone
handling is visible the moment you sign in: log in as **alice** (London) and
you'll see Dr. Osei's Kolkata slots rendered in London time, with Kolkata time
shown underneath.

## Try the interesting bits

- **Double-booking:** open two browsers (alice + bob), both on `/slots`, and book
  the same slot at the same time. One succeeds; the other gets *"Someone just
  booked this slot."* — the database rejects the second write.
- **Time zones:** book a slot as alice, then sign in as bob (Tokyo) — the same
  instant shows in Tokyo time.
- **Reschedule:** on `/bookings`, move a booking to another open slot. It frees
  the old slot and claims the new one atomically.

## Scripts

| Command              | What it does                          |
| -------------------- | ------------------------------------- |
| `npm run dev`        | Dev server                            |
| `npm run db:push`    | Apply schema to the database          |
| `npm run db:seed`    | Reset + seed sample data              |
| `npm run db:generate`| Generate a SQL migration from schema  |
| `npm run build`      | Production build                      |

See **DECISIONS.md** for the design rationale, trade-offs, and what I'd do next.
