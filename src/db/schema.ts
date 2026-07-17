import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

export const userRole = pgEnum("user_role", ["provider", "user"]);
export const bookingStatus = pgEnum("booking_status", ["active", "cancelled"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  // IANA timezone name, e.g. "Asia/Kolkata". Drives all display conversion.
  timezone: text("timezone").notNull().default("UTC"),
  role: userRole("role").notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const slots = pgTable(
  "slots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // Stored as UTC instants (timestamptz). Never store wall-clock/local time.
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("slots_provider_start_idx").on(t.providerId, t.startAt),
    index("slots_start_idx").on(t.startAt),
  ],
);

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slotId: uuid("slot_id")
      .notNull()
      .references(() => slots.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: bookingStatus("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  },
  (t) => [
    // THE core invariant: a slot can have at most ONE active booking.
    // Enforced by the database, not application code — two racing bookings
    // both try to insert an active row for the same slot; Postgres rejects
    // the second with a unique violation. This is a partial index, so
    // cancelled bookings don't count and a freed slot can be rebooked.
    uniqueIndex("one_active_booking_per_slot")
      .on(t.slotId)
      .where(sql`${t.status} = 'active'`),
    index("bookings_user_idx").on(t.userId),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  slots: many(slots),
  bookings: many(bookings),
}));

export const slotsRelations = relations(slots, ({ one, many }) => ({
  provider: one(users, { fields: [slots.providerId], references: [users.id] }),
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  slot: one(slots, { fields: [bookings.slotId], references: [slots.id] }),
  user: one(users, { fields: [bookings.userId], references: [users.id] }),
}));
