import { Temporal as TemporalSpec } from 'temporal-spec'
import { DayTimeUnitName, TimeUnitName, Unit, UnitName } from './units'

/*
Shared internal option model.

This file owns the internal option enums plus the structural option bag and
tuple contracts. Keeping the model apart from normalization, coercion,
validation, and call-site refinement avoids pulling implementation helpers into
otherwise independent option modules.
*/

export const enum Overflow {
  Constrain = 0,
  Reject = 1,
}

export const enum EpochDisambig {
  Compat = 0,
  Reject = 1,
  Earlier = 2,
  Later = 3,
}

export const enum OffsetDisambig {
  Reject = 0,
  Use = 1,
  Prefer = 2,
  Ignore = 3,
}

export const enum CalendarDisplay {
  Auto = 0,
  Never = 1,
  Critical = 2,
  Always = 3,
}

export const enum TimeZoneDisplay {
  Auto = 0,
  Never = 1,
  Critical = 2,
}

export const enum OffsetDisplay {
  Auto = 0,
  Never = 1,
}

export const enum RoundingMode {
  // Modes that get inverted by optionsRoundingRefine.invertRoundingMode.
  // If this enum changes, update roundingModeMap and roundingModeFuncs in
  // optionsConfig so string coercion and rounding dispatch stay aligned.
  Floor = 0,
  HalfFloor = 1,
  Ceil = 2,
  HalfCeil = 3,
  // other modes
  Trunc = 4,
  HalfTrunc = 5,
  Expand = 6,
  HalfExpand = 7,
  HalfEven = 8,
}

export type SubsecDigits = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

/*
common SubsecDigits addons:
  -1 means hide seconds
  undefined means 'auto' (display all digits but no trailing zeros)
*/

export const enum Direction {
  Previous = -1, // compatible with internal getTransition
  Next = 1, // "
}

export type ZonedFieldOptions = OverflowOptions &
  EpochDisambigOptions &
  OffsetDisambigOptions

export type ZonedFieldTuple = [Overflow, OffsetDisambig, EpochDisambig]

export type RoundingMathOptions = RoundingIncOptions & RoundingModeOptions

export type DiffOptions<UN extends UnitName> = LargestUnitOptions<UN> &
  SmallestUnitOptions<UN> &
  RoundingMathOptions

export type RoundingMathTuple = [
  roundingInc: number,
  roundingMode: RoundingMode,
]

export type RoundingTuple = [smallestUnit: Unit, ...RoundingMathTuple]

export type DiffTuple = [larestUnit: Unit, ...RoundingTuple]

// for datetime-like
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

export type DurationRoundingTuple<R> = [...DiffTuple, R]

export type TimeDisplayTuple = [
  roundingMode: RoundingMode,
  nanoInc: number,
  subsecDigits: SubsecDigits | -1 | undefined, // TODO: change -1 to null?
]

export type TimeDisplayOptions = SmallestUnitOptions<TimeUnitName> &
  RoundingModeOptions &
  SubsecDigitsOptions

export type ZonedDateTimeDisplayOptions = CalendarDisplayOptions &
  TimeZoneDisplayOptions &
  OffsetDisplayOptions &
  TimeDisplayOptions

export type ZonedDateTimeDisplayTuple = [
  CalendarDisplay,
  TimeZoneDisplay,
  OffsetDisplay,
  ...TimeDisplayTuple,
]

export type RelativeToOptions<RA> = { relativeTo?: RA }
export type DurationTotalOptions<RA> = TotalUnitOptions & RelativeToOptions<RA>

export type DateTimeDisplayOptions = CalendarDisplayOptions & TimeDisplayOptions

export type DateTimeDisplayTuple = [CalendarDisplay, ...TimeDisplayTuple]

export interface SmallestUnitOptions<UN extends UnitName> {
  smallestUnit?: UN
}

export interface LargestUnitOptions<UN extends UnitName> {
  largestUnit?: UN
}

export interface TotalUnitOptions {
  unit: UnitName
}

export type InstantDisplayOptions = { timeZone?: string } & TimeDisplayOptions

export type InstantDisplayTuple = [string | undefined, ...TimeDisplayTuple]

export interface OverflowOptions {
  overflow?: TemporalSpec.AssignmentOptions['overflow']
}

export interface EpochDisambigOptions {
  disambiguation?: TemporalSpec.ToInstantOptions['disambiguation']
}

export interface OffsetDisambigOptions {
  offset?: TemporalSpec.OffsetDisambiguationOptions['offset']
}

export interface CalendarDisplayOptions {
  calendarName?: TemporalSpec.ShowCalendarOption['calendarName']
}

export interface TimeZoneDisplayOptions {
  timeZoneName?: TemporalSpec.ZonedDateTimeToStringOptions['timeZoneName']
}

export interface OffsetDisplayOptions {
  offset?: TemporalSpec.ZonedDateTimeToStringOptions['offset']
}

export type RoundingModeName =
  TemporalSpec.DifferenceOptions<any>['roundingMode']

export interface RoundingModeOptions {
  roundingMode?: RoundingModeName
}

export interface RoundingIncOptions {
  roundingIncrement?: TemporalSpec.DifferenceOptions<any>['roundingIncrement']
}

export interface SubsecDigitsOptions {
  fractionalSecondDigits?: SubsecDigits // TODO: accept 'auto' ?
}

export type DirectionName = TemporalSpec.TransitionDirection

export interface DirectionOptions {
  direction: DirectionName
}
