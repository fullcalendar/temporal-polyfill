import type { Temporal } from 'temporal-spec'

export type DateTimeObj = Temporal.PlainDateTime | Temporal.ZonedDateTime
export type DateObj = Temporal.PlainDate | DateTimeObj
export type YearMonthObj = Temporal.PlainYearMonth | DateObj

// Options
// -----------------------------------------------------------------------------

export type RoundingOptions = {
  roundingMode?: Temporal.RoundingMode
}

export function normalizeRoundingOptions<T extends RoundingOptions>(
  options: Temporal.RoundingMode | T | undefined,
): T | undefined {
  return typeof options === 'string'
    ? ({ roundingMode: options } as T)
    : options
}
