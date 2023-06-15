import { durationFieldIndexes } from './durationFields'
import { bigIntToLargeInt } from './largeInt'
import { dayIndex, minuteIndex, nanoIndex, unitIndexToNano, unitIndexes, yearIndex } from './units'
import { clamp, hasAnyMatchingProps, isObjectLike } from './utils'

// TODO: ensure all callers use *INDEXES*

// Compound Options
// -------------------------------------------------------------------------------------------------

export function refineOverflowOptions(options) {
  return refineOverflow(normalizeOptions(options))
}

export function refineZonedFieldOptions(options) {
  options = normalizeOptions(options)
  return [
    refineOverflow(options),
    refineEpochDisambig(options),
    refineOffsetDisambig(options),
  ]
}

export function refineEpochDisambigOptions(options) {
  return refineEpochDisambig(normalizeOptions(options))
}

export function refineDiffOptions(
  roundingModeInvert,
  options,
  defaultLargestUnitI,
  maxUnitI = yearIndex,
  minUnitI = nanoIndex,
) {
  options = normalizeOptions(options)
  const smallestUnitI = refineSmallestUnit(options, maxUnitI, minUnitI, minUnitI)
  const largestUnitI = refineLargestUnit(
    options,
    maxUnitI,
    Math.max(smallestUnitI, minUnitI),
    Math.max(smallestUnitI, defaultLargestUnitI),
  )

  const roundingIncrement = refineRoundingInc(options, smallestUnitI)

  let roundingMode = refineRoundingMode(options, truncI)
  if (roundingModeInvert) {
    roundingMode = invertRoundingMode(roundingMode)
  }

  return [largestUnitI, smallestUnitI, roundingIncrement, roundingMode]
}

/*
Always related to time
*/
export function refineRoundOptions(options, maxUnitI = dayIndex) {
  options = normalizeRequiredOptions(options, smallestUnitStr)
  const smallestUnitI = refineSmallestUnit(options, maxUnitI) // required
  return [
    smallestUnitI,
    refineRoundingInc(options, smallestUnitI),
    refineRoundingMode(options, halfExpandI),
  ]
}

export function refineDurationRoundOptions(options, defaultLargestUnitI) {
  options = normalizeRequiredOptions(options, smallestUnitStr)
  mustHaveMatch(options, [largestUnitStr, smallestUnitStr]) // will register unwanted read?
  // ^do a whitelist filter that copies instead?
  return [
    ...refineDiffOptions(options, defaultLargestUnitI), // double-refined. oh well
    refineRelativeTo(options),
  ]
}

export function refineTotalOptions(options) {
  options = normalizeRequiredOptions(options, totalUnitStr)
  return [
    refineTotalUnit(options), // required
    refineRelativeTo(options),
  ]
}

export function refineRelativeToOptions(options) {
  return refineRelativeTo(normalizeOptions(options))
}

export function refineInstantDisplayOptions(options) {
  options = normalizeOptions(options)
  return [
    options.timeZone,
    ...refineTimeDisplayTuple(options),
  ]
}

export function refineZonedDateTimeDisplayOptions(options) {
  options = normalizeOptions(options)
  return [
    refineCalendarDisplay(options),
    refineTimeZoneDisplay(options),
    refineOffsetDisplay(options),
    ...refineTimeDisplayTuple(options),
  ]
}

export function refineDateTimeDisplayOptions(options) {
  options = normalizeOptions(options)
  return [
    refineCalendarDisplay(options),
    ...refineTimeDisplayTuple(options),
  ]
}

export function refineDateDisplayOptions(options) {
  return refineCalendarDisplay(normalizeOptions(options))
}

export function refineTimeDisplayOptions(options) {
  return refineTimeDisplayTuple(normalizeOptions(options))
}

/*
returns [
  nanoInc,
  roundingMode,
  showSecond,
  subsecDigits,
]
*/
function refineTimeDisplayTuple(options) {
  const smallestUnitI = refineSmallestUnit(options, minuteIndex, nanoIndex, -1)
  if (smallestUnitI !== -1) {
    return [
      unitIndexToNano[smallestUnitI],
      refineRoundingMode(options, truncI),
      smallestUnitI < minuteIndex, // showSecond
      9 - (smallestUnitI * 3), // subsecDigits (callers should guard for <0)
    ]
  }

  const subsecDigits = refineSubsecDigits(options)
  return [
    Math.pow(10, 9 - subsecDigits), // TODO: use 10** notation?
    refineRoundingMode(options, truncI),
    true, // showSecond
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

export const constrainI = 0
export const rejectI = 1 // must be truthy for clamp's throwOnOverflow param
const refineOverflow = refineChoiceOption.bind(undefined, 'overflow', [
  'constrain',
  'reject',
])

export const compatibleI = 0
/* export const rejectI = 1 */
export const earlierI = 2
export const laterI = 3
const refineEpochDisambig = refineChoiceOption.bind(undefined, 'disambiguation', [
  'compatible',
  'reject',
  'earlier',
  'later',
])

export const useI = 0
/* export const rejectI = 1 */
export const preferI = 2
export const ignoreI = 3
const refineOffsetDisambig = refineChoiceOption.bind(undefined, 'offset', [
  'use',
  'reject',
  'prefer',
  'ignore',
])

export const autoI = 0
export const neverI = 1
export const criticalI = 2
export const alwaysI = 3
const refineCalendarDisplay = refineChoiceOption.bind(undefined, 'calendarName', [
  'auto',
  'never',
  'critical',
  'always',
])

/* export const autoI = 0 */
/* export const neverI = 1 */
/* export const criticalI = 2 */
const refineTimeZoneDisplay = refineChoiceOption.bind(undefined, 'timeZoneName', [
  'auto',
  'never',
  'critical',
])

/* export const autoI = 0 */
/* export const neverI = 1 */
const refineOffsetDisplay = refineChoiceOption.bind(undefined, 'offset', [
  'auto',
  'never',
])

export const floorI = 0
export const halfFloorI = 1
export const ceilI = 2
export const halfCeilI = 3
export const truncI = 4
export const halfTruncI = 5
export const expandI = 6
export const halfExpandI = 7
export const halfEvenI = 8
/*
Caller should always supply default
*/
const refineRoundingMode = refineChoiceOption.bind(undefined, 'roundingMode', [
  // modes that get inverted (see invertRoundingMode)
  'floor',
  'halfFloor',
  'ceil',
  'halfCeil',
  // other modes
  'trunc', // default for most things
  'halfTrunc',
  'expand',
  'halfExpand', // default for date/time::round()
  'halfEven',
])

function invertRoundingMode(roundingModeI) {
  if (roundingModeI < 4) {
    return (roundingModeI + 2) % 4
  }
  return roundingModeI
}

function refineRoundingInc(options, validateWithSmallestUnitI) {
  // default to 1
  // with smallestUnit...
  /*
    if (roundTo === undefined) throw new TypeError('options parameter is required');
    if (ES.Type(roundTo) === 'String') {
      const stringParam = roundTo;
      roundTo = ObjectCreate(null);
      roundTo.smallestUnit = stringParam;
    } else {
      roundTo = ES.GetOptionsObject(roundTo);
    }
    const roundingIncrement = ES.ToTemporalRoundingIncrement(roundTo);
    const roundingMode = ES.ToTemporalRoundingMode(roundTo, 'halfExpand');
    const smallestUnit = ES.GetTemporalUnit(roundTo, 'smallestUnit', 'time', ES.REQUIRED, ['day']);
    const maximumIncrements = {
      day: 1,
      hour: 24,
      minute: 60,
      second: 60,
      millisecond: 1000,
      microsecond: 1000,
      nanosecond: 1000
    };
    const maximum = maximumIncrements[smallestUnit];
    const inclusive = maximum === 1;
    ES.ValidateTemporalRoundingIncrement(roundingIncrement, maximum, inclusive);
  */
}

const subsecDigitsName = 'fractionalSecondDigits'

function refineSubsecDigits(options) {
  const subsecDigits = options[subsecDigitsName]

  if (typeof subsecDigits === 'number') {
    return clamp(Math.floor(subsecDigits), 0, 9, 1, subsecDigitsName) // throwOnError=1
  }

  if (String(subsecDigits) !== 'auto') {
    throw new RangeError('Must be auto or 0-9')
  }

  return 9
}

function refineRelativeTo(options) {
  // TODO
  // should return ZoneDateTimeINTERNALS or PlainDateINTERNALS
  // allow undefined
}

// Utils
// -------------------------------------------------------------------------------------------------

/*
If defaultUnitI is undefined, will throw error if not specified
*/
function refineUnitOption(optionName, options, maxUnitI, minUnitI = nanoIndex, defaultUnitI) {
  let unitName = options[optionName]
  if (unitName === undefined) {
    if (defaultUnitI === undefined) {
      throw new RangeError('Must specify' + optionName) // best error?
    }
    return defaultUnitI
  }

  unitName = toString(unitName)
  const unitIndex = unitIndexes[unitName] ?? durationFieldIndexes[unitName]

  if (unitIndex === undefined) {
    throw new RangeError('Invalid unit ' + optionName) // correct error?
  }
  if (unitIndex < minUnitI || unitIndex > maxUnitI) { // TODO: use clamp?
    throw new RangeError('Out of bounds' + optionName)
  }

  return unitIndex
}

// TODO: optimize by using map
// TODO: keep acceting string arrays. good for accepting default first element
function refineChoiceOption(optionName, choices, options, defaultChoice) {
  const optionValue = options[optionName]
  if (optionValue === undefined) {
    return defaultChoice ?? choices[0]
  }
  const index = choices.indexOf(optionValue)
  if (index < 0) {
    throw new RangeError('Must be one of the choices')
  }
  return index
}

export function normalizeOptions(options) {
  if (options === undefined) {
    return {}
  }
  if (!isObjectLike(options)) {
    throw new TypeError('Must be object-like')
  }
  return options
}

// will NOT check for atomicName in options
function normalizeRequiredOptions(options, atomicName) {
  if (typeof options === 'string') {
    return { [atomicName]: options }
  }
  if (!isObjectLike(options)) {
    throw new TypeError('Must be object-like')
  }
  return options
}

function mustHaveMatch(obj, propNames) {
  if (!hasAnyMatchingProps(obj, propNames)) {
    throw new TypeError('Need one: ' + JSON.stringify(propNames))
  }
}

export function toEpochNano(input) {
  if (typeof input !== 'bigint') {
    throw new TypeError('Needs bigint')
  }
  return bigIntToLargeInt(input)
}

export function clampProp(props, propName, min, max, overflowI) {
  return clamp(props[propName], min, max, overflowI, propName)
}

// Primitives
// -------------------------------------------------------------------------------------------------

export function strictNumber(input) {
}

export function strictInstanceOf(obj, Class) {
}

export function strictArray() {
}

export function toObject() {
  // ensures a real object. throws error otherwise
}

export function toNumber(value) {
  if (typeof value === 'bigint') {
    throw new TypeError('Cannot convert BigInt to number')
  }
  return Number(value)
}

export function toInteger(value) {
  const num = toNumber(value)
  if (isNaN(num)) return 0
  const integer = Math.trunc(num)
  if (num === 0) return 0
  return integer
}

export function toStringOrUndefined() {
}

export function toNumberOrUndefined() {
}

export function toString(value) {
  if (typeof value === 'symbol') {
    throw new TypeError('Cannot convert a Symbol value to a String')
  }
  return String(value)
}

export function toIntegerThrowOnInfinity(value) {
  const integer = toInteger(value)
  if (!Number.isFinite(integer)) {
    throw new RangeError('infinity is out of range')
  }
  return integer
}

export function toBoolean() {
}

export function toPositiveInteger(valueParam, property) {
  const value = toInteger(valueParam)
  if (!Number.isFinite(value)) {
    throw new RangeError('infinity is out of range')
  }
  if (value < 1) {
    if (property !== undefined) {
      throw new RangeError(`property '${property}' cannot be a a number less than one`)
    }
    throw new RangeError('Cannot convert a number less than one to a positive integer')
  }
  return value
}

export function toIntegerWithoutRounding(valueParam) {
  const value = toNumber(valueParam)
  if (isNaN(value)) return 0
  if (!Number.isFinite(value)) {
    throw new RangeError('infinity is out of range')
  }
  if (!Number.isInteger(value)) {
    throw new RangeError(`unsupported fractional value ${value}`)
  }
  return toInteger(value) // ℝ(value) in spec text; converts -0 to 0
}
