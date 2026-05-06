export const isoCalendarId = 'iso8601'
export const gregoryCalendarId = 'gregory'

// Gregorian CE/BCE input resolves relative to ISO year 0:
// CE 1 -> ISO 1, BCE 1 -> ISO 0, BCE 2 -> ISO -1, etc.
export const gregoryEraOrigins: Record<string, number> = { bce: -1, ce: 0 }

// Normalize era names from either user input or Intl output into a stable,
// punctuation-insensitive token before applying calendar-specific remaps.
export function normalizeEraName(era: string): string {
  const normalized = era
    .normalize('NFD') // 'Shōwa' -> 'Showa'
    .toLowerCase() // 'Before R.O.C.' -> 'before r.o.c.'
    .replace(/[^a-z0-9]/g, '') // 'before r.o.c.' -> 'beforeroc'

  // Firefox historically returned one-letter era names for some calendars.
  if (normalized === 'bc' || normalized === 'b') {
    return 'bce'
  }
  if (normalized === 'ad' || normalized === 'a') {
    return 'ce'
  }

  return normalized
}
