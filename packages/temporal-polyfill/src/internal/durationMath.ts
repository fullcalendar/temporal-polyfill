import { DayTimeNano, addDayTimeNanos } from './dayTimeNano'
import { DayTimeUnit, TimeUnit, Unit, givenFieldsToDayTimeNano, nanoInUtcDay, nanoToGivenFields, unitNanoMap } from './units'
import { NumSign, bindArgs, createLazyGenerator, identityFunc } from './utils'
import { DurationFields, durationFieldDefaults, durationFieldNamesAsc, durationDateFieldNamesAsc, DurationTimeFields } from './durationFields'
import { DiffOps } from './calendarOps'
import { TimeZoneOps } from './timeZoneOps'
import { DurationBranding, DurationSlots, createDurationSlots } from './slots'
import { DurationRoundOptions, RelativeToOptions, normalizeOptions, refineDurationRoundOptions } from './optionsRefine'
import { moveDateTime, moveZonedEpochNano } from './move'
import { IsoDateFields, IsoDateTimeFields, isoTimeFieldDefaults } from './calendarIsoFields'
import { diffDateTimesExact, diffZonedEpochNanoExact } from './diff'
import { isoToEpochNano } from './epochAndTime'
import { roundDayTimeDuration, roundRelativeDuration } from './round'

// Marker System
// -------------------------------------------------------------------------------------------------

export type MarkerSlotsNoCalendar<T> = {
  epochNanoseconds: DayTimeNano,
  timeZone: T,
} | IsoDateTimeFields

export type MarkerSlots<C, T> =
  { epochNanoseconds: DayTimeNano, timeZone: T, calendar: C } |
  (IsoDateFields & { calendar: C })

export type MarkerToEpochNano<M> = (marker: M) => DayTimeNano
export type MoveMarker<M> = (marker: M, durationFields: DurationFields) => M
export type DiffMarkers<M> = (marker0: M, marker1: M, largeUnit: Unit) => DurationFields
export type MarkerSystem<M> = [
  M,
  MarkerToEpochNano<M>,
  MoveMarker<M>,
  DiffMarkers<M>
]

export function createMarkerSystem<C, T>(
  getCalendarOps: (calendarSlot: C) => DiffOps,
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  markerSlots: MarkerSlots<C, T>,
): MarkerSystem<DayTimeNano> | MarkerSystem<IsoDateTimeFields> {
  const { calendar, timeZone, epochNanoseconds } = markerSlots as
    { calendar: C, timeZone?: T, epochNanoseconds?: DayTimeNano }

  const calendarOps = getCalendarOps(calendar)

  if (epochNanoseconds) {
    const timeZoneOps = getTimeZoneOps(timeZone!)

    return [
      epochNanoseconds,
      identityFunc as MarkerToEpochNano<DayTimeNano>,
      bindArgs(moveZonedEpochNano, calendarOps, timeZoneOps),
      bindArgs(diffZonedEpochNanoExact, calendarOps, timeZoneOps),
    ]
  } else {
    return [
      { ...markerSlots, ...isoTimeFieldDefaults } as IsoDateTimeFields,
      isoToEpochNano as MarkerToEpochNano<IsoDateTimeFields>,
      bindArgs(moveDateTime, calendarOps),
      bindArgs(diffDateTimesExact, calendarOps),
    ]
  }
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
): [
  DurationFields,
  DayTimeNano,
] {
  let endMarker = moveMarker(marker, durationFields0)

  // better way to do this???
  if (durationFields1) {
    endMarker = moveMarker(endMarker, durationFields1)
  }

  let balancedDuration = diffMarkers(marker, endMarker, largestUnit)

  return [
    balancedDuration,
    markerToEpochNano(endMarker),
  ]
}

// Adding
// -------------------------------------------------------------------------------------------------

export function addDurations<RA, C, T>(
  refineRelativeTo: (relativeToArg: RA) => MarkerSlots<C, T> | undefined,
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
    largestUnit < Unit.Day || (
      largestUnit === Unit.Day &&
      // has uniform days?
      !(markerSlots && (markerSlots as any).epochNanoseconds)
    )
  ) {
    return createDurationSlots(
      addDayTimeDurations(doSubtract, slots, otherSlots, largestUnit as DayTimeUnit),
    )
  }

  if (!markerSlots) {
    throw new RangeError('relativeTo is required for years, months, or weeks arithmetic')
  }

  if (doSubtract) {
    otherSlots = negateDurationFields(otherSlots) as any // !!!
  }

  const markerSystem = createMarkerSystem(getCalendarOps, getTimeZoneOps, markerSlots) as
    MarkerSystem<any>

  return createDurationSlots(
    spanDuration(
      slots,
      otherSlots,
      largestUnit,
      ...markerSystem,
    )[0]
  )
}

function addDayTimeDurations(
  doSubtract: boolean,
  a: DurationFields,
  b: DurationFields,
  largestUnit: DayTimeUnit
): DurationFields {
  const dayTimeNano0 = durationFieldsToDayTimeNano(a, Unit.Day)
  const dayTimeNano1 = durationFieldsToDayTimeNano(b, Unit.Day)
  const combined = addDayTimeNanos(dayTimeNano0, dayTimeNano1, doSubtract ? -1 : 1)

  if (!Number.isFinite(combined[0])) {
    throw new RangeError('Too much')
  }

  return {
    ...durationFieldDefaults,
    ...nanoToDurationDayTimeFields(combined, largestUnit)
  }
}

// Rounding
// -------------------------------------------------------------------------------------------------

export function roundDuration<RA, C, T>(
  refineRelativeTo: (relativeToArg: RA) => MarkerSlots<C, T> | undefined,
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
    markerSlots,
  ] = refineDurationRoundOptions(options, durationLargestUnit, refineRelativeTo)

  const maxLargestUnit = Math.max(durationLargestUnit, largestUnit)

  if (
    maxLargestUnit < Unit.Day || (
      maxLargestUnit === Unit.Day &&
      // has uniform days?
      !(markerSlots && (markerSlots as any).epochNanoseconds)
    )
  ) {
    return createDurationSlots(
      roundDayTimeDuration(
        slots,
        largestUnit as DayTimeUnit, // guaranteed <= maxLargestUnit <= Unit.Day
        smallestUnit as DayTimeUnit,
        roundingInc,
        roundingMode,
      ),
    )
  }

  if (!markerSlots) {
    throw new RangeError('need relativeTo')
  }

  const markerSystem = createMarkerSystem(getCalendarOps, getTimeZoneOps, markerSlots) as
    MarkerSystem<any>

  let transplantedWeeks = 0
  if (slots.weeks && smallestUnit === Unit.Week) {
    transplantedWeeks = slots.weeks
    slots = { ...slots, weeks: 0 }
  }

  let [balancedDuration, endEpochNano] = spanDuration(slots, undefined, largestUnit, ...markerSystem)

  const origSign = queryDurationSign(slots)
  const balancedSign = queryDurationSign(balancedDuration)
  if (origSign && balancedSign && origSign !== balancedSign) {
    throw new RangeError('Faulty Calendar rounding')
  }

  if (balancedSign && !(smallestUnit === Unit.Nanosecond && roundingInc === 1)) {
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
// -------------------------------------------------------------------------------------------------

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

export function absDuration(slots: DurationSlots): DurationSlots {
  return createDurationSlots(absDurationFields(slots))
}

export function absDurationFields(fields: DurationFields): DurationFields {
  if (queryDurationSign(fields) === -1) {
    return negateDurationFields(fields)
  }

  return fields
}

export function queryDurationBlank(durationFields: DurationFields): boolean {
  return !queryDurationSign(durationFields)
}

export const queryDurationSign = createLazyGenerator(computeDurationSign, WeakMap)

function computeDurationSign(
  fields: DurationFields,
  fieldNames = durationFieldNamesAsc
): NumSign {
  let sign: NumSign = 0

  for (const fieldName of fieldNames) {
    const fieldSign = Math.sign(fields[fieldName]) as NumSign

    if (fieldSign) {
      if (sign && sign !== fieldSign) {
        throw new RangeError('Cant have mixed signs')
      }
      sign = fieldSign
    }
  }

  return sign
}

export function checkDurationFields(fields: DurationFields): DurationFields {
  queryDurationSign(fields) // check and prime cache
  return fields
}

// Field <-> Nanosecond Conversion
// -------------------------------------------------------------------------------------------------

export function durationTimeFieldsToLargeNanoStrict(fields: DurationFields): DayTimeNano {
  if (durationHasDateParts(fields)) {
    throw new RangeError('Operation not allowed') // correct error?
  }

  return durationFieldsToDayTimeNano(fields, Unit.Hour)
}

export function durationFieldsToDayTimeNano(fields: DurationFields, largestUnit: DayTimeUnit): DayTimeNano {
  return givenFieldsToDayTimeNano(fields, largestUnit, durationFieldNamesAsc)
}

export function nanoToDurationDayTimeFields(largeNano: DayTimeNano): { days: number } & DurationTimeFields
export function nanoToDurationDayTimeFields(largeNano: DayTimeNano, largestUnit?: DayTimeUnit): Partial<DurationFields>
export function nanoToDurationDayTimeFields(
  dayTimeNano: DayTimeNano,
  largestUnit: DayTimeUnit = Unit.Day,
): Partial<DurationFields> {
  const [days, timeNano] = dayTimeNano
  const dayTimeFields = nanoToGivenFields(timeNano, largestUnit, durationFieldNamesAsc)

  dayTimeFields[durationFieldNamesAsc[largestUnit]]! +=
    days * (nanoInUtcDay / unitNanoMap[largestUnit])

  if (!Number.isFinite(dayTimeFields[durationFieldNamesAsc[largestUnit]]!)) {
    throw new RangeError('Too big')
  }

  return dayTimeFields
}

// audit
export function nanoToDurationTimeFields(nano: number): DurationTimeFields
export function nanoToDurationTimeFields(nano: number, largestUnit: TimeUnit): Partial<DurationTimeFields>
export function nanoToDurationTimeFields(
  nano: number,
  largestUnit: TimeUnit = Unit.Hour,
): Partial<DurationTimeFields> {
  return nanoToGivenFields(nano, largestUnit, durationFieldNamesAsc as (keyof DurationTimeFields)[])
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
// -------------------------------------------------------------------------------------------------

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

export function isDurationsEqual(
  a: DurationFields,
  b: DurationFields,
): boolean {
  return a.years === b.years &&
    a.months === b.months &&
    a.weeks === b.weeks &&
    a.days === b.days &&
    a.hours === b.hours &&
    a.minutes === b.minutes &&
    a.seconds === b.seconds &&
    a.milliseconds === b.milliseconds &&
    a.microseconds === b.microseconds &&
    a.nanoseconds === b.nanoseconds
}
