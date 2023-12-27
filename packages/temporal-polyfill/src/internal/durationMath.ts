import { DayTimeNano, addDayTimeNanos } from './dayTimeNano'
import { DayTimeUnit, Unit, unitNanoMap } from './units'
import { NumSign, createLazyGenerator, identityFunc } from './utils'
import { DurationFields, durationFieldsToDayTimeNano, durationFieldDefaults, nanoToDurationDayTimeFields, durationFieldNamesAsc, durationDateFieldNamesAsc } from './durationFields'
import { DiffOps } from './calendarOps'
import { TimeZoneOps } from './timeZoneOps'
import { DurationBranding, DurationSlots } from './slots'
import { DurationRoundOptions, RelativeToOptions, normalizeOptions, refineDurationRoundOptions } from './optionsRefine'
import { moveDateTime, moveZonedEpochNano } from './move'
import { IsoDateFields, IsoDateTimeFields, isoTimeFieldDefaults } from './calendarIsoFields'
import { diffDateTimes2, diffZonedEpochNano2 } from './diff'
import { isoToEpochNano } from './epochAndTime'
import { roundDayTimeDuration, roundRelativeDuration } from './round'

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
    ...markerSystem,
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

function addDayTimeDuration(
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

export function getLargestDurationUnit(fields: DurationFields): Unit {
  let unit: Unit = Unit.Year

  for (; unit > Unit.Nanosecond; unit--) {
    if (fields[durationFieldNamesAsc[unit]]) {
      break
    }
  }

  return unit
}
