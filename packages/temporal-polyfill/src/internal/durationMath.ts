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

// For second-and-smaller units, units-per-day has a useful decimal shape:
//
//   seconds/day      = 864 * 10^2
//   milliseconds/day = 864 * 10^5
//   microseconds/day = 864 * 10^8
//   nanoseconds/day  = 864 * 10^11
//
// That lets us convert a BigNano's day bucket into a huge unit field without
// first doing a lossy multiplication like `days * 86_400_000_000_000`.
const dayTimeFieldDecimalShiftByUnit = [
  11, // nanosecond
  8, // microsecond
  5, // millisecond
  2, // second
]

function bigNanoToLargeTimeField(bigNano: BigNano, unit: TimeUnit): number {
  const [days, timeNano] = bigNano
  const sign = Math.sign(days || timeNano)

  if (!sign) {
    return 0
  }

  const unitNano = unitNanoMap[unit]
  const decimalShift = dayTimeFieldDecimalShiftByUnit[unit]
  const decimalBase = 10 ** decimalShift

  // BigNano stores the day-sized part separately from the within-day remainder.
  // Work with absolute values so truncation below behaves the same for positive
  // and negative durations, then reapply the sign at the end.
  const absDays = Math.abs(days)
  const absTimeNano = Math.abs(timeNano)

  // Convert the within-day nanoseconds into the requested unit. This value is
  // bounded by one day, so ordinary number arithmetic is still precise enough.
  const timeUnits = Math.trunc(absTimeNano / unitNano)

  // Instead of computing:
  //
  //   absDays * (864 * 10^decimalShift) + timeUnits
  //
  // split it at the decimal boundary. `absDays * 864` stays small enough to be
  // a safe integer for any valid Temporal duration, and `timeUnits` supplies
  // the trailing decimalShift digits plus any carry into the high part.
  const high = absDays * 864 + Math.trunc(timeUnits / decimalBase)
  const low = timeUnits % decimalBase

  // Let Number's string parser perform the one unavoidable float64 rounding
  // step from the exact decimal integer to the public Duration field value.
  return sign * Number(String(high) + String(low).padStart(decimalShift, '0'))
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
  const diffMarkers = createDiffMarkers(
    timeZoneImpl,
    relativeToSlots.calendarId,
  )

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
  const diffMarkers = createDiffMarkers(
    timeZoneImpl,
    relativeToSlots.calendarId,
  )

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

  if (largestUnit <= Unit.Second) {
    // For sub-minute largest units, the public largest field can be far larger
    // than Number.MAX_SAFE_INTEGER. Compute that field from the full BigNano
    // tuple in one place so we do not lose precision by adding a huge day
    // contribution to the small within-day remainder.
    dayTimeFields[durationFieldNamesAsc[largestUnit]] = bigNanoToLargeTimeField(
      bigNano,
      largestUnit as TimeUnit,
    )
  } else {
    // Hour/minute/day outputs stay well within safe integer arithmetic for the
    // valid duration range, so the simple day contribution is sufficient here.
    dayTimeFields[durationFieldNamesAsc[largestUnit]]! +=
      days * (nanoInUtcDay / unitNanoMap[largestUnit])
  }

  const largestUnitVal = dayTimeFields[durationFieldNamesAsc[largestUnit]]!

  // Duration fields are stored as float64 values. The conversion above may
  // produce an unsafe-but-finite integer Number for millisecond/microsecond/
  // nanosecond largest units, which is allowed. What is not allowed is a
  // returned largest field whose Number value has rounded up to the 2^53-second
  // boundary.
  if (!Number.isFinite(largestUnitVal)) {
    throw new RangeError(errorMessages.outOfBoundsDate)
  }
  if (
    largestUnit <= Unit.Second &&
    Math.abs(largestUnitVal) / (nanoInSec / unitNanoMap[largestUnit]) >=
      maxDurationSeconds
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
