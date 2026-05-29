import { Temporal as TemporalSpec } from 'temporal-spec'
import { DayTimeUnitName, TimeUnitName, UnitName } from './units'

/*
Raw Temporal option input shapes.

These types describe option bags before observable property reads, defaulting,
validation, or string-to-enum coercion. Most values arrive directly from user
API arguments, but some callers fabricate equivalent null-prototype bags for
internal reuse. Either way, these are still unrefined input shapes.
*/

export type SubsecDigits = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

export type ZonedFieldOptions = OverflowOptions &
  EpochDisambigOptions &
  OffsetDisambigOptions

export type RoundingMathOptions = RoundingIncOptions & RoundingModeOptions

export type DiffOptions<UN extends UnitName> = LargestUnitOptions<UN> &
  SmallestUnitOptions<UN> &
  RoundingMathOptions

// Raw option-bag composition for datetime-like round() methods.
export type RoundingOptions<UN extends DayTimeUnitName> = Required<
  SmallestUnitOptions<UN>
> &
  RoundingMathOptions

export type DurationRoundingOptions<RA> = Required<
  SmallestUnitOptions<UnitName>
> &
  LargestUnitOptions<UnitName> &
  RoundingMathOptions &
  RelativeToOptions<RA>

export type TimeDisplayOptions = SmallestUnitOptions<TimeUnitName> &
  RoundingModeOptions &
  SubsecDigitsOptions

export type ZonedDateTimeDisplayOptions = CalendarDisplayOptions &
  TimeZoneDisplayOptions &
  OffsetDisplayOptions &
  TimeDisplayOptions

export type RelativeToOptions<RA> = { relativeTo?: RA }
export type DurationTotalOptions<RA> = TotalUnitOptions & RelativeToOptions<RA>

export type DateTimeDisplayOptions = CalendarDisplayOptions & TimeDisplayOptions

export type InstantDisplayOptions = { timeZone?: string } & TimeDisplayOptions

// Individual raw option fragments. These mirror API option properties before
// observable property reads, defaulting, and conversion to internal enums.
export interface SmallestUnitOptions<UN extends UnitName> {
  smallestUnit?: UN
}

export interface LargestUnitOptions<UN extends UnitName> {
  largestUnit?: UN
}

export interface TotalUnitOptions {
  unit: UnitName
}

export interface OverflowOptions {
  overflow?: 'constrain' | 'reject' | undefined
}

export interface EpochDisambigOptions {
  disambiguation?: 'compatible' | 'earlier' | 'later' | 'reject' | undefined
}

export interface OffsetDisambigOptions {
  offset?: TemporalSpec.ZonedDateTimeFromOptions['offset']
}

export interface CalendarDisplayOptions {
  calendarName?: 'auto' | 'always' | 'never' | 'critical' | undefined
}

export interface TimeZoneDisplayOptions {
  timeZoneName?: TemporalSpec.ZonedDateTimeToStringOptions['timeZoneName']
}

export interface OffsetDisplayOptions {
  offset?: TemporalSpec.ZonedDateTimeToStringOptions['offset']
}

// Raw string names accepted for roundingMode before coercion to RoundingMode.
export type RoundingModeName = TemporalSpec.RoundingOptions<
  TemporalSpec.DateUnit | TemporalSpec.TimeUnit
>['roundingMode']

export interface RoundingModeOptions {
  roundingMode?: RoundingModeName
}

export interface RoundingIncOptions {
  roundingIncrement?: TemporalSpec.RoundingOptions<
    TemporalSpec.DateUnit | TemporalSpec.TimeUnit
  >['roundingIncrement']
}

export interface SubsecDigitsOptions {
  fractionalSecondDigits?: SubsecDigits // TODO: accept 'auto' ?
}

export type DirectionName = 'next' | 'previous'

export interface DirectionOptions {
  direction: DirectionName
}
