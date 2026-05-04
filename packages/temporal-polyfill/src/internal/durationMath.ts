import { BigNano, addBigNanos, bigNanoToNumber } from './bigNano'
import {
  DurationFields,
  DurationTimeFields,
  durationCalendarFieldNamesAsc,
  durationDateFieldNamesAsc,
  durationFieldDefaults,
  durationFieldNamesAsc,
} from './durationFields'
import * as errorMessages from './errorMessages'
import { timeFieldDefaults } from './fieldNames'
import { CalendarDateFields, CalendarDateTimeFields } from './fieldTypes'
import { combineDateAndTime } from './fieldUtils'
import { Overflow } from './optionsModel'
import { DurationRoundingOptions, RelativeToOptions } from './optionsModel'
import { normalizeOptions } from './optionsNormalize'
import { refineDurationRoundOptions } from './optionsRoundingRefine'
import {
  RelativeToSlots,
  createDiffMarkers,
  createMarkerToEpochNano,
  createMoveMarker,
  createRelativeOrigin,
  isUniformUnit,
  isZonedEpochSlots,
} from './relativeMath'
import { roundDayTimeDuration, roundRelativeDuration } from './round'
import { DurationSlots, createDurationSlots } from './slots'
import { checkIsoDateTimeInBounds } from './timeMath'
import { givenFieldsToBigNano, nanoToGivenFields } from './unitMath'
import {
  DayTimeUnit,
  TimeUnit,
  Unit,
  nanoInSec,
  nanoInUtcDay,
  unitNanoMap,
} from './units'
import { NumberSign, clampEntity } from './utils'

const maxCalendarUnit = 2 ** 32 - 1 // inclusive
const maxDurationSeconds = 2 ** 53

const maxTimeFieldByUnit: bigint[] = [
  computeMaxTimeField(Unit.Nanosecond),
  computeMaxTimeField(Unit.Microsecond),
  computeMaxTimeField(Unit.Millisecond),
  BigInt(Number.MAX_SAFE_INTEGER),
]

function computeMaxTimeField(unit: TimeUnit): bigint {
  const unitsPerSecond = nanoInSec / unitNanoMap[unit]
  let lower = BigInt(0)
  let upper = BigInt(2) ** BigInt(53)
  upper = upper * BigInt(unitsPerSecond) - BigInt(1)

  while (lower < upper) {
    const middle = (lower + upper + BigInt(1)) >> BigInt(1)

    if (Number(middle) / unitsPerSecond < maxDurationSeconds) {
      lower = middle
    } else {
      upper = middle - BigInt(1)
    }
  }

  return lower
}

function truncBigNanoToBigInt(bigNano: BigNano, divisorNano: number): bigint {
  return (
    BigInt(bigNano[0]) * BigInt(nanoInUtcDay / divisorNano) +
    BigInt(Math.trunc(bigNano[1] / divisorNano))
  )
}

function absBigInt(num: bigint): bigint {
  return num < BigInt(0) ? -num : num
}

// Adding
// -----------------------------------------------------------------------------

export function addDurations<RA>(
  refineRelativeTo: (relativeToArg?: RA) => RelativeToSlots | undefined,
  doSubtract: boolean,
  slots: DurationSlots,
  otherSlots: DurationSlots,
  options?: RelativeToOptions<RA>,
): DurationSlots {
  const normalOptions = normalizeOptions(options)
  const relativeToSlots = refineRelativeTo(normalOptions.relativeTo)
  const maxUnit = Math.max(
    getMaxDurationUnit(slots),
    getMaxDurationUnit(otherSlots),
  ) as Unit

  if (isUniformUnit(maxUnit, relativeToSlots)) {
    return createDurationSlots(
      checkDurationUnits(
        addDayTimeDurations(
          slots,
          otherSlots,
          maxUnit as DayTimeUnit, // largestUnit
          doSubtract,
        ),
      ),
    )
  }

  if (!relativeToSlots) {
    throw new RangeError(errorMessages.missingRelativeTo)
  }

  if (doSubtract) {
    otherSlots = negateDurationFields(otherSlots) as any // !!!
  }

  const [marker, timeZoneImpl] = createRelativeOrigin(relativeToSlots)
  const moveMarker = createMoveMarker(timeZoneImpl, relativeToSlots.calendarId)
  const diffMarkers = createDiffMarkers(timeZoneImpl, relativeToSlots.calendarId)

  const midMarker = moveMarker(marker, slots)
  const endMarker = moveMarker(midMarker, otherSlots)
  const balancedDuration = diffMarkers(marker, endMarker, maxUnit)

  return createDurationSlots(balancedDuration)
}

function addDayTimeDurations(
  a: DurationFields,
  b: DurationFields,
  largestUnit: DayTimeUnit,
  doSubtract?: boolean,
): DurationFields {
  const bigNano0 = durationFieldsToBigNano(a)
  const bigNano1 = durationFieldsToBigNano(b)
  const combined = addBigNanos(bigNano0, bigNano1, doSubtract ? -1 : 1)

  if (!Number.isFinite(combined[0])) {
    throw new RangeError(errorMessages.outOfBoundsDate)
  }

  return {
    ...durationFieldDefaults,
    ...nanoToDurationDayTimeFields(combined, largestUnit),
  }
}

// Rounding
// -----------------------------------------------------------------------------

export function roundDuration<RA>(
  refineRelativeTo: (relativeToArg?: RA) => RelativeToSlots | undefined,
  slots: DurationSlots,
  options: DurationRoundingOptions<RA>,
): DurationSlots {
  const durationLargestUnit = getMaxDurationUnit(slots)
  const [
    largestUnit,
    smallestUnit,
    roundingInc,
    roundingMode,
    relativeToSlots,
  ] = refineDurationRoundOptions(options, durationLargestUnit, refineRelativeTo)

  const maxUnit = Math.max(durationLargestUnit, largestUnit)

  // NEW: Only do time-rounding short-circuit if no relativeTo specified
  if (!relativeToSlots && maxUnit <= Unit.Day) {
    return createDurationSlots(
      checkDurationUnits(
        roundDayTimeDuration(
          slots,
          largestUnit as DayTimeUnit,
          smallestUnit as DayTimeUnit,
          roundingInc,
          roundingMode,
        ),
      ),
    )
  }

  // A blank duration usually returns itself. The exception is zoned sub-day
  // rounding with a day-or-larger largest unit: even a zero duration rounds
  // through the day-length path, which observes the next-day boundary.
  const needsZonedDayLength =
    relativeToSlots &&
    isZonedEpochSlots(relativeToSlots) &&
    largestUnit >= Unit.Day &&
    smallestUnit < Unit.Day

  if (!slots.sign && !needsZonedDayLength) {
    return slots
  }

  if (!relativeToSlots) {
    throw new RangeError(errorMessages.missingRelativeTo)
  }

  const [marker, timeZoneImpl] = createRelativeOrigin(relativeToSlots)
  const markerToEpochNano = createMarkerToEpochNano(timeZoneImpl)
  const moveMarker = createMoveMarker(timeZoneImpl, relativeToSlots.calendarId)
  const diffMarkers = createDiffMarkers(timeZoneImpl, relativeToSlots.calendarId)

  const endMarker = moveMarker(marker, slots)

  // sanitize start/end markers
  // see DifferencePlainDateTimeWithRounding
  if (!isZonedEpochSlots(relativeToSlots)) {
    checkPlainMarkerInBounds(
      marker as CalendarDateFields | CalendarDateTimeFields,
    )
    checkPlainMarkerInBounds(
      endMarker as CalendarDateFields | CalendarDateTimeFields,
    )
  }

  let balancedDuration = diffMarkers(marker, endMarker, largestUnit)

  const origSign = slots.sign
  const balancedSign = computeDurationSign(balancedDuration)
  if (origSign && balancedSign && origSign !== balancedSign) {
    throw new RangeError(errorMessages.invalidProtocolResults)
  }

  balancedDuration = roundRelativeDuration(
    balancedDuration,
    markerToEpochNano(endMarker),
    largestUnit,
    smallestUnit,
    roundingInc,
    roundingMode,
    marker,
    markerToEpochNano,
    moveMarker,
  )

  return createDurationSlots(balancedDuration)
}

function checkPlainMarkerInBounds(
  marker: CalendarDateFields | CalendarDateTimeFields,
): void {
  checkIsoDateTimeInBounds(
    combineDateAndTime(marker, 'hour' in marker ? marker : timeFieldDefaults),
  )
}

// Sign / Abs / Blank
// -----------------------------------------------------------------------------

export function absDuration(slots: DurationSlots): DurationSlots {
  if (slots.sign === -1) {
    return negateDuration(slots)
  }
  return slots
}

export function negateDuration(slots: DurationSlots): DurationSlots {
  return createDurationSlots(negateDurationFields(slots))
}

export function negateDurationFields(fields: DurationFields): DurationFields {
  const res = {} as DurationFields

  for (const fieldName of durationFieldNamesAsc) {
    res[fieldName] = fields[fieldName] * -1 || 0
  }

  return res
}

export function getDurationBlank(slots: DurationSlots): boolean {
  return !slots.sign
}

export function computeDurationSign(
  fields: DurationFields,
  fieldNames = durationFieldNamesAsc,
): NumberSign {
  let sign: NumberSign = 0

  for (const fieldName of fieldNames) {
    const fieldSign = Math.sign(fields[fieldName]) as NumberSign

    if (fieldSign) {
      if (sign && sign !== fieldSign) {
        throw new RangeError(errorMessages.forbiddenDurationSigns)
      }
      sign = fieldSign
    }
  }

  return sign
}

export function checkDurationUnits(fields: DurationFields): DurationFields {
  for (const calendarUnit of durationCalendarFieldNamesAsc) {
    clampEntity(
      calendarUnit,
      fields[calendarUnit],
      -maxCalendarUnit,
      maxCalendarUnit,
      Overflow.Reject,
    )
  }

  const bigNano = durationFieldsToBigNano(fields)
  checkDurationTimeUnit(bigNanoToNumber(bigNano, nanoInSec))

  return fields
}

export function checkDurationTimeUnit(n: number): void {
  if (!Number.isSafeInteger(n)) {
    throw new RangeError(errorMessages.outOfBoundsDuration)
  }
}

// Field <-> Nanosecond Conversion
// -----------------------------------------------------------------------------

export function durationTimeFieldsToBigNanoStrict(
  fields: DurationFields,
): BigNano {
  if (durationHasDateParts(fields)) {
    throw new RangeError(errorMessages.invalidLargeUnits)
  }

  return durationFieldsToBigNano(fields, Unit.Hour)
}

export function durationFieldsToBigNano(
  fields: DurationFields,
  largestUnit: DayTimeUnit = Unit.Day,
): BigNano {
  return givenFieldsToBigNano(fields, largestUnit, durationFieldNamesAsc)
}

export function nanoToDurationDayTimeFields(
  largeNano: BigNano,
): { days: number } & DurationTimeFields
export function nanoToDurationDayTimeFields(
  largeNano: BigNano,
  largestUnit?: DayTimeUnit,
): Partial<DurationFields>
export function nanoToDurationDayTimeFields(
  bigNano: BigNano,
  largestUnit: DayTimeUnit = Unit.Day,
): Partial<DurationFields> {
  const [days, timeNano] = bigNano
  const dayTimeFields = nanoToGivenFields(
    timeNano,
    largestUnit,
    durationFieldNamesAsc,
  )

  dayTimeFields[durationFieldNamesAsc[largestUnit]]! +=
    days * (nanoInUtcDay / unitNanoMap[largestUnit])

  const largestUnitVal = dayTimeFields[durationFieldNamesAsc[largestUnit]]!

  // Duration fields are stored as float64 values. For second-and-smaller
  // largest units, validate the exact pre-rounded integer against the largest
  // field value whose Number conversion still stays below the 2^53-seconds
  // limit. This preserves large float64-representable microsecond diffs while
  // still rejecting out-of-range round() results.
  if (!Number.isFinite(largestUnitVal)) {
    throw new RangeError(errorMessages.outOfBoundsDate)
  }
  if (
    largestUnit <= Unit.Second &&
    absBigInt(truncBigNanoToBigInt(bigNano, unitNanoMap[largestUnit])) >
      maxTimeFieldByUnit[largestUnit as TimeUnit]
  ) {
    throw new RangeError(errorMessages.outOfBoundsDate)
  }

  return dayTimeFields
}

// TODO: audit
export function nanoToDurationTimeFields(nano: number): DurationTimeFields
export function nanoToDurationTimeFields(
  nano: number,
  largestUnit: TimeUnit,
): Partial<DurationTimeFields>
export function nanoToDurationTimeFields(
  nano: number,
  largestUnit: TimeUnit = Unit.Hour,
): Partial<DurationTimeFields> {
  return nanoToGivenFields(
    nano,
    largestUnit,
    durationFieldNamesAsc as (keyof DurationTimeFields)[],
  )
}

// Utils
// -----------------------------------------------------------------------------

export function durationHasDateParts(fields: DurationFields): boolean {
  return Boolean(computeDurationSign(fields, durationDateFieldNamesAsc))
}

export function getMaxDurationUnit(fields: DurationFields): Unit {
  let unit: Unit = Unit.Year

  for (; unit > Unit.Nanosecond; unit--) {
    if (fields[durationFieldNamesAsc[unit]]) {
      break
    }
  }

  return unit
}
