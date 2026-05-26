import * as errorMessages from '../../internal/errorMessages'
import { isCalendarShimRecord } from './calendar'
import { getDurationShimRecordSlotsIfPresent } from './duration'
import { getInstantShimRecordSlotsIfPresent } from './instant'
import { getPlainDateShimRecordSlotsIfPresent } from './plainDate'
import { getPlainDateTimeShimRecordSlotsIfPresent } from './plainDateTime'
import { getPlainMonthDayShimRecordSlotsIfPresent } from './plainMonthDay'
import { getPlainTimeShimRecordSlotsIfPresent } from './plainTime'
import { getPlainYearMonthShimRecordSlotsIfPresent } from './plainYearMonth'
import { getZonedDateTimeShimRecordSlotsIfPresent } from './zonedDateTime'

function isShimRecord(record: unknown): boolean {
  return (
    isCalendarShimRecord(record) ||
    !!getInstantShimRecordSlotsIfPresent(record) ||
    !!getZonedDateTimeShimRecordSlotsIfPresent(record) ||
    !!getPlainDateTimeShimRecordSlotsIfPresent(record) ||
    !!getPlainDateShimRecordSlotsIfPresent(record) ||
    !!getPlainTimeShimRecordSlotsIfPresent(record) ||
    !!getPlainYearMonthShimRecordSlotsIfPresent(record) ||
    !!getPlainMonthDayShimRecordSlotsIfPresent(record) ||
    !!getDurationShimRecordSlotsIfPresent(record)
  )
}

export function rejectInvalidBag<B>(bag: B): B {
  if (
    isShimRecord(bag) ||
    // RejectObjectWithCalendarOrTimeZone is a public property-bag guard.
    // It deliberately observes the spec field names even though internal
    // slots store internal calendar/time-zone objects, but public bags still
    // use the spec property names.
    (bag as any).calendar !== undefined ||
    (bag as any).timeZone !== undefined
  ) {
    throw new TypeError(errorMessages.invalidBag)
  }
  return bag
}
