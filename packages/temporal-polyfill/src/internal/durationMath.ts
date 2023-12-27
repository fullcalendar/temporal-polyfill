import { DayTimeNano, addDayTimeNanos, compareDayTimeNanos, dayTimeNanoToNumber, diffDayTimeNanos } from './dayTimeNano'
import { DayTimeUnit, Unit, UnitName, givenFieldsToDayTimeNano, unitNanoMap } from './units'
import { NumSign, createLazyGenerator, identityFunc } from './utils'
import { DurationFields, durationFieldsToDayTimeNano, durationFieldDefaults, nanoToDurationDayTimeFields, durationFieldNamesAsc, durationDateFieldNamesAsc, clearDurationFields } from './durationFields'
import { DiffOps } from './calendarOps'
import { TimeZoneOps } from './timeZoneOps'
import { DurationSlots } from '../genericApi/slotsGeneric'
import { DurationRoundOptions, RelativeToOptions, TotalUnitOptionsWithRel, normalizeOptions, refineDurationRoundOptions, refineTotalOptions } from '../genericApi/optionsRefine'
import { DurationBranding } from '../genericApi/branding'
import { moveDateTime, moveZonedEpochNano } from './move'
import { IsoDateFields, IsoDateTimeFields, isoTimeFieldDefaults } from './calendarIsoFields'
import { diffDateTimes2, diffZonedEpochNano2 } from './diff'
import { isoToEpochNano } from './epochAndTime'
import { clampRelativeDuration, roundDayTimeDuration, roundRelativeDuration, totalDayTimeNano } from './round'

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
export type SimpleMarkerSystem<M> = [
  M,
  MarkerToEpochNano<M>,
  MoveMarker<M>
]

export function compareDurations<RA, C, T>(
  refineRelativeTo: (relativeToArg: RA) => MarkerSlots<C, T> | undefined,
  getCalendarOps: (calendarSlot: C) => DiffOps,
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  durationSlots0: DurationSlots,
  durationSlots1: DurationSlots,
  options?: RelativeToOptions<RA>,
): NumSign {
  const normalOptions = normalizeOptions(options)
  const markerSlots = refineRelativeTo(normalOptions.relativeTo)
  const largestUnit = Math.max(
    getLargestDurationUnit(durationSlots0),
    getLargestDurationUnit(durationSlots1),
  ) as Unit

  // fast-path if fields identical
  if (
    durationSlots0.years === durationSlots1.years &&
    durationSlots0.months === durationSlots1.months &&
    durationSlots0.weeks === durationSlots1.weeks &&
    durationSlots0.days === durationSlots1.days &&
    durationSlots0.hours === durationSlots1.hours &&
    durationSlots0.minutes === durationSlots1.minutes &&
    durationSlots0.seconds === durationSlots1.seconds &&
    durationSlots0.milliseconds === durationSlots1.milliseconds &&
    durationSlots0.microseconds === durationSlots1.microseconds &&
    durationSlots0.nanoseconds === durationSlots1.nanoseconds
  ) {
    return 0
  }

  if (
    largestUnit < Unit.Day || (
      largestUnit === Unit.Day &&
      // has uniform days?
      !(markerSlots && (markerSlots as any).epochNanoseconds)
    )
  ) {
    return compareDayTimeNanos(
      givenFieldsToDayTimeNano(durationSlots0, Unit.Day, durationFieldNamesAsc),
      givenFieldsToDayTimeNano(durationSlots1, Unit.Day, durationFieldNamesAsc)
    )
  }

  if (!markerSlots) {
    throw new RangeError('need relativeTo')
  }

  const [marker, markerToEpochNano, moveMarker] = createMarkerSystem(getCalendarOps, getTimeZoneOps, markerSlots) as
    MarkerSystem<any>

  return compareDayTimeNanos(
    markerToEpochNano(moveMarker(marker, durationSlots0)),
    markerToEpochNano(moveMarker(marker, durationSlots1)),
  )
}

export function totalDuration<RA, C, T>(
  refineRelativeTo: (relativeToArg: RA) => MarkerSlots<C, T> | undefined,
  getCalendarOps: (calendarSlot: C) => DiffOps,
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  slots: DurationSlots,
  options: TotalUnitOptionsWithRel<RA> | UnitName,
): number {
  const durationLargestUnit = getLargestDurationUnit(slots)
  const [totalUnit, markerSlots] = refineTotalOptions(options, refineRelativeTo)
  const maxLargestUnit = Math.max(totalUnit, durationLargestUnit)

  if (
    maxLargestUnit < Unit.Day || (
      maxLargestUnit === Unit.Day &&
      // has uniform days?
      !(markerSlots && (markerSlots as any).epochNanoseconds)
    )
  ) {
    return totalDayTimeDuration(slots, totalUnit as DayTimeUnit)
  }

  if (!markerSlots) {
    throw new RangeError('need relativeTo')
  }

  const markerSystem = createMarkerSystem(getCalendarOps, getTimeZoneOps, markerSlots) as
    MarkerSystem<any>

  return totalRelativeDuration(
    ...spanDuration(slots, undefined, totalUnit, ...markerSystem),
    totalUnit,
    ...(markerSystem as unknown as SimpleMarkerSystem<unknown>),
  )
}

function totalDayTimeDuration(
  durationFields: DurationFields,
  totalUnit: DayTimeUnit,
): number {
  return totalDayTimeNano(
    durationFieldsToDayTimeNano(durationFields, Unit.Day),
    totalUnit,
  )
}

function totalRelativeDuration<M>(
  durationFields: DurationFields, // must be balanced & top-heavy in day or larger (so, small time-fields)
  endEpochNano: DayTimeNano,
  totalUnit: Unit,
  // marker system...
  marker: M,
  markerToEpochNano: MarkerToEpochNano<M>,
  moveMarker: MoveMarker<M>,
): number {
  const sign = queryDurationSign(durationFields)

  const [epochNano0, epochNano1] = clampRelativeDuration(
    clearDurationFields(durationFields, totalUnit - 1),
    totalUnit,
    sign,
    // marker system...
    marker,
    markerToEpochNano,
    moveMarker,
  )

  // TODO: more DRY
  const frac =
    dayTimeNanoToNumber(diffDayTimeNanos(epochNano0, endEpochNano)) /
    dayTimeNanoToNumber(diffDayTimeNanos(epochNano0, epochNano1))
  if (!Number.isFinite(frac)) {
    throw new RangeError('Faulty Calendar rounding')
  }

  return durationFields[durationFieldNamesAsc[totalUnit]] + frac * sign
}

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

  // TODO: move to round.js?

  if (
    maxLargestUnit < Unit.Day || (
      maxLargestUnit === Unit.Day &&
      // has uniform days?
      !(markerSlots && (markerSlots as any).epochNanoseconds)
    )
  ) {
    return {
      branding: DurationBranding,
      ...roundDayTimeDuration(
        slots,
        largestUnit as DayTimeUnit, // guaranteed <= maxLargestUnit <= Unit.Day
        smallestUnit as DayTimeUnit,
        roundingInc,
        roundingMode,
      ),
    }
  }

  if (!markerSlots) {
    throw new RangeError('need relativeTo')
  }

  const markerSystem = createMarkerSystem(getCalendarOps, getTimeZoneOps, markerSlots) as
    MarkerSystem<any>

  // TODO: do this in roundRelativeDuration?
  let transplantedWeeks = 0
  if (slots.weeks && smallestUnit === Unit.Week) {
    transplantedWeeks = slots.weeks
    slots = { ...slots, weeks: 0 }
  }

  const [balancedDuration, endEpochNano] = spanDuration(slots, undefined, largestUnit, ...markerSystem)

  const sign0 = queryDurationSign(slots)
  const sign1 = queryDurationSign(balancedDuration)
  if (sign0 && sign1 && sign0 !== sign1) {
    throw new RangeError('Faulty Calendar rounding')
  }

  const roundedDurationFields = roundRelativeDuration(
    balancedDuration,
    endEpochNano,
    largestUnit,
    smallestUnit,
    roundingInc,
    roundingMode,
    ...(markerSystem as unknown as SimpleMarkerSystem<unknown>),
  )

  roundedDurationFields.weeks += transplantedWeeks // HACK (mutating)

  return {
    branding: DurationBranding,
    ...roundedDurationFields,
  }
}

export function addToDuration<RA, C, T>(
  refineRelativeTo: (relativeToArg: RA) => MarkerSlots<C, T> | undefined,
  getCalendarOps: (calendarSlot: C) => DiffOps,
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  slots: DurationSlots,
  otherSlots: DurationSlots,
  options?: RelativeToOptions<RA>,
  direction: -1 | 1 = 1,
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
    return {
      branding: DurationBranding,
      ...addDayTimeDuration(slots, otherSlots, direction, largestUnit as DayTimeUnit),
    }
  }

  if (!markerSlots) {
    throw new RangeError('relativeTo is required for years, months, or weeks arithmetic')
  }

  if (direction === -1) {
    otherSlots = negateDuration(otherSlots) as any // !!!
  }

  const markerSystem = createMarkerSystem(getCalendarOps, getTimeZoneOps, markerSlots) as
    MarkerSystem<any>

  return {
    branding: DurationBranding,
    ...spanDuration(
      slots,
      otherSlots,
      largestUnit,
      ...markerSystem,
    )[0]
  }
}

export function addDayTimeDuration(
  a: DurationFields,
  b: DurationFields,
  sign: NumSign,
  largestUnit: DayTimeUnit
): DurationFields {
  const dayTimeNano0 = durationFieldsToDayTimeNano(a, Unit.Day)
  const dayTimeNano1 = durationFieldsToDayTimeNano(b, Unit.Day)
  const combined = addDayTimeNanos(dayTimeNano0, dayTimeNano1, sign)

  if (!Number.isFinite(combined[0])) {
    throw new RangeError('Too much')
  }

  return {
    ...durationFieldDefaults,
    ...nanoToDurationDayTimeFields(combined, largestUnit)
  }
}

export function negateDuration(fields: DurationFields): DurationFields {
  const res = {} as DurationFields

  for (const fieldName of durationFieldNamesAsc) {
    res[fieldName] = fields[fieldName] * -1 || 0
  }

  return res
}

export function absDuration(fields: DurationFields): DurationFields {
  if (queryDurationSign(fields) === -1) {
    return negateDuration(fields)
  }
  return fields
}

export function durationHasDateParts(fields: DurationFields): boolean {
  return Boolean(computeDurationSign(fields, durationDateFieldNamesAsc))
}

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

export const queryDurationSign = createLazyGenerator(computeDurationSign, WeakMap)

export function checkDurationFields(fields: DurationFields): DurationFields {
  queryDurationSign(fields) // check and prime cache
  return fields
}

function createMarkerSystem<C, T>(
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
      (epochNano: DayTimeNano, durationFields: DurationFields) => {
        return moveZonedEpochNano(calendarOps, timeZoneOps, epochNano, durationFields)
      },
      (epochNano0: DayTimeNano, epochNano1: DayTimeNano, largestUnit: Unit) => {
        return diffZonedEpochNano2(calendarOps, timeZoneOps, epochNano0, epochNano1, largestUnit)
      },
    ]
  } else {
    return [
      { ...markerSlots, ...isoTimeFieldDefaults } as IsoDateTimeFields,
      isoToEpochNano as MarkerToEpochNano<IsoDateTimeFields>,
      (isoField: IsoDateTimeFields, durationFields: DurationFields) => {
        return moveDateTime(calendarOps, isoField, durationFields)
      },
      (m0: IsoDateTimeFields, m1: IsoDateTimeFields, largeUnit: Unit) => {
        return diffDateTimes2(calendarOps, m0, m1, largeUnit)
      },
    ]
  }
}

function spanDuration<M>(
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

export function getLargestDurationUnit(fields: DurationFields): Unit {
  let unit: Unit = Unit.Year

  for (; unit > Unit.Nanosecond; unit--) {
    if (fields[durationFieldNamesAsc[unit]]) {
      break
    }
  }

  return unit
}
