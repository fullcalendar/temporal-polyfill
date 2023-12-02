import { DayTimeNano } from '../internal/dayTimeNano'
import { diffDateTimes, diffZonedEpochNano } from '../internal/diff'
import { updateDurationFieldsSign } from '../internal/durationFields'
import { isoTimeFieldDefaults, IsoDateTimeFields } from '../internal/isoFields'
import { isoToEpochNano } from '../internal/isoMath'
import { moveDateTime, moveZonedEpochNano } from '../internal/move'
import { Unit } from '../internal/units'
import { identityFunc } from '../internal/utils'
import { MarkerSystem, MarkerToEpochNano, MarketSlots } from '../internal/markerSystemTypes'

// public
import { createTypicalTimeZoneRecord, getDiffCalendarRecord } from './recordCreators'
import { CalendarSlot } from './calendarSlot'
import { TimeZoneSlot } from './timeZoneSlot'

/*
Okay that callers frequently cast to `unknown`?
FYI: input can be a PlainDate's internals (IsoDateSlots), but marker has time
*/

export function createPublicMarkerSystem(
  markerSlots: MarketSlots<CalendarSlot, TimeZoneSlot>,
): MarkerSystem<DayTimeNano> | MarkerSystem<IsoDateTimeFields> {
  const { calendar, timeZone, epochNanoseconds } = markerSlots as
    { calendar: CalendarSlot, timeZone?: TimeZoneSlot, epochNanoseconds?: DayTimeNano }

  const calendarRecord = getDiffCalendarRecord(calendar)

  if (epochNanoseconds) {
    const timeZoneRecord = createTypicalTimeZoneRecord(timeZone!)

    return [
      epochNanoseconds,
      identityFunc as MarkerToEpochNano<DayTimeNano>,
      moveZonedEpochNano.bind(undefined, calendarRecord, timeZoneRecord),
      diffZonedEpochNano.bind(undefined, calendarRecord, timeZoneRecord),
    ]
  } else {
    return [
      { ...markerSlots, ...isoTimeFieldDefaults } as IsoDateTimeFields,
      isoToEpochNano as MarkerToEpochNano<IsoDateTimeFields>,
      moveDateTime.bind(undefined, calendarRecord),
      (m0: IsoDateTimeFields, m1: IsoDateTimeFields, largeUnit: Unit) => {
        return updateDurationFieldsSign(diffDateTimes(calendarRecord, m0, m1, largeUnit))
      },
    ]
  }
}
