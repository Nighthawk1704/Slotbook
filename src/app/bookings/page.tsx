import { redirect } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import { getCurrentUser } from "@/lib/auth";
import { getMyBookings, getAvailableSlots } from "@/lib/queries";
import { formatSlotTime, formatTimeOnly, zoneAbbrev, zoneCity } from "@/lib/time";
import BookingControls from "./BookingControls";

export default async function BookingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const myBookings = await getMyBookings(user.id);
  // Provide a small pool of open slots for the reschedule picker.
  const { slots: openSlots } = await getAvailableSlots({ page: 1 });
  const rescheduleOptions = openSlots.map((s) => ({
    id: s.id,
    label: `${formatSlotTime(s.startAt, user.timezone)} · ${s.providerName}`,
  }));

  const active = myBookings.filter((b) => b.status === "active");
  const cancelled = myBookings.filter((b) => b.status === "cancelled");

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">My bookings</h1>
          <p className="mt-1 text-muted">
            Shown in your zone ({zoneCity(user.timezone)}).
          </p>
        </div>

        {active.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slateline p-12 text-center">
            <p className="font-medium">You have no upcoming bookings.</p>
            <p className="mt-1 text-muted">
              Head to{" "}
              <Link href="/slots" className="text-accent hover:underline">
                available slots
              </Link>{" "}
              to book one.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slateline overflow-hidden rounded-lg border border-slateline bg-white">
            {active.map((b) => {
              const sameZone = b.providerTz === user.timezone;
              const past = b.startAt.getTime() <= Date.now();
              return (
                <li key={b.bookingId} className="px-5 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="tnum font-medium">
                        {formatSlotTime(b.startAt, user.timezone)} –{" "}
                        {formatTimeOnly(b.endAt, user.timezone)}{" "}
                        <span className="text-muted">
                          {zoneAbbrev(b.startAt, user.timezone)}
                        </span>
                      </p>
                      <p className="mt-0.5 text-sm text-muted">
                        {b.providerName}
                        {sameZone ? null : (
                          <>
                            {" · "}
                            <span className="tnum">
                              {formatTimeOnly(b.startAt, b.providerTz)}{" "}
                              {zoneAbbrev(b.startAt, b.providerTz)}
                            </span>{" "}
                            their time
                          </>
                        )}
                        {past ? " · past" : ""}
                      </p>
                    </div>
                    {!past && (
                      <BookingControls
                        bookingId={b.bookingId}
                        options={rescheduleOptions}
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {cancelled.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
              Cancelled
            </h2>
            <ul className="divide-y divide-slateline overflow-hidden rounded-lg border border-slateline bg-white">
              {cancelled.map((b) => (
                <li key={b.bookingId} className="px-5 py-3 text-sm text-muted">
                  <span className="tnum line-through">
                    {formatSlotTime(b.startAt, user.timezone)}
                  </span>{" "}
                  · {b.providerName}
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </>
  );
}
