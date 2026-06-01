import type { Temporal } from 'temporal-spec'

/*
Temporal option input helpers.

The canonical public option shapes come from temporal-spec. This file only
projects and recombines those shapes for internal algorithms that need a
smaller operation-specific view, or a local generic for refined records.
*/

export type FractionalSecondDigits =
  Temporal.PlainTimeToStringOptions['fractionalSecondDigits']
export type SubsecDigits = Exclude<NonNullable<FractionalSecondDigits>, 'auto'>

// use ONLY for type scraping, not externally
type RoundingUnit = Temporal.DateUnit | Temporal.TimeUnit
type RoundingOptionBag = Temporal.RoundingOptions<RoundingUnit>

export type RoundingModeName = RoundingOptionBag['roundingMode']
export type RoundingMathOptions = Pick<
  RoundingOptionBag,
  'roundingIncrement' | 'roundingMode'
>

export type RelativeToOptions<RA> = {
  relativeTo?: RA | undefined
}

export type DurationRoundingOptions<RA> = Omit<
  Temporal.DurationRoundingOptions,
  'relativeTo'
> &
  RelativeToOptions<RA>

export type DurationTotalOptions<RA> = Pick<
  Temporal.DurationTotalOptions,
  'unit'
> &
  RelativeToOptions<RA>

export type InstantStringTimeZoneDisplayOptions = Omit<
  Temporal.InstantToStringOptions,
  'timeZone'
> & {
  timeZone?: string | undefined
}
