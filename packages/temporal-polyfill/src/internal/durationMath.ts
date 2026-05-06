import { bigNanoInSec, bigNanoInUtcDay } from './bigNano'
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
import { DurationRoundingOptions, RelativeToOptions } from './optionsModel'
import { normalizeOptions } from './optionsNormalize'
import { refineDurationRoundOptions } from './optionsRoundingRefine'
import {
  RelativeToSlots,
  checkMarkerSpanInBounds,
  createMarkerSpanOps,
  isUniformUnit,
  isZonedEpochSlots,
} from './relativeMath'
import { roundDayTimeDuration, roundRelativeDuration } from './round'
import { DurationSlots, createDurationSlots } from './slots'
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

function addDayTimeDurations(
  a: DurationFields,
  b: DurationFields,
  largestUnit: DayTimeUnit,
  doSubtract?: boolean,
): DurationFields {
  const bigNano0 = durationFieldsToBigNano(a)
  const bigNano1 = durationFieldsToBigNano(b)
  const combined = bigNano0 + bigNano1 * BigInt(doSubtract ? -1 : 1)

  if (!Number.isFinite(Number(combined / bigNanoInUtcDay))) {
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
    throw new RangeError(errorMessages.missingRelativeTo)
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

  const origSign = slots.sign
  const balancedSign = computeDurationSign(balancedDuration)
  if (origSign && balancedSign && origSign !== balancedSign) {
    throw new RangeError(errorMessages.invalidProtocolResults)
  }

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
  checkDurationTimeUnit(Number(bigNano / bigNanoInSec))

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
): bigint {
  if (durationHasDateParts(fields)) {
    throw new RangeError(errorMessages.invalidLargeUnits)
  }

  return durationFieldsToBigNano(fields, Unit.Hour)
}

export function durationFieldsToBigNano(
  fields: DurationFields,
  largestUnit: DayTimeUnit = Unit.Day,
): bigint {
  return givenFieldsToBigNano(fields, largestUnit, durationFieldNamesAsc)
}

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
  const dayTimeFields = nanoToGivenFields(
    timeNano,
    largestUnit,
    durationFieldNamesAsc,
  )

  if (largestUnit <= Unit.Second) {
    // For sub-minute largest units, the public largest field can be far larger
    // than Number.MAX_SAFE_INTEGER, so convert from the full bigint tuple
    // instead of adding a day contribution to an already-decomposed field.
    dayTimeFields[durationFieldNamesAsc[largestUnit]] = Number(
      bigNano / BigInt(unitNanoMap[largestUnit]),
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
