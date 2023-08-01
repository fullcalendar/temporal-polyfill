import { getInternals } from './class'
import { refineMaybeZonedDateTimeBag } from './convert'
import { DurationFields, durationFieldIndexes } from './durationFields'
import { IsoDateInternals, pluckIsoDateInternals } from './isoFields'
import { parseMaybeZonedDateTime } from './isoParse'
import { LargeInt, bigIntToLargeInt } from './largeInt'
import { PlainDate } from './plainDate'
import { PlainDateTime } from './plainDateTime'
import { TimeZoneArg } from './timeZone'
import { DayTimeUnit, TimeUnit, Unit, UnitName, unitNameMap, unitNanoMap } from './units'
import {
  FilterPropValues,
  clamp,
  hasAnyPropsByName,
  isObjectlike,
  roundExpand,
  roundHalfCeil,
  roundHalfEven,
  roundHalfFloor,
  roundHalfTrunc,
} from './utils'
import { ZonedDateTime, ZonedInternals } from './zonedDateTime'

// Compound Options
// -------------------------------------------------------------------------------------------------
// TODO: always good to spread options tuples? better to nest?

export function refineOverflowOptions(options: OverflowOptions | undefined): Overflow {
  return refineOverflow(normalizeOptions(options))
}

export type ZonedFieldOptions = OverflowOptions & EpochDisambigOptions & OffsetDisambigOptions

export type ZonedFieldTuple = [
  Overflow,
  EpochDisambig,
  OffsetDisambig,
]

export function refineZonedFieldOptions(options: ZonedFieldOptions | undefined): ZonedFieldTuple {
  options = normalizeOptions(options)
  return [
    refineOverflow(options),
    refineEpochDisambig(options),
    refineOffsetDisambig(options),
  ]
}

export function refineEpochDisambigOptions(options: EpochDisambigOptions | undefined): EpochDisambig {
  return refineEpochDisambig(normalizeOptions(options))
}

export type DiffOptions = LargestUnitOptions & SmallestUnitOptions & RoundingIncOptions & RoundingModeOptions

export type DiffTuple = [
  Unit, // largestUnit
  Unit, // smallestUnit
  number, // roundingInc
  RoundingMode
]

export function refineDiffOptions(
  roundingModeInvert: boolean | undefined,
  options: DiffOptions | undefined,
  defaultLargestUnit: Unit,
  maxUnit = Unit.Year,
  minUnit = Unit.Nanosecond,
): DiffTuple {
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

export function refineCalendarDiffOptions(
  options: LargestUnitOptions | undefined, // TODO: definitely make large-unit type via generics
): Unit { // TODO: only year/month/week/day???
  options = normalizeOptions(options)
  return refineLargestUnit(options, Unit.Year, Unit.Day, Unit.Day)
}

export type RoundTuple = [
  Unit, // smallestUnit
  number,
  RoundingMode,
]

const smallestUnitStr = 'smallestUnit'
const largestUnitStr = 'largestUnit'
const totalUnitStr = 'unit'

// TODO: DRY with DiffOptions?
export type RoundingOptions = SmallestUnitOptions & RoundingIncOptions & RoundingModeOptions

/*
Always related to time
*/
export function refineRoundOptions(
  options: RoundingOptions | UnitName,
  maxUnit: DayTimeUnit = Unit.Day,
): RoundTuple {
  options = normalizeUnitNameOptions(options, smallestUnitStr)
  const smallestUnit = refineSmallestUnit(options, maxUnit) as DayTimeUnit
  return [
    smallestUnit,
    refineRoundingInc(options, smallestUnit),
    refineRoundingMode(options, RoundingMode.HalfExpand),
  ]
}

export type DurationRoundOptions = DiffOptions & RelativeToOptions

export type DurationRoundTuple = [
  ...DiffTuple,
  RelativeToInternals?,
]

export function refineDurationRoundOptions(
  options: DurationRoundOptions,
  defaultLargestUnit: Unit
): DurationRoundTuple {
  options = normalizeUnitNameOptions(options, smallestUnitStr)
  mustHaveMatch(options, [largestUnitStr, smallestUnitStr]) // will register unwanted read?
  // ^do a whitelist filter that copies instead?

  return [
    ...refineDiffOptions(false, options, defaultLargestUnit), // double-refined. oh well
    refineRelativeTo(options),
  ]
}

export type TotalUnitOptionsWithRel = TotalUnitOptions & RelativeToOptions

export function refineTotalOptions(
  options: TotalUnitOptionsWithRel | UnitName
): [
  Unit,
  RelativeToInternals | undefined,
] {
  options = normalizeUnitNameOptions(options, totalUnitStr)
  return [
    refineTotalUnit(options), // required
    refineRelativeTo(options),
  ]
}

export function refineRelativeToOptions(options: RelativeToOptions | undefined): RelativeToInternals | undefined {
  return refineRelativeTo(normalizeOptions(options))
}

export type InstantDisplayOptions =
  { timeZone: TimeZoneArg } &
  TimeDisplayOptions

export type InstantDisplayTuple = [
  TimeZoneArg,
  ...TimeDisplayTuple,
]

export function refineInstantDisplayOptions(options: InstantDisplayOptions | undefined): InstantDisplayTuple {
  options = normalizeOptions(options)
  return [
    options.timeZone as TimeZoneArg, // TODO: possibly not needed after moving away from Record
    ...refineTimeDisplayTuple(options),
  ]
}

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

export function refineZonedDateTimeDisplayOptions(options: ZonedDateTimeDisplayOptions | undefined): ZonedDateTimeDisplayTuple {
  options = normalizeOptions(options)
  return [
    refineCalendarDisplay(options),
    refineTimeZoneDisplay(options),
    refineOffsetDisplay(options),
    ...refineTimeDisplayTuple(options),
  ]
}

export type DateTimeDisplayOptions = CalendarDisplayOptions & TimeDisplayOptions

export type DateTimeDisplayTuple = [
  CalendarDisplay,
  ...TimeDisplayTuple,
]

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

export type TimeDisplayTuple = [
  nanoInc: number,
  roundingMode: RoundingMode,
  subsecDigits: SubsecDigits | -1 | undefined
]

// TODO: lock-down subset of Unit here?
export type TimeDisplayOptions = SmallestUnitOptions & RoundingModeOptions & SubsecDigitsOptions

export function refineTimeDisplayOptions(
  options: TimeDisplayOptions | undefined,
  maxSmallestUnit?: TimeUnit
): TimeDisplayTuple {
  return refineTimeDisplayTuple(normalizeOptions(options), maxSmallestUnit)
}

function refineTimeDisplayTuple(
  options: TimeDisplayOptions,
  maxSmallestUnit: TimeUnit = Unit.Minute
): TimeDisplayTuple {
  const smallestUnit = refineSmallestUnit(options, maxSmallestUnit, Unit.Nanosecond, -1 as number)
  if ((smallestUnit as number) !== -1) {
    return [
      unitNanoMap[smallestUnit],
      refineRoundingMode(options, RoundingMode.Trunc),
      (smallestUnit < Unit.Minute)
        ? (9 - (smallestUnit * 3)) as SubsecDigits
        : -1, // hide seconds --- NOTE: not relevant when maxSmallestUnit is <minute !!!
    ]
  }

  const subsecDigits = refineSubsecDigits(options)
  return [
    subsecDigits === undefined ? 1 : 10 ** (9 - subsecDigits),
    refineRoundingMode(options, RoundingMode.Trunc),
    subsecDigits,
  ]
}

//
// TODO: generic for DayTimeUnit/TimeUnit?

interface SmallestUnitOptions {
  smallestUnit?: UnitName | keyof DurationFields
}

interface LargestUnitOptions {
  largestUnit?: UnitName | keyof DurationFields
}

interface TotalUnitOptions {
  unit: UnitName | keyof DurationFields
}

//

const refineSmallestUnit = refineUnitOption.bind<
  any, [any], // bound
  [SmallestUnitOptions, Unit?, Unit?, Unit?], // unbound
  Unit // return
>(undefined, smallestUnitStr)

const refineLargestUnit = refineUnitOption.bind<
  any, [any], // bound
  [LargestUnitOptions, Unit?, Unit?, Unit?], // unbound
  Unit
>(undefined, largestUnitStr)

// TODO: get totalUnitStr closer to this! etc
const refineTotalUnit = refineUnitOption.bind<
  any, [any], // bound
  [TotalUnitOptions, Unit?, Unit?, Unit?], // unbound
  Unit
>(undefined, totalUnitStr)

// Overflow
// -------------------------------------------------------------------------------------------------

export const enum Overflow {
  Constrain,
  Reject,
}

export interface OverflowOptions {
  overflow?: keyof typeof overflowMap
}

const overflowMap = {
  constrain: Overflow.Constrain,
  reject: Overflow.Reject,
}

const refineOverflow = refineChoiceOption.bind<
  any, [any, any], // bound
  [OverflowOptions, Overflow?], // unbound
  Overflow // return
>(undefined, 'overflow', overflowMap)

// Epoch Disambig
// -------------------------------------------------------------------------------------------------

export const enum EpochDisambig {
  Compat,
  Reject,
  Earlier,
  Later,
}

export interface EpochDisambigOptions {
  disambiguation?: keyof typeof epochDisambigMap
}

const epochDisambigMap = {
  compatible: EpochDisambig.Compat,
  reject: EpochDisambig.Reject,
  earlier: EpochDisambig.Earlier,
  later: EpochDisambig.Later,
}

const refineEpochDisambig = refineChoiceOption.bind<
  any, [any, any], // bound
  [EpochDisambigOptions, EpochDisambig?], // unbound
  EpochDisambig // return
>(undefined, 'disambiguation', epochDisambigMap)

// Offset Disambig
// -------------------------------------------------------------------------------------------------

export const enum OffsetDisambig {
  Use,
  Reject,
  Prefer,
  Ignore,
}

export interface OffsetDisambigOptions {
  offset?: keyof typeof offsetDisambigMap
}

const offsetDisambigMap = {
  use: OffsetDisambig.Use,
  reject: OffsetDisambig.Reject,
  prefer: OffsetDisambig.Prefer,
  ignore: OffsetDisambig.Ignore,
}

const refineOffsetDisambig = refineChoiceOption.bind<
  any, [any, any], // bound
  [OffsetDisambigOptions, OffsetDisambig?], // unbound
  OffsetDisambig // return
>(undefined, 'offset', offsetDisambigMap)

// Calendar Display
// -------------------------------------------------------------------------------------------------

export const enum CalendarDisplay {
  Auto,
  Never,
  Critical,
  Always,
}

export interface CalendarDisplayOptions {
  calendarName?: keyof typeof calendarDisplayMap
}

const calendarDisplayMap = {
  auto: CalendarDisplay.Auto,
  never: CalendarDisplay.Never,
  critical: CalendarDisplay.Critical,
  always: CalendarDisplay.Always,
}

const refineCalendarDisplay = refineChoiceOption.bind<
  any, [any, any], // bound
  [CalendarDisplayOptions, CalendarDisplay?], // unbound
  CalendarDisplay // return
>(undefined, 'calendarName', calendarDisplayMap)

// TimeZone Display
// -------------------------------------------------------------------------------------------------

export const enum TimeZoneDisplay {
  Auto,
  Never,
  Critical,
}

export interface TimeZoneDisplayOptions {
  timeZoneName?: keyof typeof timeZoneDisplayMap
}

const timeZoneDisplayMap = {
  auto: TimeZoneDisplay.Auto,
  never: TimeZoneDisplay.Never,
  critical: TimeZoneDisplay.Critical,
}

const refineTimeZoneDisplay = refineChoiceOption.bind<
  any, [any, any], // bound
  [TimeZoneDisplayOptions, TimeZoneDisplay?], // unbound
  TimeZoneDisplay // return
>(undefined, 'timeZoneName', timeZoneDisplayMap)

// Offset Display
// -------------------------------------------------------------------------------------------------

export const enum OffsetDisplay {
  Auto,
  Never,
}

export interface OffsetDisplayOptions {
  offset?: keyof typeof offsetDisplayMap
}

const offsetDisplayMap = {
  auto: OffsetDisplay.Auto,
  never: OffsetDisplay.Never,
}

const refineOffsetDisplay = refineChoiceOption.bind<
  any, [any, any], // bound
  [OffsetDisplayOptions, OffsetDisplay?], // unbound
  OffsetDisplay // return
>(undefined, 'offset', offsetDisplayMap)

// Rounding Mode
// -------------------------------------------------------------------------------------------------

export const enum RoundingMode {
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

export interface RoundingModeOptions {
  roundingMode?: keyof typeof roundingModeMap
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

// Caller should always supply default
const refineRoundingMode = refineChoiceOption.bind<
  any, [any, any], // bound
  [RoundingModeOptions, RoundingMode?], // unbound
  RoundingMode // return
>(undefined, 'roundingMode', roundingModeMap)

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

// Rounding Increment
// -------------------------------------------------------------------------------------------------

export interface RoundingIncOptions {
  roundingIncrement?: number
}

const roundingIncName = 'roundingIncrement'

function refineRoundingInc(options: RoundingIncOptions, smallestUnit: DayTimeUnit) {
  let roundingInc = options[roundingIncName]

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

// Subsec Digits
// -------------------------------------------------------------------------------------------------

/*
addons:
  -1 means hide seconds
  undefined means 'auto' (display all digits but no trailing zeros)
*/
export type SubsecDigits = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

export interface SubsecDigitsOptions {
  fractionalSecondDigits?: SubsecDigits
}

const subsecDigitsName = 'fractionalSecondDigits'

function refineSubsecDigits(options: SubsecDigitsOptions): SubsecDigits | undefined {
  const subsecDigits = options[subsecDigitsName]

  if (typeof subsecDigits === 'number') {
    return clamp(Math.floor(subsecDigits), 0, 9, Overflow.Reject, subsecDigitsName) as SubsecDigits
  }

  if (String(subsecDigits) !== 'auto') {
    throw new RangeError('Must be auto or 0-9')
  }

  // undefind means 'auto'
}

// Relative-To
// -------------------------------------------------------------------------------------------------

export interface RelativeToOptions {
  relativeTo?: ZonedDateTime | PlainDate | string // TODO: include 'bag' in here
}

// TODO: use in definition of `createMarkerSystem` ?
type RelativeToInternals = ZonedInternals | IsoDateInternals

function refineRelativeTo(options: RelativeToOptions): RelativeToInternals | undefined {
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

      return refineMaybeZonedDateTimeBag(relativeTo)
    }

    return parseMaybeZonedDateTime(toString(relativeTo))
  }
}

// Utils
// -------------------------------------------------------------------------------------------------

/*
If defaultUnit is undefined, will throw error if not specified
*/
function refineUnitOption<O>(
  optionName: (keyof O) & string,
  options: O,
  maxUnit: Unit = Unit.Year,
  minUnit: Unit = Unit.Nanosecond,
  defaultUnit?: Unit,
): Unit {
  let unitName = options[optionName] as (string | undefined)

  if (unitName === undefined || unitName === 'auto') {
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

function refineChoiceOption<O>(
  optionName: keyof O,
  enumNameMap: Record<string, number>,
  options: O,
  defaultChoice = 0,
): number {
  const enumName = options[optionName] as (string | undefined)
  if (enumName === undefined) {
    return defaultChoice
  }

  const enumNum = enumNameMap[enumName]
  if (enumNum < 0) {
    throw new RangeError('Must be one of the choices')
  }
  return enumNum
}

export function normalizeOptions<O extends {}>(options: O | undefined): O {
  if (options === undefined) {
    return {} as O
  }
  return ensureObjectlike(options)
}

function normalizeUnitNameOptions<O extends {}>(
  options: O | UnitName,
  optionName: keyof O,
): O {
  if (typeof options === 'string') {
    return { [optionName]: options } as O
  }
  return ensureObjectlike(options)
}

function mustHaveMatch<O>(
  props: O,
  propNames: (keyof O)[],
): void {
  if (!hasAnyPropsByName(props, propNames)) {
    throw new TypeError('Need one: ' + JSON.stringify(propNames))
  }
}

export function toEpochNano(arg: bigint): LargeInt {
  if (typeof arg !== 'bigint') {
    throw new TypeError('Needs bigint')
  }
  return bigIntToLargeInt(arg)
}

export function clampProp<P>(
  props: P,
  propName: keyof FilterPropValues<P, number> & string,
  min: number,
  max: number,
  overflow: Overflow | -1,
): number {
  return clamp(props[propName] as number, min, max, overflow, propName)
}

// Primitives
// -------------------------------------------------------------------------------------------------
// NOTE: even though these accept 'any', strictly type so TS interface is more strict

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
  (arg: string) => string

export const ensureNumber = ensureType.bind(undefined, 'number') as
  (arg: number) => number

export const ensureBoolean = ensureType.bind(undefined, 'boolean') as
  (arg: boolean) => boolean

export function ensureInteger(arg: number): number {
  return ensureNumberIsInteger(ensureNumber(arg))
}

export function ensureArray<A extends any[]>(arg: A): A {
  if (!Array.isArray(arg)) {
    throw new TypeError('Must be array')
  }
  return arg
}

export function ensureObjectlike<O extends {}>(arg: O): O {
  if (!isObjectlike(arg)) {
    throw new TypeError('Must be object-like')
  }
  return arg
}

export function toString(arg: string): string {
  if (typeof arg === 'symbol') {
    throw new TypeError('Cannot convert a Symbol to a String')
  }
  return String(arg)
}

/*
truncates floats
*/
export function toInteger(arg: number): number {
  return Math.trunc(toNumber(arg)) || 0 // ensure no -0
}

/*
throws error on floats
*/
export function toIntegerStrict(arg: number): number {
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
function toNumber(arg: number): number {
  arg = Number(arg)
  if (isNaN(arg)) {
    throw new RangeError('not a number')
  }
  if (!Number.isFinite(arg)) {
    throw new RangeError('must be finite')
  }
  return arg
}
