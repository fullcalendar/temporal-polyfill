import { DiffOps } from './calendarOps'
import {
  DayTimeNano,
  addDayTimeNanos,
  dayTimeNanoToNumber,
} from './dayTimeNano'
import { diffDateTimesExact, diffZonedEpochNanoExact } from './diff'
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
  IsoDateFields,
  IsoDateTimeFields,
  isoTimeFieldDefaults,
} from './isoFields'
import { moveDateTime, moveZonedEpochNano } from './move'
import { Overflow } from './options'
import {
  DurationRoundOptions,
  RelativeToOptions,
  normalizeOptions,
  refineDurationRoundOptions,
} from './optionsRefine'
import { roundDayTimeDuration, roundRelativeDuration } from './round'
import { DurationSlots, createDurationSlots } from './slots'
import { isoToEpochNano } from './timeMath'
import { TimeZoneOps } from './timeZoneOps'
import {
  DayTimeUnit,
  TimeUnit,
  Unit,
  givenFieldsToDayTimeNano,
  nanoInSec,
  nanoInUtcDay,
  nanoToGivenFields,
  unitNanoMap,
} from './units'
import { NumberSign, bindArgs, clampEntity, identity } from './utils'

const maxCalendarUnit = 2 ** 32 - 1 // inclusive

// Marker System
// -----------------------------------------------------------------------------

export type MarkerSlotsNoCalendar<T> =
  | {
      epochNanoseconds: DayTimeNano
      timeZone: T
    }
  | IsoDateTimeFields

export type MarkerSlots<C, T> =
  | { epochNanoseconds: DayTimeNano; timeZone: T; calendar: C }
  | (IsoDateFields & { calendar: C })

export type MarkerToEpochNano<M> = (marker: M) => DayTimeNano
export type MoveMarker<M> = (marker: M, durationFields: DurationFields) => M
export type DiffMarkers<M> = (
  marker0: M,
  marker1: M,
  largeUnit: Unit,
) => DurationFields
export type MarkerSystem<M> = [
  M,
  MarkerToEpochNano<M>,
  MoveMarker<M>,
  DiffMarkers<M>,
]

export function createMarkerSystem<C, T>(
  getCalendarOps: (calendarSlot: C) => DiffOps,
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  markerSlots: MarkerSlots<C, T>,
): MarkerSystem<DayTimeNano> | MarkerSystem<IsoDateTimeFields> {
  const { calendar, timeZone, epochNanoseconds } = markerSlots as {
    calendar: C
    timeZone?: T
    epochNanoseconds?: DayTimeNano
  }

  const calendarOps = getCalendarOps(calendar)

  if (epochNanoseconds) {
    const timeZoneOps = getTimeZoneOps(timeZone!)

    return [
      epochNanoseconds,
      identity as MarkerToEpochNano<DayTimeNano>,
      bindArgs(moveZonedEpochNano, calendarOps, timeZoneOps),
      bindArgs(diffZonedEpochNanoExact, calendarOps, timeZoneOps),
    ]
  }

  return [
    { ...markerSlots, ...isoTimeFieldDefaults } as IsoDateTimeFields,
    isoToEpochNano as MarkerToEpochNano<IsoDateTimeFields>,
    bindArgs(moveDateTime, calendarOps),
    bindArgs(diffDateTimesExact, calendarOps),
  ]
}

/*
Rebalances duration(s)
*/
export function spanDuration<M>(
  durationFields0: DurationFields,
  durationFields1: DurationFields | undefined, // HACKy
  largestUnit: Unit, // TODO: more descrimination?
  // marker system...
  marker: M,
  markerToEpochNano: MarkerToEpochNano<M>,
  moveMarker: MoveMarker<M>,
  diffMarkers: DiffMarkers<M>,
): [DurationFields, DayTimeNano] {
  let endMarker = moveMarker(marker, durationFields0)

  // better way to do this?
  if (durationFields1) {
    endMarker = moveMarker(endMarker, durationFields1)
  }

  const balancedDuration = diffMarkers(marker, endMarker, largestUnit)

  return [balancedDuration, markerToEpochNano(endMarker)]
}

// Adding
// -----------------------------------------------------------------------------

export function addDurations<RA, C, T>(
  refineRelativeTo: (relativeToArg?: RA) => MarkerSlots<C, T> | undefined,
  getCalendarOps: (calendarSlot: C) => DiffOps,
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  doSubtract: boolean,
  slots: DurationSlots,
  otherSlots: DurationSlots,
  options?: RelativeToOptions<RA>,
): DurationSlots {
  const normalOptions = normalizeOptions(options)
  const markerSlots = refineRelativeTo(normalOptions.relativeTo)
  const largestUnit = Math.max(
    getLargestDurationUnit(slots),
    getLargestDurationUnit(otherSlots),
  ) as Unit

  if (
    largestUnit < Unit.Day ||
    (largestUnit === Unit.Day &&
      // has uniform days?
      !(markerSlots && (markerSlots as any).epochNanoseconds))
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

  if (!markerSlots) {
    throw new RangeError(errorMessages.missingRelativeTo)
  }

  if (doSubtract) {
    otherSlots = negateDurationFields(otherSlots) as any // !!!
  }

  const markerSystem = createMarkerSystem(
    getCalendarOps,
    getTimeZoneOps,
    markerSlots,
  ) as MarkerSystem<any>

  return createDurationSlots(
    spanDuration(slots, otherSlots, largestUnit, ...markerSystem)[0],
  )
}

function addDayTimeDurations(
  a: DurationFields,
  b: DurationFields,
  largestUnit: DayTimeUnit,
  doSubtract?: boolean,
): DurationFields {
  const dayTimeNano0 = durationFieldsToDayTimeNano(a, Unit.Day)
  const dayTimeNano1 = durationFieldsToDayTimeNano(b, Unit.Day)
  const combined = addDayTimeNanos(
    dayTimeNano0,
    dayTimeNano1,
    doSubtract ? -1 : 1,
  )

  if (!Number.isFinite(combined[0])) {
    throw new RangeError(errorMessages.outOfBoundsDate)
  }

  return {
    ...durationFieldDefaults,
    ...nanoToDurationDayTimeFields(combined, largestUnit),
  }
}

// Rounding (with marker system)
// -----------------------------------------------------------------------------

export function roundDuration<RA, C, T>(
  refineRelativeTo: (relativeToArg?: RA) => MarkerSlots<C, T> | undefined,
  getCalendarOps: (calendarSlot: C) => DiffOps,
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  slots: DurationSlots,
  options: DurationRoundOptions<RA>,
): DurationSlots {
  const durationLargestUnit = getLargestDurationUnit(slots)
  const [largestUnit, smallestUnit, roundingInc, roundingMode, markerSlots] =
    refineDurationRoundOptions(options, durationLargestUnit, refineRelativeTo)

  const maxLargestUnit = Math.max(durationLargestUnit, largestUnit)

  if (
    maxLargestUnit < Unit.Day ||
    (maxLargestUnit === Unit.Day &&
      // has uniform days?
      !(markerSlots && (markerSlots as any).epochNanoseconds))
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

  if (!markerSlots) {
    throw new RangeError(errorMessages.missingRelativeTo)
  }

  const markerSystem = createMarkerSystem(
    getCalendarOps,
    getTimeZoneOps,
    markerSlots,
  ) as MarkerSystem<any>

  let transplantedWeeks = 0
  if (slots.weeks && smallestUnit === Unit.Week) {
    transplantedWeeks = slots.weeks
    slots = { ...slots, weeks: 0 }
  }

  let [balancedDuration, endEpochNano] = spanDuration(
    slots,
    undefined,
    largestUnit,
    ...markerSystem,
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
      ...markerSystem,
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

  const dayTimeNano = durationFieldsToDayTimeNano(fields, Unit.Day)
  checkDurationTimeUnit(dayTimeNanoToNumber(dayTimeNano, nanoInSec))

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
): DayTimeNano {
  if (durationHasDateParts(fields)) {
    throw new RangeError(errorMessages.invalidLargeUnits)
  }

  return durationFieldsToDayTimeNano(fields, Unit.Hour)
}

export function durationFieldsToDayTimeNano(
  fields: DurationFields,
  largestUnit: DayTimeUnit,
): DayTimeNano {
  return givenFieldsToDayTimeNano(fields, largestUnit, durationFieldNamesAsc)
}

export function nanoToDurationDayTimeFields(
  largeNano: DayTimeNano,
): { days: number } & DurationTimeFields
export function nanoToDurationDayTimeFields(
  largeNano: DayTimeNano,
  largestUnit?: DayTimeUnit,
): Partial<DurationFields>
export function nanoToDurationDayTimeFields(
  dayTimeNano: DayTimeNano,
  largestUnit: DayTimeUnit = Unit.Day,
): Partial<DurationFields> {
  const [days, timeNano] = dayTimeNano
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
