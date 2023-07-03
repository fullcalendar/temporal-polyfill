import { parseDateTime } from '../dateUtils/parse'
import { durationFieldIndexes } from './durationFields'
import { pluckIsoDateTimeInternals } from './isoFields'
import { processZonedDateTimeParse } from './isoParse'
import { bigIntToLargeInt } from './largeInt'
import { dayIndex, minuteIndex, nanoIndex, unitIndexToNano, unitIndexes, yearIndex } from './units'
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

  const roundingInc = refineRoundingInc(options, smallestUnitI)

  let roundingMode = refineRoundingMode(options, truncI)
  if (roundingModeInvert) {
    roundingMode = invertRoundingMode(roundingMode)
  }

  return [largestUnitI, smallestUnitI, roundingInc, roundingMode]
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
  subsecDigits, (undefined = auto-digits, -1 = hide-seconds, >=0 = #-of-digits)
]
*/
function refineTimeDisplayTuple(options) { // trace callers of this, make sure using right
  const smallestUnitI = refineSmallestUnit(options, minuteIndex, nanoIndex, -1)
  if (smallestUnitI !== -1) {
    return [
      unitIndexToNano[smallestUnitI],
      refineRoundingMode(options, truncI),
      (smallestUnitI < minuteIndex)
        ? 9 - (smallestUnitI * 3)
        : -1, // hide seconds
    ]
  }

  const subsecDigits = refineSubsecDigits(options)
  return [
    subsecDigits === undefined ? 1 : Math.pow(10, 9 - subsecDigits), // TODO: use 10** notation?
    refineRoundingMode(options, truncI),
    subsecDigits,
  ]
}

// Single Options
// -------------------------------------------------------------------------------------------------

/*
TODO: leverage preserveConstEnums:false
https://www.typescriptlang.org/tsconfig#preserveConstEnums

const enum Album {
  JimmyEatWorldFutures,
  TubRingZooHypothesis,
  DogFashionDiscoAdultery,
}
console.log({
  JimmyEatWorldFutures: Album.JimmyEatWorldFutures,
  TubRingZooHypothesis: Album.TubRingZooHypothesis,
  DogFashionDiscoAdultery: Album.DogFashionDiscoAdultery,
})
console.log(Album.JimmyEatWorldFutures)
*/

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

function invertRoundingMode(roundingModeI) {
  if (roundingModeI < 4) {
    return (roundingModeI + 2) % 4
  }
  return roundingModeI
}

const roundingIncName = 'roundingIncrement'

function refineRoundingInc(options, smallestUnitI) { // smallestUnit is day/time
  let roundingInc = options[roundingIncName]
  if (roundingInc === undefined) {
    return 1
  }

  const upUnitNano = unitIndexToNano[smallestUnitI + 1]

  if (upUnitNano) {
    const unitNano = unitIndexToNano[smallestUnitI]
    const maxRoundingInc = upUnitNano / unitNano
    roundingInc = clamp(roundingInc, 1, maxRoundingInc - 1, roundingIncName)

    if (upUnitNano % (roundingInc * unitNano)) {
      throw new RangeError('Must be even multiple')
    }
  } else {
    roundingInc = clamp(roundingInc, 1, 1, roundingIncName)
  }

  return roundingInc
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

  // undefind means 'auto'
}

function refineRelativeTo(options) {
  const parsed = parseDateTime(options)

  if (parsed.timeZone) {
    return processZonedDateTimeParse(parsed)
  }

  return pluckIsoDateTimeInternals(parsed)
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

// TODO: move to accepting maps
function refineChoiceOption(optionName, choices, options, defaultChoice) {
  const optionValue = options[optionName]
  if (optionValue === undefined) {
    return defaultChoice ?? 0
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
  return ensureObjectlike(options)
}

// will NOT check for atomicName in options
function normalizeRequiredOptions(options, atomicName) {
  if (typeof options === 'string') {
    return { [atomicName]: options }
  }
  return ensureObjectlike(options)
}

function mustHaveMatch(obj, propNames) {
  if (!hasAnyPropsByName(obj, propNames)) {
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

export function ensureInstanceOf(Class, obj) {
  if (!(obj instanceof Class)) {
    throw new TypeError('Must be certain type') // TODO: show Class's symbol?
  }
  return obj
}

function ensureType(typeName, obj) {
  // eslint-disable-next-line valid-typeof
  if (typeof obj !== typeName) {
    throw new TypeError(`Must be certain type ${typeName}`)
  }
  return obj
}

export const ensureBoolean = ensureType.bind(undefined, 'boolean')
export const ensureString = ensureType.bind(undefined, 'string')
export const ensureNumber = ensureType.bind(undefined, 'number')

export function ensureInteger(arg) {
  return ensureNumberIsInteger(ensureNumber(arg))
}

export function ensureArray(arg) {
  if (!Array.isArray(arg)) {
    throw new TypeError('Must be array')
  }
  return arg
}

export function ensureObjectlike(arg) {
  if (!isObjectlike(arg)) {
    throw new TypeError('Must be object-like')
  }
  return arg
}

export function toString(value) {
  if (typeof value === 'symbol') {
    throw new TypeError('Cannot convert a Symbol value to a String')
  }
  return String(value)
}

export function toInteger(value) { // truncates floats
  return Math.trunc(toNumber(value)) || 0 // ensure no -0
}

export function toIntegerStrict(value) { // throws error on floats
  return ensureNumberIsInteger(toNumber(value))
}

function ensureNumberIsInteger(n) {
  if (!Number.isInteger(n)) {
    throw new RangeError('must be integer')
  }
  return n || 0 // ensure no -0
}

/*
Caller must ||0 to ensure no -0
*/
function toNumber(value) {
  value = Number(value)
  if (isNaN(value)) {
    throw new RangeError('not a number')
  }
  if (!Number.isFinite(value)) {
    throw new RangeError('must be finite')
  }
  return value
}
