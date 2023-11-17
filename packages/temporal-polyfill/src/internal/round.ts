import { calendarImplDateAdd, calendarImplDateUntil } from './calendarRecordSimple'
import { DayTimeNano, addDayTimeNanoAndNumber, addDayTimeNanos, createDayTimeNano, dayTimeNanoToNumber, diffDayTimeNanos } from './dayTimeNano'
import { diffDateTimes, diffZonedEpochNano } from './diff'
import {
  DurationFields,
  DurationInternals,
  durationFieldDefaults,
  durationFieldNamesAsc,
  durationTimeFieldDefaults,
  updateDurationFieldsSign,
  durationFieldsToDayTimeNano,
  nanoToDurationDayTimeFields,
  nanoToDurationTimeFields,
} from './durationFields'
import { IsoTimeFields, isoTimeFieldDefaults, IsoDateTimeFields } from './isoFields'
import { checkIsoDateTimeInBounds, isoTimeFieldsToNano, isoToEpochNano, nanoToIsoTimeAndDay, moveByIsoDays, epochNanoToIso } from './isoMath'
import { moveDateTime, moveZonedEpochNano } from './move'
import { EpochDisambig, OffsetDisambig, RoundingMode, RoundingOptions, refineRoundOptions, roundingModeFuncs } from './options'
import { IsoDateSlots, IsoDateTimeSlots, ZonedEpochSlots } from './slots'
import { timeZoneImplGetOffsetNanosecondsFor, timeZoneImplGetPossibleInstantsFor } from './timeZoneRecordSimple'
import { TimeZoneGetOffsetNanosecondsForFunc, TimeZoneGetPossibleInstantsForFunc } from './timeZoneRecordTypes'
import { computeNanosecondsInDay, getMatchingInstantFor } from './timeZoneSlot'
import {
  nanoInMinute,
  nanoInUtcDay,
  unitNanoMap,
  Unit,
  DayTimeUnit,
  TimeUnit,
  givenFieldsToDayTimeNano,
  UnitName,
} from './units'
import { divModFloor, divTrunc, identityFunc } from './utils'

// public
import { calendarProtocolDateAdd, calendarProtocolDateUntil, createCalendarSlotRecord } from '../public/calendarRecordComplex'
import { createTimeZoneSlotRecord, timeZoneProtocolGetOffsetNanosecondsFor, timeZoneProtocolGetPossibleInstantsFor } from '../public/timeZoneRecordComplex'

export function roundPlainDateTime(
  internals: IsoDateTimeSlots,
  options: RoundingOptions | UnitName,
): IsoDateTimeSlots {
  const isoDateTimeFields = roundDateTime(
    internals,
    ...(refineRoundOptions(options) as [DayTimeUnit, number, RoundingMode]),
  )

  return {
    ...isoDateTimeFields,
    calendar: internals.calendar,
  }
}

export function roundZonedDateTime(
  internals: ZonedEpochSlots,
  options: RoundingOptions | UnitName,
): ZonedEpochSlots {
  let { epochNanoseconds, timeZone, calendar } = internals
  const timeZoneRecord = createTimeZoneSlotRecord(timeZone, {
    getOffsetNanosecondsFor: timeZoneImplGetOffsetNanosecondsFor,
    getPossibleInstantsFor: timeZoneImplGetPossibleInstantsFor,
  }, {
    getOffsetNanosecondsFor: timeZoneProtocolGetOffsetNanosecondsFor,
    getPossibleInstantsFor: timeZoneProtocolGetPossibleInstantsFor,
  })

  const [smallestUnit, roundingInc, roundingMode] = refineRoundOptions(options)

  const offsetNano = timeZoneRecord.getOffsetNanosecondsFor(epochNanoseconds)
  let isoDateTimeFields = {
    ...epochNanoToIso(epochNanoseconds, offsetNano),
    calendar,
  }

  isoDateTimeFields = {
    calendar,
    ...roundDateTime(
      isoDateTimeFields,
      smallestUnit as DayTimeUnit,
      roundingInc,
      roundingMode,
      timeZoneRecord,
    )
  }

  epochNanoseconds = getMatchingInstantFor(
    timeZoneRecord,
    { ...isoDateTimeFields, calendar },
    offsetNano,
    false, // z
    OffsetDisambig.Prefer, // keep old offsetNano if possible
    EpochDisambig.Compat,
    true, // fuzzy
  )

  return {
    epochNanoseconds,
    timeZone,
    calendar,
  }
}

export function roundInstant(
  epochNano: DayTimeNano,
  options: RoundingOptions | UnitName,
): DayTimeNano {
  const [smallestUnit, roundingInc, roundingMode] = refineRoundOptions(
    options,
    Unit.Hour,
    true, // solarMode
  )

  return roundDayTimeNano(
    epochNano,
    smallestUnit as TimeUnit,
    roundingInc,
    roundingMode,
    true, // useDayOrigin
  )
}

export function roundPlainTime(
  fields: IsoTimeFields,
  options: RoundingOptions | UnitName
): IsoTimeFields {
  return roundTime(
    fields,
    ...(refineRoundOptions(options, Unit.Hour) as [TimeUnit, number, RoundingMode])
  )
}

// Misc
// -------------------------------------------------------------------------------------------------

export function roundToMinute(offsetNano: number): number {
  return roundByInc(offsetNano, nanoInMinute, RoundingMode.HalfExpand)
}

// Rounding Dates
// -------------------------------------------------------------------------------------------------

export function roundDateTime(
  isoFields: IsoDateTimeSlots,
  smallestUnit: DayTimeUnit,
  roundingInc: number,
  roundingMode: RoundingMode,
  timeZoneSlot?: undefined | {
    getOffsetNanosecondsFor: TimeZoneGetOffsetNanosecondsForFunc,
    getPossibleInstantsFor: TimeZoneGetPossibleInstantsForFunc,
  },
): IsoDateTimeFields {
  if (smallestUnit === Unit.Day) {
    return roundDateTimeToDay(isoFields, timeZoneSlot, roundingMode)
  }

  return roundDateTimeToNano(
    isoFields,
    computeNanoInc(smallestUnit, roundingInc),
    roundingMode,
  )
}

export function roundTime(
  isoFields: IsoTimeFields,
  smallestUnit: TimeUnit,
  roundingInc: number,
  roundingMode: RoundingMode,
): IsoTimeFields {
  return roundTimeToNano(
    isoFields,
    computeNanoInc(smallestUnit, roundingInc),
    roundingMode,
  )[0]
}

// TODO: break into two separate functions?
function roundDateTimeToDay(
  isoFields: IsoDateTimeSlots,
  timeZoneRecord: undefined | {
    getOffsetNanosecondsFor: TimeZoneGetOffsetNanosecondsForFunc,
    getPossibleInstantsFor: TimeZoneGetPossibleInstantsForFunc,
  },
  roundingMode: RoundingMode,
): IsoDateTimeFields {
  if (timeZoneRecord) {
    const nanoInDay = computeNanosecondsInDay(timeZoneRecord, isoFields)
    const roundedTimeNano = roundByInc(isoTimeFieldsToNano(isoFields), nanoInDay, roundingMode)
    const dayDelta = roundedTimeNano ? 1 : 0

    return checkIsoDateTimeInBounds({
      ...moveByIsoDays(isoFields, dayDelta),
      ...isoTimeFieldDefaults,
    })
  } else {
    return roundDateTimeToNano(isoFields, nanoInUtcDay, roundingMode)
  }
}

export function roundDateTimeToNano(
  isoFields: IsoDateTimeFields,
  nanoInc: number,
  roundingMode: RoundingMode,
): IsoDateTimeFields {
  const [roundedIsoFields, dayDelta] = roundTimeToNano(isoFields, nanoInc, roundingMode)

  return checkIsoDateTimeInBounds({
    ...moveByIsoDays(isoFields, dayDelta),
    ...roundedIsoFields,
  })
}

export function roundTimeToNano(
  isoFields: IsoTimeFields,
  nanoInc: number,
  roundingMode: RoundingMode,
): [
  IsoTimeFields,
  number,
] {
  return nanoToIsoTimeAndDay(
    roundByInc(isoTimeFieldsToNano(isoFields), nanoInc, roundingMode),
  )
}

// Rounding Duration
// -------------------------------------------------------------------------------------------------

export function roundDayTimeDuration(
  durationFields: DurationFields,
  largestUnit: DayTimeUnit,
  smallestUnit: DayTimeUnit,
  roundingInc: number,
  roundingMode: RoundingMode,
): DurationFields {
  return {
    ...durationFieldDefaults,
    ...balanceDayTimeDuration(
      durationFields,
      largestUnit,
      computeNanoInc(smallestUnit, roundingInc),
      roundingMode,
      Unit.Day,
    ),
  }
}

export function balanceDayTimeDuration(
  durationFields: DurationFields,
  largestUnit: DayTimeUnit,
  nanoInc: number, // REQUIRED: not larger than a day
  roundingMode: RoundingMode,
  largestReadUnit: DayTimeUnit = largestUnit,
): Partial<DurationFields> {
  const dayTimeNano = durationFieldsToDayTimeNano(durationFields, largestReadUnit)
  const roundedLargeNano = roundDayTimeNanoByInc(dayTimeNano, nanoInc, roundingMode)
  const partialDuration = nanoToDurationDayTimeFields(roundedLargeNano, largestUnit)

  return partialDuration
}

export function roundRelativeDuration<M>(
  durationFields: DurationFields, // must be balanced & top-heavy in day or larger (so, small time-fields)
  // ^has sign
  endEpochNano: DayTimeNano,
  largestUnit: Unit,
  smallestUnit: Unit,
  roundingInc: number,
  roundingMode: RoundingMode,
  // marker system...
  marker: M,
  markerToEpochNano: MarkerToEpochNano<M>,
  moveMarker: MoveMarker<M>,
): DurationFields {
  const durationInternals = updateDurationFieldsSign(durationFields)

  // fast path, no rounding
  if (
    !durationInternals.sign || (
      smallestUnit === Unit.Nanosecond &&
      roundingInc === 1
    )
  ) {
    return durationFields
  }

  const nudgeFunc = (
    (markerToEpochNano === identityFunc) // is zoned?
      ? smallestUnit > Unit.Day
        ? nudgeRelativeDuration
        : smallestUnit === Unit.Day
          ? nudgeDurationDayTime // doesn't worry about DST
          : nudgeRelativeDurationTime // handles DST
      : smallestUnit > Unit.Day
        ? nudgeRelativeDuration
        : nudgeDurationDayTime // doesn't worry about DST
  ) as typeof nudgeRelativeDuration // accepts all units

  let [roundedDurationFields, roundedEpochNano, grewBigUnit] = nudgeFunc(
    durationInternals,
    endEpochNano,
    smallestUnit,
    roundingInc,
    roundingMode,
    // marker system only needed for nudgeRelativeDuration...
    marker,
    markerToEpochNano,
    moveMarker,
  )

  // grew a day/week/month/year?
  if (grewBigUnit) {
    roundedDurationFields = bubbleRelativeDuration(
      updateDurationFieldsSign(roundedDurationFields),
      roundedEpochNano,
      largestUnit,
      Math.max(Unit.Day, smallestUnit),
      // marker system...
      marker,
      markerToEpochNano,
      moveMarker,
    )
  }

  return roundedDurationFields
}

// Rounding Numbers
// -------------------------------------------------------------------------------------------------

export function computeNanoInc(smallestUnit: DayTimeUnit, roundingInc: number): number {
  return unitNanoMap[smallestUnit] * roundingInc
}

export function roundByInc(num: number, inc: number, roundingMode: RoundingMode): number {
  return roundWithMode(num / inc, roundingMode) * inc
}

export function roundDayTimeNano(
  dayTimeNano: DayTimeNano,
  smallestUnit: DayTimeUnit,
  roundingInc: number,
  roundingMode: RoundingMode,
  useDayOrigin?: boolean
): DayTimeNano {
  if (smallestUnit === Unit.Day) {
    return [roundByInc(totalDayTimeNano(dayTimeNano, Unit.Day), roundingInc, roundingMode), 0]
  }

  return roundDayTimeNanoByInc(
    dayTimeNano,
    computeNanoInc(smallestUnit, roundingInc),
    roundingMode,
    useDayOrigin
  )
}

export function roundDayTimeNanoByInc(
  dayTimeNano: DayTimeNano,
  nanoInc: number, // REQUIRED: not larger than a day
  roundingMode: RoundingMode,
  useDayOrigin?: boolean
): DayTimeNano {
  let [days, timeNano] = dayTimeNano

  if (useDayOrigin && timeNano < 0) {
    timeNano += nanoInUtcDay
    days -= 1
  }

  const [dayDelta, roundedTimeNano] = divModFloor(
    roundByInc(timeNano, nanoInc, roundingMode),
    nanoInUtcDay,
  )

  return createDayTimeNano(days + dayDelta, roundedTimeNano)
}

function roundWithMode(num: number, roundingMode: RoundingMode): number {
  return roundingModeFuncs[roundingMode](num)
}

// Total Duration
// -------------------------------------------------------------------------------------------------

export function totalDayTimeDuration(
  durationFields: DurationFields,
  totalUnit: DayTimeUnit,
): number {
  return totalDayTimeNano(
    durationFieldsToDayTimeNano(durationFields, Unit.Day),
    totalUnit,
  )
}

export function totalDayTimeNano(
  dayTimeNano: DayTimeNano,
  totalUnit: DayTimeUnit,
): number {
  return dayTimeNanoToNumber(dayTimeNano, unitNanoMap[totalUnit], true) // exact
}

export function totalRelativeDuration<M>(
  durationFields: DurationInternals, // must be balanced & top-heavy in day or larger (so, small time-fields)
  endEpochNano: DayTimeNano,
  totalUnit: Unit,
  // marker system...
  marker: M,
  markerToEpochNano: MarkerToEpochNano<M>,
  moveMarker: MoveMarker<M>,
): number {
  const { sign } = durationFields

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
  const portion =
    dayTimeNanoToNumber(diffDayTimeNanos(epochNano0, endEpochNano)) /
    dayTimeNanoToNumber(diffDayTimeNanos(epochNano0, epochNano1))

  return durationFields[durationFieldNamesAsc[totalUnit]] + portion * sign
}

// Nudge
// -------------------------------------------------------------------------------------------------
/*
These functions actually do the heavy-lifting of rounding to a higher/lower marker,
and return the (day) delta. Also return the (potentially) unbalanced new duration.
*/

function nudgeDurationDayTime(
  durationFields: DurationInternals, // must be balanced & top-heavy in day or larger (so, small time-fields)
  endEpochNano: DayTimeNano, // NOT NEEDED, just for adding result to
  smallestUnit: DayTimeUnit, // always <=Day
  roundingInc: number,
  roundingMode: RoundingMode,
): [
  nudgedDurationFields: DurationFields,
  nudgedEpochNano: DayTimeNano,
  expandedBigUnit: boolean, // grew year/month/week/day?
] {
  const { sign } = durationFields
  const dayTimeNano = durationFieldsToDayTimeNano(durationFields, Unit.Day)
  const roundedDayTimeNano = roundDayTimeNano(dayTimeNano, smallestUnit, roundingInc, roundingMode)
  const nanoDiff = diffDayTimeNanos(dayTimeNano, roundedDayTimeNano)
  const expandedBigUnit = Math.sign(roundedDayTimeNano[0] - dayTimeNano[0]) === sign

  const roundedDayTimeFields = nanoToDurationDayTimeFields(
    roundedDayTimeNano,
    Math.min(Unit.Day, getLargestDurationUnit(durationFields)) as DayTimeUnit, // HACK
  )
  const nudgedDurationFields = {
    ...durationFields,
    ...roundedDayTimeFields,
  }

  return [
    nudgedDurationFields,
    addDayTimeNanos(endEpochNano, nanoDiff),
    expandedBigUnit,
  ]
}

// TODO: DRY
function getLargestDurationUnit(fields: DurationFields): Unit {
  let unit: Unit = Unit.Year

  for (; unit > Unit.Nanosecond; unit--) {
    if (fields[durationFieldNamesAsc[unit]]) {
      break
    }
  }

  return unit
}

/*
Handles crazy DST edge case
Time ONLY. Days must use full-on marker moving
*/
function nudgeRelativeDurationTime<M>(
  durationFields: DurationInternals, // must be balanced & top-heavy in day or larger (so, small time-fields)
  endEpochNano: DayTimeNano, // NOT NEEDED, just for conformance
  smallestUnit: TimeUnit, // always <Day
  roundingInc: number,
  roundingMode: RoundingMode,
  // marker system...
  marker: M,
  markerToEpochNano: MarkerToEpochNano<M>,
  moveMarker: MoveMarker<M>,
): [
  nudgedDurationFields: DurationFields,
  nudgedEpochNano: DayTimeNano,
  expandedBigUnit: boolean, // grew year/month/week/day?
] {
  const { sign } = durationFields
  let [dayDelta, timeNano] = givenFieldsToDayTimeNano(durationFields, Unit.Hour, durationFieldNamesAsc)
  const nanoInc = computeNanoInc(smallestUnit, roundingInc)
  let roundedTimeNano = roundByInc(timeNano, nanoInc, roundingMode)

  const [dayEpochNano0, dayEpochNano1] = clampRelativeDuration(
    { ...durationFields, ...durationTimeFieldDefaults },
    Unit.Day,
    sign,
    // marker system...
    marker,
    markerToEpochNano,
    moveMarker,
  )

  const daySpanEpochNanoseconds = dayTimeNanoToNumber(
    diffDayTimeNanos(dayEpochNano0, dayEpochNano1),
  )
  const beyondDay = roundedTimeNano - daySpanEpochNanoseconds

  if (!beyondDay || Math.sign(beyondDay) === sign) {
    dayDelta += sign
    roundedTimeNano = roundByInc(beyondDay, nanoInc, roundingMode)
    endEpochNano = addDayTimeNanoAndNumber(dayEpochNano1, roundedTimeNano)
  } else {
    endEpochNano = addDayTimeNanoAndNumber(dayEpochNano0, roundedTimeNano)
  }

  const durationTimeFields = nanoToDurationTimeFields(roundedTimeNano)

  const nudgedDurationFields = {
    ...durationFields,
    ...durationTimeFields,
    days: durationFields.days + dayDelta,
  }

  return [nudgedDurationFields, endEpochNano, Boolean(dayDelta)]
}

function nudgeRelativeDuration<M>(
  durationFields: DurationInternals, // must be balanced & top-heavy in day or larger (so, small time-fields)
  endEpochNano: DayTimeNano,
  smallestUnit: Unit, // always >Day
  roundingInc: number,
  roundingMode: RoundingMode,
  // marker system...
  marker: M,
  markerToEpochNano: MarkerToEpochNano<M>,
  moveMarker: MoveMarker<M>,
): [
  durationFields: DurationFields,
  movedEpochNano: DayTimeNano,
  expandedBigUnit: boolean, // grew year/month/week/day?
] {
  const { sign } = durationFields
  const smallestUnitFieldName = durationFieldNamesAsc[smallestUnit]

  const baseDurationFields = clearDurationFields(durationFields, smallestUnit - 1)
  const truncedVal = divTrunc(durationFields[smallestUnitFieldName], roundingInc) * roundingInc
  baseDurationFields[smallestUnitFieldName] = truncedVal

  const [epochNano0, epochNano1] = clampRelativeDuration(
    baseDurationFields,
    smallestUnit,
    roundingInc * sign,
    // marker system...
    marker,
    markerToEpochNano,
    moveMarker,
  )

  const frac = // always between 0 and 1 (positive)
    dayTimeNanoToNumber(diffDayTimeNanos(epochNano0, endEpochNano)) / // distance travelled
    dayTimeNanoToNumber(diffDayTimeNanos(epochNano0, epochNano1)) // entire possible distance

  const exactVal = truncedVal + (frac * sign * roundingInc)
  const roundedVal = roundByInc(exactVal, roundingInc, roundingMode)
  const expanded = Math.sign(roundedVal - exactVal) === sign

  baseDurationFields[smallestUnitFieldName] = roundedVal

  return [
    baseDurationFields,
    expanded ? epochNano1 : epochNano0,
    expanded, // guaranteed to be a big unit because of big smallestUnit
  ]
}

// Marker System
// -------------------------------------------------------------------------------------------------
// TODO: best place for this?

export type MarkerToEpochNano<M> = (marker: M) => DayTimeNano
export type MoveMarker<M> = (marker: M, durationFields: DurationFields) => M
export type DiffMarkers<M> = (marker0: M, marker1: M, largeUnit: Unit) => DurationInternals
export type MarkerSystem<M> = [
  M,
  MarkerToEpochNano<M>,
  MoveMarker<M>,
  DiffMarkers<M>,
]
export type SimpleMarkerSystem<M> = [
  M,
  MarkerToEpochNano<M>,
  MoveMarker<M>,
]

/*
Okay that callers frequently cast to `unknown`?
FYI: input can be a PlainDate's internals (IsoDateSlots), but marker has time
*/
export function createMarkerSystem(
  markerInternals: ZonedEpochSlots | IsoDateSlots
): MarkerSystem<DayTimeNano> | MarkerSystem<IsoDateTimeFields> {
  const { calendar, timeZone, epochNanoseconds } = markerInternals as ZonedEpochSlots

  if (epochNanoseconds) {
    return [
      epochNanoseconds,
      identityFunc as MarkerToEpochNano<DayTimeNano>,
      moveZonedEpochNano.bind(undefined, calendar, timeZone) as MoveMarker<DayTimeNano>,
      diffZonedEpochNano.bind(undefined, calendar, () => timeZone) as DiffMarkers<DayTimeNano>,
    ]
  } else {
    const calendarRecord = createCalendarSlotRecord(calendar, {
      dateAdd: calendarImplDateAdd,
      dateUntil: calendarImplDateUntil,
    }, {
      dateAdd: calendarProtocolDateAdd,
      dateUntil: calendarProtocolDateUntil,
    })

    return [
      { ...markerInternals, ...isoTimeFieldDefaults } as IsoDateTimeFields,
      isoToEpochNano as MarkerToEpochNano<IsoDateTimeFields>,
      // TODO: better way to .bind to Calendar
      (m: IsoDateTimeFields, d: DurationFields) => {
        return moveDateTime(calendarRecord, m, d)
      },
      (m0: IsoDateTimeFields, m1: IsoDateTimeFields, largeUnit: Unit) => {
        return updateDurationFieldsSign(diffDateTimes(calendarRecord, m0, m1, largeUnit))
      },
    ]
  }
}

// Utils
// -------------------------------------------------------------------------------------------------

function bubbleRelativeDuration<M>(
  durationFields: DurationInternals, // must be balanced & top-heavy in day or larger (so, small time-fields)
  endEpochNano: DayTimeNano,
  largestUnit: Unit,
  smallestUnit: Unit, // guaranteed Day/Week/Month/Year
  // marker system...
  marker: M,
  markerToEpochNano: MarkerToEpochNano<M>,
  moveMarker: MoveMarker<M>,
): DurationFields {
  const { sign } = durationFields

  for (
    let currentUnit: Unit = smallestUnit + 1;
    currentUnit <= largestUnit;
    currentUnit++
  ) {
    // if balancing day->month->year, skip weeks
    if (
      currentUnit === Unit.Week &&
      largestUnit !== Unit.Week
    ) {
      continue
    }

    const baseDurationFields = clearDurationFields(durationFields, currentUnit - 1)
    baseDurationFields[durationFieldNamesAsc[currentUnit]] += sign

    const thresholdEpochNano = markerToEpochNano(
      moveMarker(marker, baseDurationFields),
    )
    const beyondThreshold = dayTimeNanoToNumber(
      diffDayTimeNanos(thresholdEpochNano, endEpochNano),
    )

    if (!beyondThreshold || Math.sign(beyondThreshold) === sign) {
      durationFields = updateDurationFieldsSign(baseDurationFields)
    } else {
      break
    }
  }

  return durationFields
}

function clampRelativeDuration<M>(
  durationFields: DurationFields,
  clampUnit: Unit,
  clampDistance: number,
  // marker system...
  marker: M,
  markerToEpochNano: MarkerToEpochNano<M>,
  moveMarker: MoveMarker<M>,
) {
  const clampDurationFields = {
    ...durationFieldDefaults,
    [durationFieldNamesAsc[clampUnit]]: clampDistance,
  }
  const marker0 = moveMarker(marker, durationFields)
  const marker1 = moveMarker(marker0, clampDurationFields)
  const epochNano0 = markerToEpochNano(marker0)
  const epochNano1 = markerToEpochNano(marker1)
  return [epochNano0, epochNano1]
}

/*
Returns all units
*/
function clearDurationFields(
  durationFields: DurationFields,
  largestUnitToClear: Unit,
): DurationFields {
  const copy = { ...durationFields }

  for (let unit: Unit = Unit.Nanosecond; unit <= largestUnitToClear; unit++) {
    copy[durationFieldNamesAsc[unit]] = 0
  }

  return copy
}
