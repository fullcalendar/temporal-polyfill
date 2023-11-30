import { calendarImplDateAdd, calendarImplDateUntil } from '../internal/calendarRecordSimple'
import { DayTimeNano } from '../internal/dayTimeNano'
import { diffDateTimes, diffZonedEpochNano } from '../internal/diff'
import {
  DurationFields,
  updateDurationFieldsSign
} from '../internal/durationFields'
import { isoTimeFieldDefaults, IsoDateTimeFields } from '../internal/isoFields'
import { isoToEpochNano } from '../internal/isoMath'
import { moveDateTime, moveZonedEpochNano } from '../internal/move'
import { timeZoneImplGetOffsetNanosecondsFor, timeZoneImplGetPossibleInstantsFor } from '../internal/timeZoneRecordSimple'
import { Unit } from '../internal/units'
import { identityFunc } from '../internal/utils'
import { MarkerSystem, MarkerToEpochNano, MoveMarker, DiffMarkers } from '../internal/markerSystemTypes'

// public
import { IsoDateSlots, ZonedEpochSlots } from './slots'
import { calendarProtocolDateAdd, calendarProtocolDateUntil, createCalendarSlotRecord } from './calendarRecordComplex'
import { createTimeZoneSlotRecord, timeZoneProtocolGetOffsetNanosecondsFor, timeZoneProtocolGetPossibleInstantsFor } from './timeZoneRecordComplex'
import { createTypicalTimeZoneRecord, getDiffCalendarRecord } from './recordCreators'

/*
Okay that callers frequently cast to `unknown`?
FYI: input can be a PlainDate's internals (IsoDateSlots), but marker has time
*/

export function createMarkerSystem(
  markerInternals: ZonedEpochSlots | IsoDateSlots
): MarkerSystem<DayTimeNano> | MarkerSystem<IsoDateTimeFields> {
  const { calendar, timeZone, epochNanoseconds } = markerInternals as ZonedEpochSlots

  const calendarRecord = createCalendarSlotRecord(calendar, {
    dateAdd: calendarImplDateAdd,
    dateUntil: calendarImplDateUntil,
  }, {
    dateAdd: calendarProtocolDateAdd,
    dateUntil: calendarProtocolDateUntil,
  })

  if (epochNanoseconds) {
    function getTimeZoneRecord() {
      return createTimeZoneSlotRecord(timeZone, {
        getOffsetNanosecondsFor: timeZoneImplGetOffsetNanosecondsFor,
        getPossibleInstantsFor: timeZoneImplGetPossibleInstantsFor,
      }, {
        getOffsetNanosecondsFor: timeZoneProtocolGetOffsetNanosecondsFor,
        getPossibleInstantsFor: timeZoneProtocolGetPossibleInstantsFor,
      })
    }

    return [
      epochNanoseconds,
      identityFunc as MarkerToEpochNano<DayTimeNano>,
      moveZonedEpochNano.bind(undefined, calendarRecord, getTimeZoneRecord()) as MoveMarker<DayTimeNano>,
      diffZonedEpochNano.bind(undefined,
        getDiffCalendarRecord as any, // !!! 'unknown' problems
        createTypicalTimeZoneRecord as any, // !!! 'unknown' problems
        calendar,
        timeZone,
      ) as DiffMarkers<DayTimeNano>,
    ]
  } else {
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
