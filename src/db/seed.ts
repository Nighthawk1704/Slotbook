import "dotenv/config";
import { db } from "./index";
import { users, slots, bookings } from "./schema";
import bcrypt from "bcryptjs";

/**
 * Build a UTC instant from a wall-clock time in a given IANA zone.
 * We compute the zone's offset for that date via Intl, then subtract it.
 * (Good enough for seed data; production slot creation uses the same idea.)
 */
function zonedToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  const asUtc = Date.UTC(year, month - 1, day, hour, minute);
  const guess = new Date(asUtc);
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(guess).map((p) => [p.type, p.value]),
  );
  const local = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
  );
  const offset = local - asUtc;
  return new Date(asUtc - offset);
}

async function main() {
  console.log("Clearing existing data…");
  await db.delete(bookings);
  await db.delete(slots);
  await db.delete(users);

  const pw = await bcrypt.hash("password123", 10);

  console.log("Seeding users…");
  const [drReed, drOsei, alice, bob] = await db
    .insert(users)
    .values([
      {
        email: "reed@provider.test",
        passwordHash: pw,
        name: "Dr. Reed",
        timezone: "America/New_York",
        role: "provider",
      },
      {
        email: "osei@provider.test",
        passwordHash: pw,
        name: "Dr. Osei",
        timezone: "Asia/Kolkata",
        role: "provider",
      },
      {
        email: "alice@user.test",
        passwordHash: pw,
        name: "Alice",
        timezone: "Europe/London",
        role: "user",
      },
      {
        email: "bob@user.test",
        passwordHash: pw,
        name: "Bob",
        timezone: "Asia/Tokyo",
        role: "user",
      },
    ])
    .returning();

  console.log("Seeding slots across the next few days…");
  const base = new Date();
  const providers = [
    { p: drReed, tz: "America/New_York" },
    { p: drOsei, tz: "Asia/Kolkata" },
  ];
  const hours = [9, 10, 11, 14, 15, 16];

  const slotRows: (typeof slots.$inferInsert)[] = [];
  for (let dayOffset = 1; dayOffset <= 5; dayOffset++) {
    const d = new Date(base);
    d.setDate(d.getDate() + dayOffset);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const day = d.getDate();
    for (const { p, tz } of providers) {
      // Each provider publishes a couple of slots per day, in THEIR local time.
      for (const h of hours.filter((_, i) => (dayOffset + i) % 2 === 0)) {
        const start = zonedToUtc(y, m, day, h, 0, tz);
        const end = zonedToUtc(y, m, day, h, 30, tz);
        slotRows.push({ providerId: p.id, startAt: start, endAt: end });
      }
    }
  }
  const insertedSlots = await db.insert(slots).values(slotRows).returning();
  console.log(`  ${insertedSlots.length} slots created.`);

  console.log("Seeding a couple of bookings…");
  await db.insert(bookings).values([
    { slotId: insertedSlots[0].id, userId: alice.id, status: "active" },
    { slotId: insertedSlots[3].id, userId: bob.id, status: "active" },
  ]);

  console.log("\nDone. Sign in with any of these (password: password123):");
  console.log("  reed@provider.test   (provider, New York)");
  console.log("  osei@provider.test   (provider, Kolkata)");
  console.log("  alice@user.test      (user, London)");
  console.log("  bob@user.test        (user, Tokyo)");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
