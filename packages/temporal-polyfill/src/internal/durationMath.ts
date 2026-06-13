import type { Temporal } from 'temporal-spec'
import {
  bigNanoInHour,
  bigNanoInMicro,
  bigNanoInMilli,
  bigNanoInMinute,
  bigNanoInSec,
  bigNanoInUtcDay,
} from './bigNano'
import {
  DurationFields,
  DurationTimeFields,
  durationCalendarFieldNamesAsc,
  durationDateFieldNamesAsc,
  durationFieldDefaults,
  durationFieldNamesAsc,
} from './durationFields'
import * as errorMessages from './errorMessages'
import { Overflow } from './optionsModel'
import { getOptionsObject } from './optionsNormalize'
import { refineDurationRoundOptions } from './optionsRoundingRefine'
import {
  RelativeToSlots,
  checkMarkerSpanInBounds,
  createMarkerSpanOps,
  isUniformUnit,
  isZonedEpochSlots,
} from './relativeMath'
import { roundDayTimeDuration, roundRelativeDuration } from './round'
import { createDurationSlots } from './slots'
import type {
  DurationRoundingOptions,
  RelativeToOptions,
} from './temporalSpecHelpers'
import { nanoToGivenFields } from './unitMath'
import {
  DayTimeUnit,
  TimeUnit,
  Unit,
  nanoInSec,
  nanoInUtcDay,
  unitNanoMap,
} from './units'
import { NumberSign, clampEntity, divTrunc, throwRangeError } from './utils'

const maxCalendarUnit = 2 ** 32 - 1 // inclusive
const maxDurationSeconds = 2 ** 53

// Adding
// -----------------------------------------------------------------------------

export function addDurations<RA>(
  refineRelativeTo: (relativeToArg?: RA) => RelativeToSlots | undefined,
  doSubtract: boolean,
  slots: DurationFields,
  otherSlots: DurationFields,
  options?: RelativeToOptions<RA>,
): DurationFields & { sign: NumberSign } {
  const normalOptions = getOptionsObject(options)
  const relativeToSlots = refineRelativeTo(normalOptions.relativeTo)
  const maxUnit = Math.max(
    getMaxDurationUnit(slots),
    getMaxDurationUnit(otherSlots),
  ) as Unit

  if (isUniformUnit(maxUnit, relativeToSlots)) {
    return addDayTimeDurationsChecked(
      doSubtract,
      slots,
      otherSlots,
      maxUnit as DayTimeUnit,
    )
  }

  if (!relativeToSlots) {
    throwRangeError(errorMessages.missingRelativeTo)
  }

  if (doSubtract) {
    otherSlots = negateDurationFields(otherSlots) as any // !!!
  }

  const markerSpanOps = createMarkerSpanOps(relativeToSlots)
  const midMarker = markerSpanOps.moveMarker(markerSpanOps.marker, slots)
  const endMarker = markerSpanOps.moveMarker(midMarker, otherSlots)
  const balancedDuration = markerSpanOps.diffMarkers(
    markerSpanOps.marker,
    endMarker,
    maxUnit,
  )

  return createDurationSlots(balancedDuration)
}

export function addDurationsWithoutRelativeTo(
  doSubtract: boolean,
  slots: DurationFields,
  otherSlots: DurationFields,
): DurationFields & { sign: NumberSign } {
  const maxUnit = Math.max(
    getMaxDurationUnit(slots),
    getMaxDurationUnit(otherSlots),
  ) as Unit

  if (maxUnit > Unit.Day) {
    throwRangeError(errorMessages.invalidLargeUnits)
  }

  return addDayTimeDurationsChecked(
    doSubtract,
    slots,
    otherSlots,
    maxUnit as DayTimeUnit,
  )
}

function addDayTimeDurationsChecked(
  doSubtract: boolean,
  slots: DurationFields,
  otherSlots: DurationFields,
  maxUnit: DayTimeUnit,
): DurationFields & { sign: NumberSign } {
  // With no relativeTo, only day-and-smaller units have fixed lengths.
  // Calendar units have to stay on the relative path so months, years, and
  // calendar-dependent weeks cannot silently collapse into fixed nanoseconds.
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

function addDayTimeDurations(
  a: DurationFields,
  b: DurationFields,
  largestUnit: DayTimeUnit,
  doSubtract?: boolean,
): DurationFields {
  const bigNano0 = durationDayTimeToBigNano(a)
  const bigNano1 = durationDayTimeToBigNano(b)
  const combined = bigNano0 + bigNano1 * BigInt(doSubtract ? -1 : 1)

  if (!Number.isFinite(Number(combined / bigNanoInUtcDay))) {
    throwRangeError(errorMessages.outOfBoundsDate)
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
  slots: DurationFields & { sign: NumberSign }, // could get returned :(
  options:
    | DurationRoundingOptions<RA>
    | Temporal.PluralizeUnit<'day' | Temporal.TimeUnit>,
): DurationFields & { sign: NumberSign } {
  const durationLargestUnit = getMaxDurationUnit(slots)
  const [
    largestUnit,
    smallestUnit,
    roundingInc,
    roundingMode,
    relativeToSlots,
  ] = refineDurationRoundOptions(options, durationLargestUnit, refineRelativeTo)

  const maxUnit = Math.max(durationLargestUnit, largestUnit)

  // Without a relativeTo, day-and-smaller durations can round as fixed 24-hour
  // math. Any supplied relativeTo must stay observable, especially for zoned
  // day lengths.
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
    throwRangeError(errorMessages.missingRelativeTo)
  }

  const markerSpanOps = createMarkerSpanOps(relativeToSlots)
  const endMarker = markerSpanOps.moveMarker(markerSpanOps.marker, slots)

  // sanitize start/end markers
  // see DifferencePlainDateTimeWithRounding
  checkMarkerSpanInBounds(markerSpanOps, endMarker)

  let balancedDuration = markerSpanOps.diffMarkers(
    markerSpanOps.marker,
    endMarker,
    largestUnit,
  )

  balancedDuration = roundRelativeDuration(
    balancedDuration,
    markerSpanOps.markerToEpochNano(endMarker),
    largestUnit,
    smallestUnit,
    roundingInc,
    roundingMode,
    markerSpanOps,
  )

  return createDurationSlots(balancedDuration)
}

// Sign / Abs / Blank
// -----------------------------------------------------------------------------

export function absDuration(
  slots: DurationFields & { sign: NumberSign }, // could get returned :(
): DurationFields & { sign: NumberSign } {
  if (slots.sign === -1) {
    return negateDuration(slots)
  }
  return slots
}

export function negateDuration(
  slots: DurationFields,
): DurationFields & { sign: NumberSign } {
  return createDurationSlots(negateDurationFields(slots))
}

export function negateDurationFields(fields: DurationFields): DurationFields {
  const res = {} as DurationFields

  for (const fieldName of durationFieldNamesAsc) {
    res[fieldName] = fields[fieldName] * -1 || 0
  }

  return res
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
        throwRangeError(errorMessages.forbiddenDurationSigns)
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

  const bigNano = durationDayTimeToBigNano(fields)
  checkDurationTimeUnit(Number(bigNano / bigNanoInSec))

  return fields
}

export function checkDurationTimeUnit(n: number): void {
  if (!Number.isSafeInteger(n)) {
    throwRangeError(errorMessages.outOfBoundsDuration)
  }
}

// Field -> Nanosecond Conversions
// -----------------------------------------------------------------------------

export function durationOnlyTimeToBigNano(fields: DurationFields): bigint {
  if (durationHasDateParts(fields)) {
    throwRangeError(errorMessages.invalidLargeUnits)
  }

  return durationTimeToBigNano(fields)
}

export function durationDayTimeToBigNano(fields: DurationFields): bigint {
  return BigInt(fields.days) * bigNanoInUtcDay + durationTimeToBigNano(fields)
}

export function durationTimeToBigNano(fields: DurationFields): bigint {
  return (
    BigInt(fields.hours) * bigNanoInHour +
    BigInt(fields.minutes) * bigNanoInMinute +
    durationSubMinuteToBigNano(fields)
  )
}

export function durationSubMinuteToBigNano(fields: DurationFields): bigint {
  return (
    BigInt(fields.seconds) * bigNanoInSec +
    BigInt(fields.milliseconds) * bigNanoInMilli +
    BigInt(fields.microseconds) * bigNanoInMicro +
    BigInt(fields.nanoseconds)
  )
}

// Nanosecond -> Field Conversions
// -----------------------------------------------------------------------------

export function nanoToDurationDayTimeFields(
  largeNano: bigint,
): { days: number } & DurationTimeFields
export function nanoToDurationDayTimeFields(
  largeNano: bigint,
  largestUnit?: DayTimeUnit,
): Partial<DurationFields>
export function nanoToDurationDayTimeFields(
  bigNano: bigint,
  largestUnit: DayTimeUnit = Unit.Day,
): Partial<DurationFields> {
  const days = Number(bigNano / bigNanoInUtcDay)
  const timeNano = Number(bigNano % bigNanoInUtcDay)
  const unitNano = unitNanoMap[largestUnit]
  const largestUnitVal =
    largestUnit <= Unit.Second
      ? Number(bigNano / BigInt(unitNano))
      : days * (nanoInUtcDay / unitNano) + divTrunc(timeNano, unitNano)

  // Duration fields are stored as float64 values. The conversion above may
  // produce an unsafe-but-finite integer Number for millisecond/microsecond/
  // nanosecond largest units, which is allowed. What is not allowed is a
  // returned largest field whose Number value has rounded up to the 2^53-second
  // boundary.
  if (!Number.isFinite(largestUnitVal)) {
    throwRangeError(errorMessages.outOfBoundsDate)
  }

  if (
    largestUnit <= Unit.Second &&
    Math.abs(largestUnitVal) / (nanoInSec / unitNanoMap[largestUnit]) >=
      maxDurationSeconds
  ) {
    throwRangeError(errorMessages.outOfBoundsDate)
  }

  const dayTimeFields = nanoToGivenFields(
    timeNano,
    largestUnit,
    durationFieldNamesAsc,
  )
  dayTimeFields[durationFieldNamesAsc[largestUnit]] = largestUnitVal

  return dayTimeFields
}

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
