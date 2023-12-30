import { DurationFields, durationFieldIndexes } from './durationFields'
import { toString, requireObjectlike, toInteger, requirePropDefined } from './cast'
import { DayTimeUnit, TimeUnit, Unit, UnitName, nanoInUtcDay, unitNameMap, unitNanoMap } from './units'
import { BoundArg, bindArgs, clampEntity, isObjectlike } from './utils'
import { Overflow, OffsetDisambig, EpochDisambig, RoundingMode, CalendarDisplay, TimeZoneDisplay, OffsetDisplay, SubsecDigits } from './options'

// Types
// -------------------------------------------------------------------------------------------------

export type ZonedFieldOptions = OverflowOptions & EpochDisambigOptions & OffsetDisambigOptions

export type ZonedFieldTuple = [
  Overflow,
  OffsetDisambig,
  EpochDisambig,
]

export type DiffOptions = LargestUnitOptions & SmallestUnitOptions & RoundingIncOptions & RoundingModeOptions

export type DiffTuple = [
  Unit, // largestUnit
  Unit, // smallestUnit
  number, // roundingInc
  RoundingMode
]

export type RoundTuple = [
  Unit, // smallestUnit
  number,
  RoundingMode,
]

// TODO: DRY with DiffOptions?
export type RoundingOptions = SmallestUnitOptions & RoundingIncOptions & RoundingModeOptions

export type DurationRoundOptions<RA> = DiffOptions & RelativeToOptions<RA>

export type DurationRoundTuple<R> = [...DiffTuple, R]

export type TimeDisplayTuple = [
  roundingMode: RoundingMode,
  nanoInc: number,
  subsecDigits: SubsecDigits | -1 | undefined // TODO: change -1 to null?
]

// TODO: lock-down subset of Unit here?
export type TimeDisplayOptions = SmallestUnitOptions & RoundingModeOptions & SubsecDigitsOptions

export type ZonedDateTimeDisplayOptions =
  & CalendarDisplayOptions
  & TimeZoneDisplayOptions
  & OffsetDisplayOptions
  & TimeDisplayOptions

export type ZonedDateTimeDisplayTuple = [
  CalendarDisplay,
  TimeZoneDisplay,
  OffsetDisplay,
  ...TimeDisplayTuple,
]

export type RelativeToOptions<RA> = { relativeTo: RA }
export type TotalUnitOptionsWithRel<RA> = TotalUnitOptions & RelativeToOptions<RA>

export type DateTimeDisplayOptions = CalendarDisplayOptions & TimeDisplayOptions

export type DateTimeDisplayTuple = [
  CalendarDisplay,
  ...TimeDisplayTuple,
]

interface SmallestUnitOptions {
  smallestUnit?: UnitName | keyof DurationFields
}

// TODO: rename to CalendarDiffOptions?
export interface LargestUnitOptions {
  largestUnit?: UnitName | keyof DurationFields
}

interface TotalUnitOptions {
  unit: UnitName | keyof DurationFields
}

export type InstantDisplayOptions<TA> = { timeZone: TA } & TimeDisplayOptions

export type InstantDisplayTuple<TA> = [TA, ...TimeDisplayTuple]

export interface OverflowOptions {
  overflow?: keyof typeof overflowMap
}

export interface EpochDisambigOptions {
  disambiguation?: keyof typeof epochDisambigMap
}

export interface OffsetDisambigOptions {
  offset?: keyof typeof offsetDisambigMap
}

export interface CalendarDisplayOptions {
  calendarName?: keyof typeof calendarDisplayMap
}

export interface TimeZoneDisplayOptions {
  timeZoneName?: keyof typeof timeZoneDisplayMap
}

export interface OffsetDisplayOptions {
  offset?: keyof typeof offsetDisplayMap
}

export interface RoundingModeOptions {
  roundingMode?: keyof typeof roundingModeMap
}

export interface RoundingIncOptions {
  roundingIncrement?: number
}

export interface SubsecDigitsOptions {
  fractionalSecondDigits?: SubsecDigits
}

// Config
// -------------------------------------------------------------------------------------------------

const smallestUnitStr = 'smallestUnit'
const largestUnitStr = 'largestUnit'
const totalUnitStr = 'unit'
const roundingIncName = 'roundingIncrement'
const subsecDigitsName = 'fractionalSecondDigits'

const overflowMap = {
  constrain: Overflow.Constrain,
  reject: Overflow.Reject,
}

export const overflowMapNames = Object.keys(overflowMap) as (keyof typeof overflowMap)[]

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

// Compound Options
// -------------------------------------------------------------------------------------------------

export function refineOverflowOptions(
  options: OverflowOptions | undefined,
): Overflow {
  return options === undefined ? Overflow.Constrain : refineOverflow(requireObjectlike(options))
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

  return [
    overflow,
    offsetDisambig,
    epochDisambig,
  ]
}

export function refineEpochDisambigOptions(options: EpochDisambigOptions | undefined): EpochDisambig {
  return refineEpochDisambig(normalizeOptions(options))
}

/*
For simple Calendar class diffing (only y/m/w/d units)
*/
export function refineCalendarDiffOptions(
  options: LargestUnitOptions | undefined, // TODO: definitely make large-unit type via generics
): Unit { // TODO: only year/month/week/day???
  options = normalizeOptions(options)
  return refineLargestUnit(options, Unit.Year, Unit.Day) ?? Unit.Day
}

export function refineDiffOptions(
  roundingModeInvert: boolean | undefined,
  options: DiffOptions | undefined,
  defaultLargestUnit: Unit,
  maxUnit = Unit.Year,
  minUnit = Unit.Nanosecond,
  defaultRoundingMode: RoundingMode = RoundingMode.Trunc,
): DiffTuple {
  options = normalizeOptions(options)

  let largestUnit = refineLargestUnit(options, maxUnit, minUnit)
  let roundingInc = parseRoundingIncInteger(options)
  let roundingMode = refineRoundingMode(options, defaultRoundingMode)
  let smallestUnit = refineSmallestUnit(options, maxUnit, minUnit) ?? minUnit

  if (largestUnit == null) {
    largestUnit = Math.max(defaultLargestUnit, smallestUnit)
  } else {
    checkLargestSmallestUnit(largestUnit, smallestUnit)
  }

  roundingInc = refineRoundingInc(roundingInc, smallestUnit as DayTimeUnit, true)

  if (roundingModeInvert) {
    roundingMode = invertRoundingMode(roundingMode)
  }

  return [largestUnit, smallestUnit, roundingInc, roundingMode]
}

export function refineDurationRoundOptions<RA, R>(
  options: DurationRoundOptions<RA>,
  defaultLargestUnit: Unit,
  refineRelativeTo: (relativeTo: RA) => R,
): DurationRoundTuple<R> {
  options = normalizeUnitNameOptions(options, smallestUnitStr)

  // alphabetcal
  let largestUnit = refineLargestUnit(options)
  const relativeToInternals = refineRelativeTo(options.relativeTo)
  let roundingInc = parseRoundingIncInteger(options)
  const roundingMode = refineRoundingMode(options, RoundingMode.HalfExpand)
  let smallestUnit = refineSmallestUnit(options)

  if (largestUnit === undefined && smallestUnit === undefined) {
    throw new RangeError('Must have either smallestUnit or largestUnit')
  }

  smallestUnit ??= Unit.Nanosecond
  largestUnit ??= Math.max(smallestUnit, defaultLargestUnit)
  checkLargestSmallestUnit(largestUnit, smallestUnit)
  roundingInc = refineRoundingInc(roundingInc, smallestUnit as DayTimeUnit, true)

  return [largestUnit, smallestUnit, roundingInc, roundingMode, relativeToInternals]
}

/*
Always related to time
*/
export function refineRoundOptions(
  options: RoundingOptions | UnitName,
  maxUnit: DayTimeUnit = Unit.Day,
  solarMode?: boolean,
): RoundTuple {
  options = normalizeUnitNameOptions(options, smallestUnitStr)

  // alphabetical
  let roundingInc = parseRoundingIncInteger(options)
  const roundingMode = refineRoundingMode(options, RoundingMode.HalfExpand)
  let smallestUnit = refineSmallestUnit(options, maxUnit)

  smallestUnit = requirePropDefined(smallestUnitStr, smallestUnit)
  roundingInc = refineRoundingInc(roundingInc, smallestUnit as DayTimeUnit, undefined, solarMode)

  return [smallestUnit, roundingInc, roundingMode]
}

export function refineTotalOptions<RA, R>(
  options: TotalUnitOptionsWithRel<RA> | UnitName,
  refineRelativeTo: (relativeTo: RA) => R,
): [
  Unit,
  R,
] {
  options = normalizeUnitNameOptions(options, totalUnitStr)

  // alphabetical
  const relativeToInternals = refineRelativeTo(options.relativeTo)
  let totalUnit = refineTotalUnit(options)
  totalUnit = requirePropDefined(totalUnitStr, totalUnit)

  return [
    totalUnit, // required
    relativeToInternals,
  ]
}

export function refineDateTimeDisplayOptions(options: DateTimeDisplayOptions | undefined): DateTimeDisplayTuple {
  options = normalizeOptions(options)
  return [
    refineCalendarDisplay(options),
    ...refineTimeDisplayTuple(options),
  ]
}

export function refineDateDisplayOptions(options: CalendarDisplayOptions | undefined): CalendarDisplay {
  return refineCalendarDisplay(normalizeOptions(options))
}

export function refineTimeDisplayOptions(
  options: TimeDisplayOptions | undefined,
  maxSmallestUnit?: TimeUnit
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

export function refineInstantDisplayOptions<TA>(
  options: InstantDisplayOptions<TA> | undefined,
): InstantDisplayTuple<TA> {
  options = normalizeOptions(options)

  // alphabetical
  const timeDisplayTuple = refineTimeDisplayTuple(options)
  const timeZoneArg: TA = options.timeZone

  return [
    timeZoneArg, // TODO: possibly not needed after moving away from Record
    ...timeDisplayTuple,
  ]
}

// Utils for compound options
// -------------------------------------------------------------------------------------------------

function refineTimeDisplayTuple(
  options: TimeDisplayOptions,
  maxSmallestUnit: TimeUnit = Unit.Minute
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
): [
  nanoInc: number,
  subsecDigits: SubsecDigits | -1 | undefined,
] {
  if (smallestUnit != null) {
    return [
      unitNanoMap[smallestUnit],
      (smallestUnit < Unit.Minute)
        ? (9 - (smallestUnit * 3)) as SubsecDigits
        : -1, // hide seconds (not relevant when maxSmallestUnit is smaller then minute)
    ]
  }

  return [
    subsecDigits === undefined ? 1 : 10 ** (9 - subsecDigits),
    subsecDigits,
  ]
}

// Individual Refining (simple)
// -------------------------------------------------------------------------------------------------

const refineSmallestUnit = bindArgs(refineUnitOption<SmallestUnitOptions>, smallestUnitStr)
const refineLargestUnit = bindArgs(refineUnitOption<LargestUnitOptions>, largestUnitStr)
const refineTotalUnit = bindArgs(refineUnitOption<TotalUnitOptions>, totalUnitStr)
const refineOverflow = bindArgs(refineChoiceOption<OverflowOptions>, 'overflow', overflowMap)
const refineEpochDisambig = bindArgs(refineChoiceOption<EpochDisambigOptions>, 'disambiguation', epochDisambigMap)
const refineOffsetDisambig = bindArgs(refineChoiceOption<OffsetDisambigOptions>, 'offset', offsetDisambigMap)
const refineCalendarDisplay = bindArgs(refineChoiceOption<CalendarDisplayOptions>, 'calendarName', calendarDisplayMap)
const refineTimeZoneDisplay = bindArgs(refineChoiceOption<TimeZoneDisplayOptions>, 'timeZoneName', timeZoneDisplayMap)
const refineOffsetDisplay = bindArgs(refineChoiceOption<OffsetDisplayOptions>, 'offset', offsetDisplayMap)
const refineRoundingMode = bindArgs(refineChoiceOption<RoundingModeOptions>, 'roundingMode', roundingModeMap) // Caller should always supply default

// Individual Refining (custom logic)
// -------------------------------------------------------------------------------------------------

function parseRoundingIncInteger(options: RoundingIncOptions): number {
  let roundingInc = options[roundingIncName]

  if (roundingInc === undefined) {
    return 1
  }

  return toInteger(roundingInc)
}

function refineRoundingInc(
  roundingInc: number, // results from parseRoundingIncInteger
  smallestUnit: DayTimeUnit,
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
      Overflow.Reject
    )

    // % is dangerous, but -0 will be falsy just like 0
    if (upUnitNano % (roundingInc * unitNano)) {
      throw new RangeError('Must be multiple')
    }
  } else {
    roundingInc = clampEntity(
      roundingIncName,
      roundingInc,
      1,
      allowManyLargeUnits ? 10 ** 9 : 1,
      Overflow.Reject
    )
  }

  return roundingInc
}

function refineSubsecDigits(options: SubsecDigitsOptions): SubsecDigits | undefined {
  let subsecDigits = options[subsecDigitsName]

  if (subsecDigits !== undefined) {
    if (typeof subsecDigits !== 'number') {
      if (toString(subsecDigits) === 'auto') {
        return
      }

      throw new RangeError(`fractionalSecondDigits must be 'auto' or 0 through 9`)
    }

    subsecDigits = clampEntity(subsecDigitsName, Math.floor(subsecDigits), 0, 9, Overflow.Reject) as SubsecDigits
  }

  return subsecDigits
}

// Normalization of whole options object
// -------------------------------------------------------------------------------------------------

export function normalizeOptions<O extends {}>(options: O | undefined): O {
  if (options === undefined) {
    return {} as O
  }
  return requireObjectlike(options)
}

function normalizeUnitNameOptions<O extends {}>(
  options: O | UnitName,
  optionName: keyof O,
): O {
  if (typeof options === 'string') {
    return { [optionName]: options } as O
  }
  return requireObjectlike(options)
}

/*
Used for to* and diff* and `with` functions
*/
export function prepareOptions<O>(options: O): O {
  if (options === undefined) {
    return undefined as any
  }
  if (isObjectlike(options)) {
    return Object.assign(Object.create(null), options)
  }
  throw new TypeError('Options must be object')
}

// Utils
// -------------------------------------------------------------------------------------------------

function invertRoundingMode(roundingMode: RoundingMode): RoundingMode {
  if (roundingMode < 4) {
    return (roundingMode + 2) % 4
  }
  return roundingMode
}

function refineUnitOption<O>(
  optionName: (keyof O) & string,
  options: O,
  maxUnit: Unit = Unit.Year,
  minUnit: Unit = Unit.Nanosecond, // used less frequently than maxUnit
): Unit | null | undefined {
  let unitStr = options[optionName] as (string | undefined)

  if (unitStr === undefined) {
    return undefined
  }

  unitStr = toString(unitStr)

  if (unitStr === 'auto') {
    return null
  }

  const unit = unitNameMap[unitStr as UnitName] ??
    durationFieldIndexes[unitStr as (keyof DurationFields)]

  if (unit === undefined) {
    throw new RangeError('Invalid unit ' + optionName)
  }
  if (unit < minUnit || unit > maxUnit) { // TODO: use clamp?
    throw new RangeError('Out of bounds' + optionName)
  }

  return unit
}

function refineChoiceOption<O>(
  optionName: keyof O,
  enumNameMap: Record<string, number>,
  options: O,
  defaultChoice = 0, // TODO: improve this type?
): number {
  const enumName = options[optionName]
  if (enumName === undefined) {
    return defaultChoice
  }

  const enumNum = enumNameMap[toString(enumName as string)]
  if (enumNum === undefined) {
    throw new RangeError('Must be one of the choices')
  }
  return enumNum
}

function checkLargestSmallestUnit(largestUnit: Unit, smallestUnit: Unit): void {
  if (smallestUnit > largestUnit) {
    throw new RangeError('smallestUnit must be smaller than largestUnit')
  }
}
