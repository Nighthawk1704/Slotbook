/**
 * All instants are stored/passed as UTC Date objects. These helpers render them
 * in a given IANA timezone. No wall-clock math is ever done by hand — Intl does
 * the zone conversion, which handles DST correctly.
 */

export function formatInZone(
  date: Date,
  timeZone: string,
  opts: Intl.DateTimeFormatOptions = {},
) {
  return new Intl.DateTimeFormat("en-US", { timeZone, ...opts }).format(date);
}

export function formatSlotTime(date: Date, timeZone: string) {
  return formatInZone(date, timeZone, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatTimeOnly(date: Date, timeZone: string) {
  return formatInZone(date, timeZone, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDayHeading(date: Date, timeZone: string) {
  return formatInZone(date, timeZone, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/** Short zone label like "GMT+5:30" for the given instant + zone. */
export function zoneAbbrev(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
  }).formatToParts(date);
  return parts.find((p) => p.type === "timeZoneName")?.value ?? timeZone;
}

/** A short, friendly city label from an IANA name, e.g. "Asia/Kolkata" -> "Kolkata". */
export function zoneCity(timeZone: string) {
  const tail = timeZone.split("/").pop() ?? timeZone;
  return tail.replace(/_/g, " ");
}
