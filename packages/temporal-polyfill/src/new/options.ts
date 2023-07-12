import { getInternals } from './class'
import { DurationFields, durationFieldIndexes } from './durationFields'
import { pluckIsoDateInternals } from './isoFields'
import { parseMaybeZonedDateTime } from './isoParse'
import { LargeInt, bigIntToLargeInt } from './largeInt'
import { PlainDate } from './plainDate'
import { PlainDateTime } from './plainDateTime'
import { DayTimeUnit, Unit, UnitName, unitNameMap, unitNanoMap } from './units'
import {
  clamp,
  hasAnyPropsByName,
  isObjectlike,
  roundExpand,
  roundHalfCeil,
  roundHalfEven,
  roundHalfFloor,
  roundHalfTrunc,
} from './utils'
import { ZonedDateTime } from './zonedDateTime'

type Options = Record<string, unknown>

// Compound Options
// -------------------------------------------------------------------------------------------------

export function refineOverflowOptions(options: Options | undefined) {
  return refineOverflow(normalizeOptions(options))
}

export function refineZonedFieldOptions(options: Options | undefined) {
  options = normalizeOptions(options)
  return [
    refineOverflow(options),
    refineEpochDisambig(options),
    refineOffsetDisambig(options),
  ]
}

export function refineEpochDisambigOptions(options: Options | undefined) {
  return refineEpochDisambig(normalizeOptions(options))
}

export function refineDiffOptions(
  roundingModeInvert: boolean | undefined,
  options: Options | undefined,
  defaultLargestUnit: Unit,
  maxUnit = Unit.Year,
  minUnit = Unit.Nanosecond,
) {
  options = normalizeOptions(options)
  const smallestUnit = refineSmallestUnit(options, maxUnit, minUnit, minUnit)
  const largestUnit = refineLargestUnit(
    options,
    maxUnit,
    Math.max(smallestUnit, minUnit),
    Math.max(smallestUnit, defaultLargestUnit),
  )

  const roundingInc = refineRoundingInc(options, smallestUnit as DayTimeUnit)

  let roundingMode = refineRoundingMode(options, RoundingMode.Trunc)
  if (roundingModeInvert) {
    roundingMode = invertRoundingMode(roundingMode)
  }

  return [largestUnit, smallestUnit, roundingInc, roundingMode]
}

/*
Always related to time
*/
export function refineRoundOptions(
  options: Options | undefined,
  maxUnit: DayTimeUnit = Unit.Day,
) {
  options = normalizeUnitNameOptions(options, smallestUnitStr)
  const smallestUnit = refineSmallestUnit(options, maxUnit) as DayTimeUnit
  return [
    smallestUnit,
    refineRoundingInc(options, smallestUnit),
    refineRoundingMode(options, RoundingMode.HalfExpand),
  ]
}

export function refineDurationRoundOptions(
  options: Options | undefined,
  defaultLargestUnit: Unit
) {
  options = normalizeUnitNameOptions(options, smallestUnitStr)
  mustHaveMatch(options, [largestUnitStr, smallestUnitStr]) // will register unwanted read?
  // ^do a whitelist filter that copies instead?

  return [
    ...refineDiffOptions(false, options, defaultLargestUnit), // double-refined. oh well
    refineRelativeTo(options),
  ]
}

export function refineTotalOptions(
  options: Options | undefined
) {
  options = normalizeUnitNameOptions(options, totalUnitStr)
  return [
    refineTotalUnit(options), // required
    refineRelativeTo(options),
  ]
}

export function refineRelativeToOptions(options: Options | undefined) {
  return refineRelativeTo(normalizeOptions(options))
}

export function refineInstantDisplayOptions(
  options: Options | undefined
) {
  options = normalizeOptions(options)
  return [
    options.timeZone,
    ...refineTimeDisplayTuple(options),
  ]
}

export function refineZonedDateTimeDisplayOptions(options: Options | undefined) {
  options = normalizeOptions(options)
  return [
    refineCalendarDisplay(options),
    refineTimeZoneDisplay(options),
    refineOffsetDisplay(options),
    ...refineTimeDisplayTuple(options),
  ]
}

export function refineDateTimeDisplayOptions(options: Options | undefined) {
  options = normalizeOptions(options)
  return [
    refineCalendarDisplay(options),
    ...refineTimeDisplayTuple(options),
  ]
}

export function refineDateDisplayOptions(options: Options | undefined): CalendarDisplay {
  return refineCalendarDisplay(normalizeOptions(options))
}

export function refineTimeDisplayOptions(options: Options | undefined): TimeDisplayTuple {
  return refineTimeDisplayTuple(normalizeOptions(options))
}

export type TimeDisplayTuple = [
  nanoInc: number,
  roundingMode: RoundingMode,
  subsecDigits: number | undefined // (undefined = auto-digits, -1 = hide-seconds, >=0 = #-of-digits)
]

function refineTimeDisplayTuple(options: Options): TimeDisplayTuple {
  const smallestUnit = refineSmallestUnit(options, Unit.Minute, Unit.Nanosecond, -1 as number)
  if ((smallestUnit as number) !== -1) {
    return [
      unitNanoMap[smallestUnit],
      refineRoundingMode(options, RoundingMode.Trunc),
      (smallestUnit < Unit.Minute)
        ? 9 - (smallestUnit * 3)
        : -1, // hide seconds
    ]
  }

  const subsecDigits = refineSubsecDigits(options)
  return [
    subsecDigits === undefined ? 1 : 10 ** (9 - subsecDigits),
    refineRoundingMode(options, RoundingMode.Trunc),
    subsecDigits,
  ]
}

// Single Options
// -------------------------------------------------------------------------------------------------

const smallestUnitStr = 'smallestUnit'
const largestUnitStr = 'largestUnit'
const totalUnitStr = 'unit'

const refineSmallestUnit = refineUnitOption.bind(undefined, smallestUnitStr)
const refineLargestUnit = refineUnitOption.bind(undefined, largestUnitStr)
const refineTotalUnit = refineUnitOption.bind(undefined, totalUnitStr)

export enum Overflow {
  Constrain,
  Reject,
}
const refineOverflow = refineChoiceOption.bind(undefined, 'overflow', {
  constrain: Overflow.Constrain,
  reject: Overflow.Reject,
}) as (options: Options) => Overflow

export enum EpochDisambig {
  Compat,
  Reject,
  Earlier,
  Later,
}
const refineEpochDisambig = refineChoiceOption.bind(undefined, 'disambiguation', {
  compatible: EpochDisambig.Compat,
  reject: EpochDisambig.Reject,
  earlier: EpochDisambig.Earlier,
  later: EpochDisambig.Later,
}) as (options: Options) => EpochDisambig

export enum OffsetDisambig {
  Use,
  Reject,
  Prefer,
  Ignore,
}
const refineOffsetDisambig = refineChoiceOption.bind(undefined, 'offset', {
  use: OffsetDisambig.Use,
  reject: OffsetDisambig.Reject,
  prefer: OffsetDisambig.Prefer,
  ignore: OffsetDisambig.Ignore,
}) as (options: Options) => OffsetDisambig

export enum CalendarDisplay {
  Auto,
  Never,
  Critical,
  Always,
}
const refineCalendarDisplay = refineChoiceOption.bind(undefined, 'calendarName', {
  auto: CalendarDisplay.Auto,
  never: CalendarDisplay.Never,
  critical: CalendarDisplay.Critical,
  always: CalendarDisplay.Always,
}) as (options: Options) => CalendarDisplay

export enum TimeZoneDisplay {
  Auto,
  Never,
  Critical,
}
const refineTimeZoneDisplay = refineChoiceOption.bind(undefined, 'timeZoneName', {
  auto: TimeZoneDisplay.Auto,
  never: TimeZoneDisplay.Never,
  critical: TimeZoneDisplay.Critical,
}) as (options: Options) => TimeZoneDisplay

export enum OffsetDisplay {
  Auto,
  Never,
}
const refineOffsetDisplay = refineChoiceOption.bind(undefined, 'offset', {
  auto: OffsetDisplay.Auto,
  never: OffsetDisplay.Never,
}) as (options: Options) => OffsetDisplay

export enum RoundingMode {
  // modes that get inverted (see invertRoundingMode)
  Floor,
  HalfFloor,
  Ceil,
  HalfCeil,
  // other modes
  Trunc, // default for most things
  HalfTrunc,
  Expand,
  HalfExpand, // default for date/time::round()
  HalfEven,
}
// Caller should always supply default
const refineRoundingMode = refineChoiceOption.bind(undefined, 'roundingMode', {
  floor: RoundingMode.Floor,
  halfFloor: RoundingMode.HalfFloor,
  ceil: RoundingMode.Ceil,
  halfCeil: RoundingMode.HalfCeil,
  trunc: RoundingMode.Trunc,
  halfTrunc: RoundingMode.HalfTrunc,
  expand: RoundingMode.Expand,
  halfExpand: RoundingMode.HalfExpand,
  halfEven: RoundingMode.HalfEven,
})
export const roundingModeFuncs = [
  Math.floor,
  roundHalfFloor,
  Math.ceil,
  roundHalfCeil,
  Math.trunc,
  roundHalfTrunc,
  roundExpand,
  Math.round,
  roundHalfEven,
]

function invertRoundingMode(roundingMode: RoundingMode): RoundingMode {
  if (roundingMode < 4) {
    return (roundingMode + 2) % 4
  }
  return roundingMode
}

const roundingIncName = 'roundingIncrement'

function refineRoundingInc(options: Options, smallestUnit: DayTimeUnit) {
  let roundingInc = options[roundingIncName] as number
  if (roundingInc === undefined) {
    return 1
  }

  roundingInc = toNumber(roundingInc)
  const upUnitNano = unitNanoMap[smallestUnit + 1]

  if (upUnitNano) {
    const unitNano = unitNanoMap[smallestUnit]
    const maxRoundingInc = upUnitNano / unitNano
    roundingInc = clamp(roundingInc, 1, maxRoundingInc - 1, Overflow.Reject, roundingIncName)

    if (upUnitNano % (roundingInc * unitNano)) {
      throw new RangeError('Must be even multiple')
    }
  } else {
    roundingInc = clamp(roundingInc, 1, 1, Overflow.Reject, roundingIncName)
  }

  return roundingInc
}

const subsecDigitsName = 'fractionalSecondDigits'

function refineSubsecDigits(options: Options): number | undefined {
  const subsecDigits = options[subsecDigitsName]

  if (typeof subsecDigits === 'number') {
    return clamp(Math.floor(subsecDigits), 0, 9, Overflow.Reject, subsecDigitsName)
  }

  if (String(subsecDigits) !== 'auto') {
    throw new RangeError('Must be auto or 0-9')
  }

  // undefind means 'auto'
}

function refineRelativeTo(options: Options) {
  const { relativeTo } = options

  if (relativeTo) {
    if (isObjectlike(relativeTo)) {
      if (
        relativeTo instanceof ZonedDateTime ||
        relativeTo instanceof PlainDate
      ) {
        return getInternals(relativeTo)
      } else if (relativeTo instanceof PlainDateTime) {
        return pluckIsoDateInternals(getInternals(relativeTo))
      }
      throw new TypeError()
    }

    return parseMaybeZonedDateTime(toString(relativeTo))
  }
}

// Utils
// -------------------------------------------------------------------------------------------------

/*
If defaultUnit is undefined, will throw error if not specified
*/
function refineUnitOption(
  optionName: string,
  options: Options,
  maxUnit: Unit = Unit.Year,
  minUnit: Unit = Unit.Nanosecond,
  defaultUnit?: Unit,
): Unit {
  let unitName = options[optionName]
  if (unitName === undefined) {
    if (defaultUnit === undefined) {
      throw new RangeError('Must specify' + optionName) // best error?
    }
    return defaultUnit
  }

  unitName = toString(unitName)
  const unit = unitNameMap[unitName as UnitName] ??
    durationFieldIndexes[unitName as (keyof DurationFields)]

  if (unit === undefined) {
    throw new RangeError('Invalid unit ' + optionName) // correct error?
  }
  if (unit < minUnit || unit > maxUnit) { // TODO: use clamp?
    throw new RangeError('Out of bounds' + optionName)
  }

  return unit
}

function refineChoiceOption(
  optionName: string,
  enumNameMap: Record<string, number>,
  options: Options,
  defaultChoice = 0,
) {
  const enumName = options[optionName] as string
  if (enumName === undefined) {
    return defaultChoice
  }

  const enumNum = enumNameMap[enumName]
  if (enumNum < 0) {
    throw new RangeError('Must be one of the choices')
  }
  return enumNum
}

export function normalizeOptions(options: Options | undefined) {
  if (options === undefined) {
    return {}
  }
  return ensureObjectlike(options)
}

function normalizeUnitNameOptions(
  options: Options | undefined,
  optionName: string,
) {
  if (typeof options === 'string') {
    return { [optionName]: options }
  }
  return ensureObjectlike(options as Options)
}

function mustHaveMatch(
  props: Options,
  propNames: string[],
) {
  if (!hasAnyPropsByName(props, propNames)) {
    throw new TypeError('Need one: ' + JSON.stringify(propNames))
  }
}

export function toEpochNano(arg: any): LargeInt {
  if (typeof arg !== 'bigint') {
    throw new TypeError('Needs bigint')
  }
  return bigIntToLargeInt(arg)
}

export function clampProp(
  props: Record<PropertyKey, number>,
  propName: string,
  min: number,
  max: number,
  overflow: Overflow,
): number {
  return clamp(props[propName], min, max, overflow, propName)
}

// Primitives
// -------------------------------------------------------------------------------------------------

export function ensureInstanceOf<T>(Class: { new(): T }, obj: T): T {
  if (!(obj instanceof Class)) {
    throw new TypeError('Must be certain type') // TODO: show Class's symbol?
  }
  return obj
}

function ensureType<A>(typeName: string, arg: A): A {
  if (typeof arg !== typeName) {
    throw new TypeError(`Must be certain type ${typeName}`)
  }
  return arg
}

export const ensureString = ensureType.bind(undefined, 'string') as
  (arg: unknown) => string

export const ensureNumber = ensureType.bind(undefined, 'number') as
  (arg: unknown) => number

export const ensureBoolean = ensureType.bind(undefined, 'boolean') as
  (arg: unknown) => boolean

export function ensureInteger(arg: number): number {
  return ensureNumberIsInteger(ensureNumber(arg))
}

export function ensureArray<A extends any[]>(arg: A): A {
  if (!Array.isArray(arg)) {
    throw new TypeError('Must be array')
  }
  return arg
}

export function ensureObjectlike<O extends Options>(arg: O): O {
  if (!isObjectlike(arg)) {
    throw new TypeError('Must be object-like')
  }
  return arg
}

export function toString(arg: any): string {
  if (typeof arg === 'symbol') {
    throw new TypeError('Cannot convert a Symbol to a String')
  }
  return String(arg)
}

/*
truncates floats
*/
export function toInteger(arg: any): number {
  return Math.trunc(toNumber(arg)) || 0 // ensure no -0
}

/*
throws error on floats
*/
export function toIntegerStrict(arg: any): number {
  return ensureNumberIsInteger(toNumber(arg))
}

function ensureNumberIsInteger(num: number): number {
  if (!Number.isInteger(num)) {
    throw new RangeError('must be integer')
  }
  return num || 0 // ensure no -0
}

/*
Caller must do ||0 to ensure no -0
*/
function toNumber(arg: any): number {
  arg = Number(arg)
  if (isNaN(arg)) {
    throw new RangeError('not a number')
  }
  if (!Number.isFinite(arg)) {
    throw new RangeError('must be finite')
  }
  return arg
}
