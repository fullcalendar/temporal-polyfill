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
  DiffMarkers,
  Marker,
  MarkerToEpochNano,
  MoveMarker,
  RelativeToSlots,
  createDiffMarkers,
  createMarkerSystem,
  createMarkerToEpochNano,
  createMoveMarker,
  isUniformUnit,
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

/*
Rebalances duration(s)
*/
export function spanDuration(
  durationFields: DurationFields,
  largestUnit: Unit, // TODO: more descrimination?
  marker: Marker,
  markerToEpochNano: MarkerToEpochNano,
  moveMarker: MoveMarker,
  diffMarkers: DiffMarkers,
): [DurationFields, BigNano] {
  const endMarker = moveMarker(marker, durationFields)
  const balancedDuration = diffMarkers(marker, endMarker, largestUnit)
  return [balancedDuration, markerToEpochNano(endMarker)]
}

// Adding
// -----------------------------------------------------------------------------

export function addDurations<RA, C, T>(
  refineRelativeTo: (relativeToArg?: RA) => RelativeToSlots<C, T> | undefined,
  getCalendarOps: (calendarSlot: C) => DiffOps,
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  doSubtract: boolean,
  slots: DurationSlots,
  otherSlots: DurationSlots,
  options?: RelativeToOptions<RA>,
): DurationSlots {
  const normalOptions = normalizeOptions(options)
  const relativeToSlots = refineRelativeTo(normalOptions.relativeTo)
  const maxUnit = Math.max(
    getLargestDurationUnit(slots),
    getLargestDurationUnit(otherSlots),
  ) as Unit

  if (isUniformUnit(maxUnit, relativeToSlots)) {
    return createDurationSlots(
      checkDurationUnits(
        addDayTimeDurations(
          slots,
          otherSlots,
          maxUnit as DayTimeUnit,
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
  const moveMarker = createMoveMarker(calendarOps, timeZoneOps)
  const diffMarkers = createDiffMarkers(calendarOps, timeZoneOps)

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

export function roundDuration<RA, C, T>(
  refineRelativeTo: (relativeToArg?: RA) => RelativeToSlots<C, T> | undefined,
  getCalendarOps: (calendarSlot: C) => DiffOps,
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  slots: DurationSlots,
  options: DurationRoundingOptions<RA>,
): DurationSlots {
  const durationLargestUnit = getLargestDurationUnit(slots)
  const [
    largestUnit,
    smallestUnit,
    roundingInc,
    roundingMode,
    relativeToSlots,
  ] = refineDurationRoundOptions(options, durationLargestUnit, refineRelativeTo)

  const maxUnit = Math.max(durationLargestUnit, largestUnit)

  if (isUniformUnit(maxUnit, relativeToSlots)) {
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
  const moveMarker = createMoveMarker(calendarOps, timeZoneOps)
  const diffMarkers = createDiffMarkers(calendarOps, timeZoneOps)

  let transplantedWeeks = 0
  if (slots.weeks && smallestUnit === Unit.Week) {
    transplantedWeeks = slots.weeks
    slots = { ...slots, weeks: 0 }
  }

  let [balancedDuration, endEpochNano] = spanDuration(
    slots,
    largestUnit,
    marker,
    markerToEpochNano,
    moveMarker,
    diffMarkers,
  )

  const origSign = slots.sign
  const balancedSign = computeDurationSign(balancedDuration)
  if (origSign && balancedSign && origSign !== balancedSign) {
    throw new RangeError(errorMessages.invalidProtocolResults)
  }

  if (balancedSign) {
    balancedDuration = roundRelativeDuration(
      balancedDuration,
      endEpochNano,
      largestUnit,
      smallestUnit,
      roundingInc,
      roundingMode,
      marker,
      markerToEpochNano,
      moveMarker,
    )
  }

  balancedDuration.weeks += transplantedWeeks // HACK (mutating)

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

export function getLargestDurationUnit(fields: DurationFields): Unit {
  let unit: Unit = Unit.Year

  for (; unit > Unit.Nanosecond; unit--) {
    if (fields[durationFieldNamesAsc[unit]]) {
      break
    }
  }

  return unit
}
