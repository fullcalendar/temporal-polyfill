import { Temporal as TemporalSpec } from 'temporal-spec'
import {
  requireObjectLike,
  requirePropDefined,
  toInteger,
  toString,
} from './cast'
import { DurationFieldName, durationFieldIndexes } from './durationFields'
import * as errorMessages from './errorMessages'
import {
  CalendarDisplay,
  Direction,
  EpochDisambig,
  OffsetDisambig,
  OffsetDisplay,
  Overflow,
  RoundingMode,
  SubsecDigits,
  TimeZoneDisplay,
} from './options'
import {
  DateUnitName,
  DayTimeUnit,
  DayTimeUnitName,
  StrictUnitName,
  TimeUnit,
  TimeUnitName,
  Unit,
  UnitName,
  nanoInUtcDay,
  unitNameMap,
  unitNamesAsc,
  unitNanoMap,
} from './units'
import { bindArgs, clampEntity } from './utils'

// Types
// -----------------------------------------------------------------------------

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

// Config
// -----------------------------------------------------------------------------

// TODO: rename to 'label'?
const smallestUnitStr = 'smallestUnit'
const largestUnitStr = 'largestUnit'
const totalUnitStr = 'unit'
const roundingModeName = 'roundingMode'
const roundingIncName = 'roundingIncrement'
const subsecDigitsName = 'fractionalSecondDigits'
const relativeToName = 'relativeTo'
const directionName = 'direction'

const overflowMap = {
  constrain: Overflow.Constrain,
  reject: Overflow.Reject,
}

export const overflowMapNames = Object.keys(
  overflowMap,
) as (keyof typeof overflowMap)[]

const epochDisambigMap = {
  compatible: EpochDisambig.Compat,
  reject: EpochDisambig.Reject,
  earlier: EpochDisambig.Earlier,
  later: EpochDisambig.Later,
}

const offsetDisambigMap = {
  reject: OffsetDisambig.Reject,
  use: OffsetDisambig.Use,
  prefer: OffsetDisambig.Prefer,
  ignore: OffsetDisambig.Ignore,
}

const calendarDisplayMap = {
  auto: CalendarDisplay.Auto,
  never: CalendarDisplay.Never,
  critical: CalendarDisplay.Critical,
  always: CalendarDisplay.Always,
}

const timeZoneDisplayMap = {
  auto: TimeZoneDisplay.Auto,
  never: TimeZoneDisplay.Never,
  critical: TimeZoneDisplay.Critical,
}

const offsetDisplayMap = {
  auto: OffsetDisplay.Auto,
  never: OffsetDisplay.Never,
}

const roundingModeMap = {
  floor: RoundingMode.Floor,
  halfFloor: RoundingMode.HalfFloor,
  ceil: RoundingMode.Ceil,
  halfCeil: RoundingMode.HalfCeil,
  trunc: RoundingMode.Trunc,
  halfTrunc: RoundingMode.HalfTrunc,
  expand: RoundingMode.Expand,
  halfExpand: RoundingMode.HalfExpand,
  halfEven: RoundingMode.HalfEven,
}

const directionMap = {
  previous: Direction.Previous,
  next: Direction.Next,
}

// Compound Options
// -----------------------------------------------------------------------------

export function refineOverflowOptions(
  options: OverflowOptions | undefined,
): Overflow {
  return options === undefined
    ? Overflow.Constrain
    : refineOverflow(requireObjectLike(options))
}

export function refineZonedFieldOptions(
  options: ZonedFieldOptions | undefined,
  defaultOffsetDisambig: OffsetDisambig = OffsetDisambig.Reject,
): ZonedFieldTuple {
  options = normalizeOptions(options)

  // alphabetical
  const epochDisambig = refineEpochDisambig(options) // "disambig"
  const offsetDisambig = refineOffsetDisambig(options, defaultOffsetDisambig) // "offset"
  const overflow = refineOverflow(options) // "overflow"

  return [overflow, offsetDisambig, epochDisambig]
}

export function refineEpochDisambigOptions(
  options: EpochDisambigOptions | undefined,
): EpochDisambig {
  return refineEpochDisambig(normalizeOptions(options))
}

export function refineDateDiffOptions(
  options: LargestUnitOptions<DateUnitName> | undefined,
): Unit {
  // TODO: only year/month/week/day?
  options = normalizeOptions(options)
  return refineLargestUnit(options, Unit.Year, Unit.Day, true)!
}

export function refineDiffOptions<UN extends UnitName>(
  roundingModeInvert: boolean | undefined,
  options: DiffOptions<UN> | undefined,
  defaultLargestUnit: Unit,
  maxUnit = Unit.Year,
  minUnit = Unit.Nanosecond,
  defaultRoundingMode: RoundingMode = RoundingMode.Trunc,
): DiffTuple {
  options = normalizeOptions(options)

  let largestUnit = refineLargestUnit(options, maxUnit, minUnit)
  let roundingInc = parseRoundingIncInteger(options)
  let roundingMode = refineRoundingMode(options, defaultRoundingMode)
  const smallestUnit = refineSmallestUnit(options, maxUnit, minUnit, true)!

  if (largestUnit == null) {
    largestUnit = Math.max(defaultLargestUnit, smallestUnit)
  } else {
    checkLargestSmallestUnit(largestUnit, smallestUnit)
  }

  roundingInc = refineRoundingInc(roundingInc, smallestUnit, true)

  if (roundingModeInvert) {
    roundingMode = invertRoundingMode(roundingMode)
  }

  return [largestUnit, smallestUnit, roundingInc, roundingMode]
}

export function refineDurationRoundOptions<RA, R>(
  options: DurationRoundingOptions<RA> | UnitName,
  defaultLargestUnit: Unit,
  refineRelativeTo: (relativeTo?: RA) => R,
): DurationRoundingTuple<R> {
  options = normalizeOptionsOrString<
    DurationRoundingOptions<RA>,
    typeof smallestUnitStr
  >(options, smallestUnitStr)

  // alphabetcal
  let largestUnit = refineLargestUnit(options)
  const relativeToInternals = refineRelativeTo(options[relativeToName])
  let roundingInc = parseRoundingIncInteger(options)
  const roundingMode = refineRoundingMode(options, RoundingMode.HalfExpand)
  let smallestUnit = refineSmallestUnit(options)

  if (largestUnit === undefined && smallestUnit === undefined) {
    throw new RangeError(errorMessages.missingSmallestLargestUnit)
  }

  if (smallestUnit == null) {
    smallestUnit = Unit.Nanosecond
  }
  if (largestUnit == null) {
    largestUnit = Math.max(smallestUnit, defaultLargestUnit)
  }

  checkLargestSmallestUnit(largestUnit, smallestUnit)
  roundingInc = refineRoundingInc(roundingInc, smallestUnit, true)

  if (
    roundingInc > 1 &&
    smallestUnit > Unit.Hour && // a date unit?
    largestUnit !== smallestUnit
  ) {
    throw new RangeError(
      'For calendar units with roundingIncrement > 1, use largestUnit = smallestUnit',
    )
  }

  return [
    largestUnit,
    smallestUnit,
    roundingInc,
    roundingMode,
    relativeToInternals,
  ]
}

export function refineRoundingOptions<UN extends DayTimeUnitName>(
  options: RoundingOptions<UN> | UN,
  maxUnit: DayTimeUnit = Unit.Day,
  solarMode?: boolean,
): RoundingTuple {
  options = normalizeOptionsOrString<
    RoundingOptions<UN>,
    typeof smallestUnitStr
  >(options, smallestUnitStr)

  // alphabetical
  let roundingInc = parseRoundingIncInteger(options)
  const roundingMode = refineRoundingMode(options, RoundingMode.HalfExpand)
  let smallestUnit = refineSmallestUnit(options, maxUnit)

  smallestUnit = requirePropDefined(smallestUnitStr, smallestUnit)
  roundingInc = refineRoundingInc(
    roundingInc,
    smallestUnit,
    undefined,
    solarMode,
  )

  return [smallestUnit, roundingInc, roundingMode]
}

function refineRoundingMathOptions(
  smallestUnit: Unit,
  options: RoundingModeName | RoundingMathOptions,
  allowManyLargeUnits?: boolean,
): RoundingMathTuple {
  options = normalizeOptionsOrString<
    RoundingMathOptions,
    typeof roundingModeName
  >(options, roundingModeName)

  // alphabetical
  let roundingInc = parseRoundingIncInteger(options)
  const roundingMode = refineRoundingMode(options, RoundingMode.HalfExpand)

  roundingInc = refineRoundingInc(
    roundingInc,
    smallestUnit,
    allowManyLargeUnits,
  )
  return [roundingInc, roundingMode]
}

/*
For funcApi
*/
export function refineUnitDiffOptions(
  smallestUnit: Unit,
  options: RoundingModeName | RoundingMathOptions,
): RoundingMathTuple | [undefined, undefined] {
  if (options !== undefined) {
    return refineRoundingMathOptions(smallestUnit, options, true)
  }
  return [] as unknown as [undefined, undefined]
}

/*
For funcApi
*/
export function refineUnitRoundOptions(
  smallestUnit: Unit,
  options: RoundingModeName | RoundingMathOptions,
): RoundingMathTuple {
  if (options !== undefined) {
    return refineRoundingMathOptions(smallestUnit, options)
  }
  return [1, RoundingMode.HalfExpand]
}

export function refineTotalOptions<RA, R>(
  options: UnitName | DurationTotalOptions<RA>,
  refineRelativeTo: (relativeTo?: RA) => R | undefined,
): [Unit, R | undefined] {
  options = normalizeOptionsOrString<
    DurationTotalOptions<RA>,
    typeof totalUnitStr
  >(options, totalUnitStr)

  // alphabetical
  const relativeToInternals = refineRelativeTo(options[relativeToName])
  let totalUnit = refineTotalUnit(options)
  totalUnit = requirePropDefined(totalUnitStr, totalUnit)

  return [
    totalUnit, // required
    relativeToInternals,
  ]
}

export function refineDateTimeDisplayOptions(
  options: DateTimeDisplayOptions | undefined,
): DateTimeDisplayTuple {
  options = normalizeOptions(options)
  return [refineCalendarDisplay(options), ...refineTimeDisplayTuple(options)]
}

export function refineDateDisplayOptions(
  options: CalendarDisplayOptions | undefined,
): CalendarDisplay {
  return refineCalendarDisplay(normalizeOptions(options))
}

export function refineTimeDisplayOptions(
  options: TimeDisplayOptions | undefined,
  maxSmallestUnit?: TimeUnit,
): TimeDisplayTuple {
  return refineTimeDisplayTuple(normalizeOptions(options), maxSmallestUnit)
}

export function refineZonedDateTimeDisplayOptions(
  options: ZonedDateTimeDisplayOptions | undefined,
): ZonedDateTimeDisplayTuple {
  options = normalizeOptions(options)

  // alphabetical
  const calendarDisplay = refineCalendarDisplay(options)
  const subsecDigits = refineSubsecDigits(options) // "fractionalSecondDigits". rename in our code?
  const offsetDisplay = refineOffsetDisplay(options)
  const roundingMode = refineRoundingMode(options, RoundingMode.Trunc)
  const smallestUnit = refineSmallestUnit(options, Unit.Minute)
  const timeZoneDisplay = refineTimeZoneDisplay(options)

  return [
    calendarDisplay,
    timeZoneDisplay,
    offsetDisplay,
    roundingMode,
    ...refineSmallestUnitAndSubsecDigits(smallestUnit, subsecDigits),
  ]
}

export function refineInstantDisplayOptions(
  options: InstantDisplayOptions | undefined,
): InstantDisplayTuple {
  options = normalizeOptions(options)

  // alphabetical
  const timeDisplayTuple = refineTimeDisplayTuple(options)
  const timeZoneArg: string | undefined = options.timeZone

  return [timeZoneArg, ...timeDisplayTuple]
}

export function refineDirectionOptions(
  options: DirectionOptions | DirectionName,
): Direction {
  const normalizedOptions = normalizeOptionsOrString<
    DirectionOptions,
    typeof directionName
  >(options, directionName)
  const res = refineChoiceOption(
    directionName,
    directionMap,
    normalizedOptions,
    0,
  )
  if (!res) {
    // neither position or negative
    throw new RangeError('BAD!') // TODO: improve
  }
  return res
}

// Utils for compound options
// -----------------------------------------------------------------------------

function refineTimeDisplayTuple(
  options: TimeDisplayOptions,
  maxSmallestUnit: TimeUnit = Unit.Minute,
): TimeDisplayTuple {
  // alphabetical
  const subsecDigits = refineSubsecDigits(options) // "fractionalSecondDigits". rename in our code?
  const roundingMode = refineRoundingMode(options, RoundingMode.Trunc)
  const smallestUnit = refineSmallestUnit(options, maxSmallestUnit)

  return [
    roundingMode,
    ...refineSmallestUnitAndSubsecDigits(smallestUnit, subsecDigits),
  ]
}

function refineSmallestUnitAndSubsecDigits(
  smallestUnit: Unit | undefined | null,
  subsecDigits: SubsecDigits | undefined,
): [nanoInc: number, subsecDigits: SubsecDigits | -1 | undefined] {
  if (smallestUnit != null) {
    return [
      unitNanoMap[smallestUnit],
      smallestUnit < Unit.Minute
        ? ((9 - smallestUnit * 3) as SubsecDigits)
        : -1, // hide seconds (not relevant when maxSmallestUnit is smaller then minute)
    ]
  }

  return [
    subsecDigits === undefined ? 1 : 10 ** (9 - subsecDigits),
    subsecDigits,
  ]
}

// Individual Refining (simple)
// -----------------------------------------------------------------------------

// generic. callers should type-narrow the results
const refineSmallestUnit = bindArgs(
  refineUnitOption<SmallestUnitOptions<UnitName>>,
  smallestUnitStr,
)
// generic. callers should type-narrow the results
const refineLargestUnit = bindArgs(
  refineUnitOption<LargestUnitOptions<UnitName>>,
  largestUnitStr,
)
const refineTotalUnit = bindArgs(
  refineUnitOption<TotalUnitOptions>,
  totalUnitStr,
)
const refineOverflow = bindArgs(
  refineChoiceOption<OverflowOptions>,
  'overflow',
  overflowMap,
)
const refineEpochDisambig = bindArgs(
  refineChoiceOption<EpochDisambigOptions>,
  'disambiguation',
  epochDisambigMap,
)
const refineOffsetDisambig = bindArgs(
  refineChoiceOption<OffsetDisambigOptions>,
  'offset',
  offsetDisambigMap,
)
const refineCalendarDisplay = bindArgs(
  refineChoiceOption<CalendarDisplayOptions>,
  'calendarName',
  calendarDisplayMap,
)
const refineTimeZoneDisplay = bindArgs(
  refineChoiceOption<TimeZoneDisplayOptions>,
  'timeZoneName',
  timeZoneDisplayMap,
)
const refineOffsetDisplay = bindArgs(
  refineChoiceOption<OffsetDisplayOptions>,
  'offset',
  offsetDisplayMap,
)
// Caller should always supply default
const refineRoundingMode = bindArgs(
  refineChoiceOption<RoundingModeOptions>,
  roundingModeName,
  roundingModeMap,
)

// Individual Refining (custom logic)
// -----------------------------------------------------------------------------

function parseRoundingIncInteger(options: RoundingIncOptions): number {
  const roundingInc = options[roundingIncName]
  if (roundingInc === undefined) {
    return 1
  }
  return toInteger(roundingInc, roundingIncName)
}

/*
TODO: change defaults and the way this is called because almost always
allowManyLargeUnits: true
*/
function refineRoundingInc(
  roundingInc: number, // results from parseRoundingIncInteger
  smallestUnit: Unit,
  allowManyLargeUnits?: boolean,
  solarMode?: boolean,
): number {
  const upUnitNano = solarMode ? nanoInUtcDay : unitNanoMap[smallestUnit + 1]

  if (upUnitNano) {
    const unitNano = unitNanoMap[smallestUnit]
    const maxRoundingInc = upUnitNano / unitNano
    roundingInc = clampEntity(
      roundingIncName,
      roundingInc,
      1,
      maxRoundingInc - (solarMode ? 0 : 1),
      Overflow.Reject,
    )

    // % is dangerous, but -0 will be falsy just like 0
    if (upUnitNano % (roundingInc * unitNano)) {
      throw new RangeError(
        errorMessages.invalidEntity(roundingIncName, roundingInc),
      )
    }
  } else {
    roundingInc = clampEntity(
      roundingIncName,
      roundingInc,
      1,
      allowManyLargeUnits ? 10 ** 9 : 1,
      Overflow.Reject,
    )
  }

  return roundingInc
}

function refineSubsecDigits(
  options: SubsecDigitsOptions,
): SubsecDigits | undefined {
  let subsecDigits = options[subsecDigitsName]

  if (subsecDigits !== undefined) {
    if (typeof subsecDigits !== 'number') {
      if (toString(subsecDigits) === 'auto') {
        return
      }
      throw new RangeError(
        errorMessages.invalidEntity(subsecDigitsName, subsecDigits),
      )
    }

    subsecDigits = clampEntity(
      subsecDigitsName,
      Math.floor(subsecDigits),
      0,
      9,
      Overflow.Reject,
    ) as SubsecDigits
  }

  return subsecDigits
}

// Normalization of whole options object
// -----------------------------------------------------------------------------

/*
For ensuring options is an object
*/
export function normalizeOptions<O extends {}>(options: O | undefined): O {
  if (options === undefined) {
    return {} as O
  }
  return requireObjectLike(options)
}

function normalizeOptionsOrString<O extends {}, K extends string & keyof O>(
  options: O | O[K],
  optionName: K,
): O {
  if (typeof options === 'string') {
    return { [optionName]: options } as O
  }
  return requireObjectLike(options as O)
}

/*
TODO: Eventually remove. Not passed to user-defined Calendars anymore
*/
export function fabricateOverflowOptions(overflow: Overflow): OverflowOptions {
  return {
    overflow: overflowMapNames[overflow],
  }
}

// Utils
// -----------------------------------------------------------------------------

function invertRoundingMode(roundingMode: RoundingMode): RoundingMode {
  if (roundingMode < 4) {
    return (roundingMode + 2) % 4
  }
  return roundingMode
}

/*
`null` means 'auto'
TODO: create better type where if ensureDefined, then return-type is non null/defined
*/
function refineUnitOption<O>(
  optionName: keyof O & string,
  options: O,
  maxUnit: Unit = Unit.Year,
  minUnit: Unit = Unit.Nanosecond, // used less frequently than maxUnit
  ensureDefined?: boolean, // will return minUnit if undefined or auto
): Unit | null | undefined {
  let unitStr = options[optionName] as string | undefined
  if (unitStr === undefined) {
    return ensureDefined ? minUnit : undefined
  }

  unitStr = toString(unitStr)
  if (unitStr === 'auto') {
    return ensureDefined ? minUnit : null
  }

  let unit = unitNameMap[unitStr as StrictUnitName]

  if (unit === undefined) {
    unit = durationFieldIndexes[unitStr as DurationFieldName]
  }
  if (unit === undefined) {
    throw new RangeError(
      errorMessages.invalidChoice(optionName, unitStr, unitNameMap),
    )
  }

  clampEntity(optionName, unit, minUnit, maxUnit, Overflow.Reject, unitNamesAsc)
  return unit
}

function refineChoiceOption<O>(
  optionName: keyof O & string,
  enumNameMap: Record<string, number>,
  options: O,
  defaultChoice = 0, // TODO: improve this type?
): number {
  const enumArg = options[optionName]
  if (enumArg === undefined) {
    return defaultChoice
  }

  const enumStr = toString(enumArg as string)
  const enumNum = enumNameMap[enumStr]
  if (enumNum === undefined) {
    throw new RangeError(
      errorMessages.invalidChoice(optionName, enumStr, enumNameMap),
    )
  }
  return enumNum
}

function checkLargestSmallestUnit(largestUnit: Unit, smallestUnit: Unit): void {
  if (smallestUnit > largestUnit) {
    throw new RangeError(errorMessages.flippedSmallestLargestUnit)
  }
}
