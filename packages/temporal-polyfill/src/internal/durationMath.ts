import { BigNano, addBigNanos, bigNanoToNumber } from './bigNano'
import { DiffOps } from './calendarOps'
import {
  DurationFields,
  DurationTimeFields,
  durationCalendarFieldNamesAsc,
  durationDateFieldNamesAsc,
  durationFieldDefaults,
  durationFieldNamesAsc,
} from './durationFields'
import * as errorMessages from './errorMessages'
import {
  RelativeToSlots,
  createDiffMarkers,
  createMarkerSystem,
  createMarkerToEpochNano,
  createMoveMarker,
  isUniformUnit,
  isZonedEpochSlots,
} from './markerSystem'
import { Overflow } from './options'
import {
  DurationRoundingOptions,
  RelativeToOptions,
  normalizeOptions,
  refineDurationRoundOptions,
} from './optionsRefine'
import { roundDayTimeDuration, roundRelativeDuration } from './round'
import { DurationSlots, createDurationSlots } from './slots'
import { TimeZoneOps } from './timeZoneOps'
import {
  DayTimeUnit,
  TimeUnit,
  Unit,
  givenFieldsToBigNano,
  nanoInSec,
  nanoInUtcDay,
  nanoToGivenFields,
  unitNanoMap,
} from './units'
import { NumberSign, clampEntity } from './utils'

const maxCalendarUnit = 2 ** 32 - 1 // inclusive

// Adding
// -----------------------------------------------------------------------------

export function addDurations<RA>(
  refineRelativeTo: (relativeToArg?: RA) => RelativeToSlots | undefined,
  getCalendarOps: (calendarId: string) => DiffOps,
  getTimeZoneOps: (timeZoneId: string) => TimeZoneOps,
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

  const [marker, calendarOps, timeZoneOps] = createMarkerSystem(
    getCalendarOps,
    getTimeZoneOps,
    relativeToSlots,
  )
  const moveMarker = createMoveMarker(timeZoneOps)
  const diffMarkers = createDiffMarkers(timeZoneOps)

  const midMarker = moveMarker(calendarOps, marker, slots)
  const endMarker = moveMarker(calendarOps, midMarker, otherSlots)
  const balancedDuration = diffMarkers(calendarOps, marker, endMarker, maxUnit)

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
  getCalendarOps: (calendarId: string) => DiffOps,
  getTimeZoneOps: (timeZoneId: string) => TimeZoneOps,
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

  // Don't do nanosecond-only rounding if ZDT because rounding hours/mins/etc
  // could balance-up to days, which could vary based on time zone
  if (!isZonedEpochSlots(relativeToSlots) && maxUnit <= Unit.Day) {
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

  if (!relativeToSlots) {
    throw new RangeError(errorMessages.missingRelativeTo)
  }

  const [marker, calendarOps, timeZoneOps] = createMarkerSystem(
    getCalendarOps,
    getTimeZoneOps,
    relativeToSlots,
  )
  const markerToEpochNano = createMarkerToEpochNano(timeZoneOps)
  const moveMarker = createMoveMarker(timeZoneOps)
  const diffMarkers = createDiffMarkers(timeZoneOps)

  const endMarker = moveMarker(calendarOps, marker, slots)
  let balancedDuration = diffMarkers(
    calendarOps,
    marker,
    endMarker,
    largestUnit,
  )

  const origSign = slots.sign
  const balancedSign = computeDurationSign(balancedDuration)
  if (origSign && balancedSign && origSign !== balancedSign) {
    throw new RangeError(errorMessages.invalidProtocolResults)
  }

  if (balancedSign) {
    balancedDuration = roundRelativeDuration(
      balancedDuration,
      markerToEpochNano(endMarker),
      largestUnit,
      smallestUnit,
      roundingInc,
      roundingMode,
      calendarOps,
      marker,
      markerToEpochNano,
      moveMarker,
    )
  }

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

  if (!Number.isFinite(dayTimeFields[durationFieldNamesAsc[largestUnit]]!)) {
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
