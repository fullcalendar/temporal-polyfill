import { BigNano } from './bigNano'
import {
  IsoDateFields,
  IsoDateTimeFields,
  isoTimeFieldDefaults,
} from './isoFields'
import { DateSlots, EpochAndZoneSlots, ZonedEpochSlots } from './slots'
import { isoToEpochNano } from './timeMath'
import { TimeZoneOps } from './timeZoneOps'

// the "origin"
export type RelativeToSlots<C, T> = DateSlots<C> | ZonedEpochSlots<C, T>

// the "origin", returned from bag refining
export type RelativeToSlotsNoCalendar<T> = IsoDateFields | EpochAndZoneSlots<T>

// a date marker that's moved away from the "origin"
export type RelativeMarkerSlots =
  | IsoDateTimeFields
  | ZonedEpochSlots<unknown, unknown>

export type RelativeSystem<CO> = [RelativeMarkerSlots, CO, TimeZoneOps?]

export function createRelativeSystem<C, CO, T>(
  getCalendarOps: (calendarSlot: C) => CO,
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  slots: RelativeToSlots<C, T>,
): RelativeSystem<CO> {
  const calendarOps = getCalendarOps(slots.calendar)

  if ((slots as ZonedEpochSlots<C, T>).epochNanoseconds) {
    return [
      slots as ZonedEpochSlots<C, T>,
      calendarOps,
      getTimeZoneOps((slots as ZonedEpochSlots<C, T>).timeZone),
    ]
  }

  return [{ ...slots, ...isoTimeFieldDefaults }, calendarOps]
}

export function relativeMarkerToEpochNano(
  marker: RelativeMarkerSlots,
  timeZoneOps?: TimeZoneOps,
): BigNano {
  if (timeZoneOps) {
    return (marker as ZonedEpochSlots<unknown, unknown>).epochNanoseconds
  }
  return isoToEpochNano(marker as IsoDateTimeFields)!
}
