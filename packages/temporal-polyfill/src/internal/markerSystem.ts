import { BigNano, addBigNanos } from './bigNano'
import { MoveOps } from './calendarOps'
import { prepareDateTimeDiff, prepareZonedDateTimeDiff } from './diff'
import { DurationFields, durationTimeFieldDefaults } from './durationFields'
import { durationFieldsToBigNano } from './durationMath'
import {
  IsoDateFields,
  IsoDateTimeFields,
  IsoTimeFields,
  isoTimeFieldDefaults,
  isoTimeFieldNamesAsc,
} from './isoFields'
import { moveDate } from './move'
import { DateSlots, EpochAndZoneSlots, ZonedEpochSlots } from './slots'
import { epochNanoToIso, isoToEpochNano } from './timeMath'
import {
  TimeZoneOps,
  getSingleInstantFor,
  zonedEpochSlotsToIso,
} from './timeZoneOps'
import { Unit } from './units'
import { NumberSign, pluckProps } from './utils'

// the "origin"
export type RelativeToSlots<C, T> = DateSlots<C> | ZonedEpochSlots<C, T>

// the "origin", returned from bag refining
export type RelativeToSlotsNoCalendar<T> = IsoDateFields | EpochAndZoneSlots<T>

// a date marker that's moved away from the "origin"
export type Marker = IsoDateFields | IsoDateTimeFields | ZonedEpochSlots

export type MarkerSystem<CO> = [Marker, CO, TimeZoneOps?]

export function createMarkerSystem<C, CO, T>(
  getCalendarOps: (calendarSlot: C) => CO,
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  relativeToSlots: RelativeToSlots<C, T>,
): MarkerSystem<CO> {
  const calendarOps = getCalendarOps(relativeToSlots.calendar)

  if (isZonedEpochSlots(relativeToSlots)) {
    return [
      relativeToSlots,
      calendarOps,
      getTimeZoneOps(relativeToSlots.timeZone),
    ]
  }

  return [
    // convert IsoDateFields->IsoDateTimeFields
    { ...relativeToSlots, ...isoTimeFieldDefaults },
    calendarOps,
  ]
}

// Split / Join
// -----------------------------------------------------------------------------

export function splitDuration(
  durationFields: DurationFields,
): [DurationFields, BigNano] {
  return [
    { ...durationFields, ...durationTimeFieldDefaults },
    durationFieldsToBigNano(durationFields, Unit.Hour),
  ]
}

export function joinIsoDateAndTime(
  isoDate: IsoDateFields,
  isoTime: IsoTimeFields,
): IsoDateTimeFields {
  return {
    ...isoDate,
    ...pluckProps(isoTimeFieldNamesAsc, isoTime),
  }
}

// Marker Operations
// -----------------------------------------------------------------------------

export function markerToIsoDateTime(
  timeZoneOps: TimeZoneOps | undefined,
  marker: Marker,
): IsoDateTimeFields {
  if (timeZoneOps) {
    return zonedEpochSlotsToIso(marker as ZonedEpochSlots, timeZoneOps)
  }
  return { ...(marker as IsoDateFields), ...isoTimeFieldDefaults }
}

export function markerToEpochNano(marker: Marker): BigNano {
  if ((marker as ZonedEpochSlots).epochNanoseconds) {
    return (marker as ZonedEpochSlots).epochNanoseconds
  }
  return isoToEpochNano(marker as IsoDateFields)!
}

/*
TODO: make DRY with `moveZonedIsoDateTime`
*/
export function moveMarkerIsoDateTime(
  calendarOps: MoveOps,
  timeZoneOps: TimeZoneOps | undefined,
  isoDateTime: IsoDateTimeFields,
  durationFields: DurationFields,
): BigNano {
  const [durationDateFields, durationTimeNano] = splitDuration(durationFields)
  const movedIsoDate = moveDate(calendarOps, isoDateTime, durationDateFields)
  const movedIsoDateTime = joinIsoDateAndTime(movedIsoDate, isoDateTime)
  return addBigNanos(
    markerIsoDateTimeToEpochNano(timeZoneOps, movedIsoDateTime),
    durationTimeNano,
  )
}

export function markerIsoDateTimeToEpochNano(
  timeZoneOps: TimeZoneOps | undefined,
  isoDateTime: IsoDateTimeFields,
): BigNano {
  if (timeZoneOps) {
    return getSingleInstantFor(timeZoneOps, isoDateTime)
  }
  return isoToEpochNano(isoDateTime)!
}

export function markerEpochNanoToIsoDateTime(
  timeZoneOps: TimeZoneOps | undefined,
  epochNano: BigNano,
): IsoDateTimeFields {
  if (timeZoneOps) {
    // like what zonedEpochSlotsToIso does
    const offsetNanoseconds = timeZoneOps.getOffsetNanosecondsFor(epochNano)
    return epochNanoToIso(epochNano, offsetNanoseconds)
  }
  return epochNanoToIso(epochNano, 0)
}

export function prepareMarkerIsoDateTimeDiff(
  timeZoneOps: TimeZoneOps | undefined,
  startIsoDateTime: IsoDateTimeFields,
  endIsoDateTime: IsoDateTimeFields,
  endEpochNano: BigNano,
  sign: NumberSign,
): [IsoDateFields, IsoDateFields, number] {
  if (timeZoneOps) {
    return prepareZonedDateTimeDiff(
      timeZoneOps,
      startIsoDateTime,
      endIsoDateTime,
      endEpochNano,
      sign,
    )
  }
  return prepareDateTimeDiff(startIsoDateTime, endIsoDateTime, sign)
}

// Utils
// -----------------------------------------------------------------------------

export function isZonedEpochSlots(
  marker: Marker | undefined,
): marker is ZonedEpochSlots {
  return (marker &&
    (marker as ZonedEpochSlots).epochNanoseconds) as unknown as boolean
}

/*
For PlainDate(Time) markers, days+time are uniform
For ZonedDateTime markers, only time is uniform (days can vary in length)
*/
export function isUniformUnit(unit: Unit, marker: Marker | undefined): boolean {
  return unit <= Unit.Day - (isZonedEpochSlots(marker) ? 1 : 0)
}
