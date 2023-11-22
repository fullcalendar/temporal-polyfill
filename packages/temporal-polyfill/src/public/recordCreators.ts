import { calendarImplDateAdd, calendarImplDateFromFields, calendarImplDateUntil, calendarImplFields, calendarImplMergeFields, calendarImplMonthDayFromFields, calendarImplYearMonthFromFields } from '../internal/calendarRecordSimple'
import { timeZoneImplGetOffsetNanosecondsFor, timeZoneImplGetPossibleInstantsFor } from '../internal/timeZoneRecordSimple'
import { calendarProtocolDateAdd, calendarProtocolDateFromFields, calendarProtocolDateUntil, calendarProtocolFields, calendarProtocolMergeFields, calendarProtocolMonthDayFromFields, calendarProtocolYearMonthFromFields, createCalendarSlotRecord } from './calendarRecordComplex'
import { CalendarSlot } from './calendarSlot'
import { TimeZoneSlot } from './timeZoneSlot'
import { createTimeZoneSlotRecord, timeZoneProtocolGetOffsetNanosecondsFor, timeZoneProtocolGetPossibleInstantsFor } from './timeZoneRecordComplex'

// TODO: put types in here too

export function getDateModCalendarRecord(calendarSlot: CalendarSlot) {
  return createCalendarSlotRecord(calendarSlot, {
    dateFromFields: calendarImplDateFromFields,
    fields: calendarImplFields,
    mergeFields: calendarImplMergeFields,
  }, {
    dateFromFields: calendarProtocolDateFromFields,
    fields: calendarProtocolFields,
    mergeFields: calendarProtocolMergeFields,
  })
}

export function getMoveCalendarRecord(calendarSlot: CalendarSlot) {
  return createCalendarSlotRecord(calendarSlot, {
    dateAdd: calendarImplDateAdd,
  }, {
    dateAdd: calendarProtocolDateAdd,
  })
}

export function getDiffCalendarRecord(calendarSlot: CalendarSlot) {
  return createCalendarSlotRecord(calendarSlot, {
    dateAdd: calendarImplDateAdd,
    dateUntil: calendarImplDateUntil,
  }, {
    dateAdd: calendarProtocolDateAdd,
    dateUntil: calendarProtocolDateUntil,
  })
}

export function createTypicalTimeZoneRecord(timeZoneSlot: TimeZoneSlot) {
  return createTimeZoneSlotRecord(timeZoneSlot, {
    getOffsetNanosecondsFor: timeZoneImplGetOffsetNanosecondsFor,
    getPossibleInstantsFor: timeZoneImplGetPossibleInstantsFor,
  }, {
    getOffsetNanosecondsFor: timeZoneProtocolGetOffsetNanosecondsFor,
    getPossibleInstantsFor: timeZoneProtocolGetPossibleInstantsFor,
  })
}

export function createYearMonthNewCalendarRecord(calendarSlot: CalendarSlot) {
  return createCalendarSlotRecord(calendarSlot, {
    yearMonthFromFields: calendarImplYearMonthFromFields,
    fields: calendarImplFields,
  }, {
    yearMonthFromFields: calendarProtocolYearMonthFromFields,
    fields: calendarProtocolFields,
  })
}

export function createMonthDayNewCalendarRecord(calendarSlot: CalendarSlot) {
  return createCalendarSlotRecord(calendarSlot, {
    monthDayFromFields: calendarImplMonthDayFromFields,
    fields: calendarImplFields,
  }, {
    monthDayFromFields: calendarProtocolMonthDayFromFields,
    fields: calendarProtocolFields,
  })
}

export function createDateNewCalendarRecord(calendarSlot: CalendarSlot) {
  return createCalendarSlotRecord(calendarSlot, {
    dateFromFields: calendarImplDateFromFields,
    fields: calendarImplFields,
  }, {
    dateFromFields: calendarProtocolDateFromFields,
    fields: calendarProtocolFields,
  })
}
