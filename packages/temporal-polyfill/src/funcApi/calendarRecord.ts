import { CalendarBranding } from '../apiHelpers/branding'
import {
  attachDebugString,
  defineTemporalClass,
} from '../apiHelpers/classStyle'
import { CalendarImpl } from '../internal/calendarImpl'
import * as errorMessages from '../internal/errorMessages'
import { throwRangeError } from '../internal/utils'
import type * as RecordTypes from './recordTypes'
import { getCalendarSlots, setCalendarSlots } from './temporalRecords'

export type CalendarRecord = InstanceType<typeof CalendarRecord>
export const CalendarRecord = defineTemporalClass(
  CalendarBranding,
  class implements RecordTypes.CalendarRecord {
    declare readonly [RecordTypes.CalendarRecordBrand]: undefined

    toJSON(): string {
      return getCalendarRecordId(this)
    }

    valueOf(): string {
      return getCalendarRecordId(this)
    }
  },
)

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
  attachDebugString(instance)
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
    throwRangeError(
      errorMessages.exoticCalendarRequired(
        getCalendarRecordId(record),
        'getExotic or getAny',
      ),
    )
  }
  return getImpl
}
