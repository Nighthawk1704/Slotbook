import { redirect } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import { getCurrentUser } from "@/lib/auth";
import { getAvailableSlots, getProviders } from "@/lib/queries";
import { formatSlotTime, formatTimeOnly, zoneAbbrev, zoneCity } from "@/lib/time";
import BookButton from "./BookButton";

type SearchParams = Promise<{ provider?: string; date?: string; page?: string }>;

export default async function SlotsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const providers = await getProviders();
  const { slots, hasNext } = await getAvailableSlots({
    providerId: sp.provider || undefined,
    date: sp.date || undefined,
    page,
  });

  const buildQuery = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { provider: sp.provider, date: sp.date, ...overrides };
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
    const s = params.toString();
    return s ? `/slots?${s}` : "/slots";
  };

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Available slots</h1>
          <p className="mt-1 text-muted">
            Times shown in your zone ({zoneCity(user.timezone)}), with the
            provider&apos;s local time underneath.
          </p>
        </div>

        {/* Filters — a plain GET form so state lives in the URL. */}
        <form className="mb-6 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="provider" className="mb-1 block text-sm font-medium">
              Provider
            </label>
            <select
              id="provider"
              name="provider"
              defaultValue={sp.provider ?? ""}
              className="rounded-lg border border-slateline bg-white px-3 py-2"
            >
              <option value="">All providers</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({zoneCity(p.timezone)})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="date" className="mb-1 block text-sm font-medium">
              Date
            </label>
            <input
              id="date"
              name="date"
              type="date"
              defaultValue={sp.date ?? ""}
              className="rounded-lg border border-slateline bg-white px-3 py-2"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg border border-slateline bg-white px-4 py-2 font-medium hover:border-accent hover:text-accent transition-colors"
          >
            Apply
          </button>
          {(sp.provider || sp.date) && (
            <Link href="/slots" className="px-2 py-2 text-sm text-muted hover:text-ink">
              Clear
            </Link>
          )}
        </form>

        {slots.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slateline p-12 text-center">
            <p className="font-medium">No open slots match this view.</p>
            <p className="mt-1 text-muted">
              Try a different provider or date, or clear the filters.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slateline overflow-hidden rounded-lg border border-slateline bg-white">
            {slots.map((slot) => {
              const sameZone = slot.providerTz === user.timezone;
              return (
                <li
                  key={slot.id}
                  className="flex items-center justify-between gap-4 px-5 py-4"
                >
                  <div>
                    <p className="tnum font-medium">
                      {formatSlotTime(slot.startAt, user.timezone)} –{" "}
                      {formatTimeOnly(slot.endAt, user.timezone)}{" "}
                      <span className="text-muted">
                        {zoneAbbrev(slot.startAt, user.timezone)}
                      </span>
                    </p>
                    <p className="mt-0.5 text-sm text-muted">
                      {slot.providerName}
                      {sameZone ? null : (
                        <>
                          {" · "}
                          <span className="tnum">
                            {formatTimeOnly(slot.startAt, slot.providerTz)}{" "}
                            {zoneAbbrev(slot.startAt, slot.providerTz)}
                          </span>{" "}
                          their time
                        </>
                      )}
                    </p>
                  </div>
                  <BookButton slotId={slot.id} />
                </li>
              );
            })}
          </ul>
        )}

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-between">
          {page > 1 ? (
            <Link
              href={buildQuery({ page: String(page - 1) })}
              className="rounded-lg border border-slateline bg-white px-4 py-2 text-sm font-medium hover:border-accent hover:text-accent transition-colors"
            >
              ← Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm text-muted">Page {page}</span>
          {hasNext ? (
            <Link
              href={buildQuery({ page: String(page + 1) })}
              className="rounded-lg border border-slateline bg-white px-4 py-2 text-sm font-medium hover:border-accent hover:text-accent transition-colors"
            >
              Next →
            </Link>
          ) : (
            <span />
          )}
        </div>
      </main>
    </>
  );
}
