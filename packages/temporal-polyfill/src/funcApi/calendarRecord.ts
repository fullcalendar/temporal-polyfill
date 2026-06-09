import {
  attachDebugString,
  defineTemporalClass,
} from '../apiHelpers/classStyle'
import { CalendarImpl } from '../internal/calendarImpl'
import * as errorMessages from '../internal/errorMessages'
import type * as RecordTypes from './recordTypes'
import { getCalendarSlots, setCalendarSlots } from './temporalRecords'

class _CalendarRecord implements RecordTypes.CalendarRecord {
  declare readonly [RecordTypes.CalendarRecordBrand]: undefined

  toJSON() {
    return getCalendarRecordId(this)
  }

  valueOf() {
    return getCalendarRecordId(this)
  }
}

export type CalendarRecord = _CalendarRecord
export const CalendarRecord = defineTemporalClass(_CalendarRecord, 'Calendar')

/*
TODO: accept slots object like sibling files?
*/
export function createCalendarRecord(
  id: string,
  getImpl?: () => CalendarImpl,
): CalendarRecord {
  const instance = Object.create(CalendarRecord.prototype)
  const slots = { id, getImpl }
  setCalendarSlots(instance, slots)
  attachDebugString(instance, slots, (slots) => slots.id)
  return instance
}

export function getCalendarRecordId(record: CalendarRecord): string {
  return getCalendarSlots(record).id
}

/*
If caller simply wants to validate that record holds a known calendar,
can simply call this and discard the result
*/
export function getCalendarRecordImplCreator(
  record: CalendarRecord,
): () => CalendarImpl {
  const getImpl = getCalendarSlots(record).getImpl
  if (!getImpl) {
    throw new RangeError(
      errorMessages.exoticCalendarRequired(
        getCalendarRecordId(record),
        'getExotic or getAny',
      ),
    )
  }
  return getImpl
}
