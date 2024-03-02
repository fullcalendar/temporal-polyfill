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
  createMarkerDiffSystem,
} from './markerSystem'
import { Overflow } from './options'
import {
  DurationRoundOptions,
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
  durationFields0: DurationFields,
  durationFields1: DurationFields | undefined, // HACKy
  largestUnit: Unit, // TODO: more descrimination?
  // MarkerDiffSystem...
  marker: Marker,
  markerToEpochNano: MarkerToEpochNano,
  moveMarker: MoveMarker,
  diffMarkers: DiffMarkers,
): [DurationFields, BigNano] {
  let endMarker = moveMarker(marker, durationFields0)

  if (durationFields1) {
    endMarker = moveMarker(endMarker, durationFields1)
  }

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
  const largestUnit = Math.max(
    getLargestDurationUnit(slots),
    getLargestDurationUnit(otherSlots),
  ) as Unit

  if (
    largestUnit < Unit.Day ||
    (largestUnit === Unit.Day &&
      // has uniform days?
      !(relativeToSlots && (relativeToSlots as any).epochNanoseconds))
  ) {
    return createDurationSlots(
      checkDurationUnits(
        addDayTimeDurations(
          slots,
          otherSlots,
          largestUnit as DayTimeUnit,
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

  return createDurationSlots(
    spanDuration(
      slots,
      otherSlots,
      largestUnit,
      ...createMarkerDiffSystem(
        getCalendarOps,
        getTimeZoneOps,
        relativeToSlots,
      ),
    )[0],
  )
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
  options: DurationRoundOptions<RA>,
): DurationSlots {
  const durationLargestUnit = getLargestDurationUnit(slots)
  const [
    largestUnit,
    smallestUnit,
    roundingInc,
    roundingMode,
    relativeToSlots,
  ] = refineDurationRoundOptions(options, durationLargestUnit, refineRelativeTo)

  const maxLargestUnit = Math.max(durationLargestUnit, largestUnit)

  if (
    maxLargestUnit < Unit.Day ||
    (maxLargestUnit === Unit.Day &&
      // has uniform days?
      !(relativeToSlots && (relativeToSlots as any).epochNanoseconds))
  ) {
    return createDurationSlots(
      checkDurationUnits(
        roundDayTimeDuration(
          slots,
          largestUnit as DayTimeUnit, // guaranteed <= maxLargestUnit <= Unit.Day
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

  const diffSystem = createMarkerDiffSystem(
    getCalendarOps,
    getTimeZoneOps,
    relativeToSlots,
  )

  let transplantedWeeks = 0
  if (slots.weeks && smallestUnit === Unit.Week) {
    transplantedWeeks = slots.weeks
    slots = { ...slots, weeks: 0 }
  }

  let [balancedDuration, endEpochNano] = spanDuration(
    slots,
    undefined,
    largestUnit,
    ...diffSystem,
  )

  const origSign = slots.sign
  const balancedSign = computeDurationSign(balancedDuration)
  if (origSign && balancedSign && origSign !== balancedSign) {
    throw new RangeError(errorMessages.invalidProtocolResults)
  }

  if (
    balancedSign &&
    !(smallestUnit === Unit.Nanosecond && roundingInc === 1)
  ) {
    balancedDuration = roundRelativeDuration(
      balancedDuration,
      endEpochNano,
      largestUnit,
      smallestUnit,
      roundingInc,
      roundingMode,
      ...diffSystem,
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

export function durationTimeFieldsToLargeNanoStrict(
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

/*
Returns all units
*/
export function clearDurationFields(
  durationFields: DurationFields,
  largestUnitToClear: Unit,
): DurationFields {
  const copy = { ...durationFields }

  for (let unit: Unit = Unit.Nanosecond; unit <= largestUnitToClear; unit++) {
    copy[durationFieldNamesAsc[unit]] = 0
  }

  return copy
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
