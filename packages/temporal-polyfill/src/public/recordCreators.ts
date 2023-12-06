import { calendarImplDateAdd, calendarImplDateFromFields, calendarImplDateUntil, calendarImplDay, calendarImplDaysInMonth, calendarImplFields, calendarImplMergeFields, calendarImplMonthDayFromFields, calendarImplYearMonthFromFields } from '../genericApi/calendarRecordSimple'
import { calendarProtocolDateAdd, calendarProtocolDateFromFields, calendarProtocolDateUntil, calendarProtocolDay, calendarProtocolDaysInMonth, calendarProtocolFields, calendarProtocolMergeFields, calendarProtocolMonthDayFromFields, calendarProtocolYearMonthFromFields, createCalendarSlotRecord } from './calendarRecordComplex'
import { CalendarSlot } from './calendarSlot'
import { TimeZoneSlot } from './timeZoneSlot'
import { createTimeZoneSlotRecord, timeZoneProtocolGetOffsetNanosecondsFor, timeZoneProtocolGetPossibleInstantsFor } from './timeZoneRecordComplex'

// date
// ----

export function createDateNewCalendarRecord(calendarSlot: CalendarSlot) {
  return createCalendarSlotRecord(calendarSlot, {
    dateFromFields: calendarImplDateFromFields,
    fields: calendarImplFields,
  }, {
    dateFromFields: calendarProtocolDateFromFields,
    fields: calendarProtocolFields,
  })
}

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

// year month
// ----------

export function createYearMonthNewCalendarRecord(calendarSlot: CalendarSlot) {
  return createCalendarSlotRecord(calendarSlot, {
    yearMonthFromFields: calendarImplYearMonthFromFields,
    fields: calendarImplFields,
  }, {
    yearMonthFromFields: calendarProtocolYearMonthFromFields,
    fields: calendarProtocolFields,
  })
}

export function createYearMonthModCalendarRecord(calendarSlot: CalendarSlot) {
  return createCalendarSlotRecord(calendarSlot, {
    yearMonthFromFields: calendarImplYearMonthFromFields,
    fields: calendarImplFields,
    mergeFields: calendarImplMergeFields,
  }, {
    yearMonthFromFields: calendarProtocolYearMonthFromFields,
    fields: calendarProtocolFields,
    mergeFields: calendarProtocolMergeFields,
  })
}

export function createYearMonthMoveCalendarRecord(calendarSlot: CalendarSlot) {
  return createCalendarSlotRecord(calendarSlot, {
    dateAdd: calendarImplDateAdd,
    daysInMonth: calendarImplDaysInMonth,
    day: calendarImplDay,
  }, {
    dateAdd: calendarProtocolDateAdd,
    daysInMonth: calendarProtocolDaysInMonth,
    day: calendarProtocolDay,
  })
}

export function createYearMonthDiffCalendarRecord(calendarSlot: CalendarSlot) {
  return createCalendarSlotRecord(calendarSlot, {
    dateAdd: calendarImplDateAdd,
    dateUntil: calendarImplDateUntil,
    day: calendarImplDay,
  }, {
    dateAdd: calendarProtocolDateAdd,
    dateUntil: calendarProtocolDateUntil,
    day: calendarProtocolDay,
  })
}

// month day
// ---------

export function createMonthDayNewCalendarRecord(calendarSlot: CalendarSlot) {
  return createCalendarSlotRecord(calendarSlot, {
    monthDayFromFields: calendarImplMonthDayFromFields,
    fields: calendarImplFields,
  }, {
    monthDayFromFields: calendarProtocolMonthDayFromFields,
    fields: calendarProtocolFields,
  })
}

export function createMonthDayModCalendarRecord(calendarSlot: CalendarSlot) {
  return createCalendarSlotRecord(calendarSlot, {
    monthDayFromFields: calendarImplMonthDayFromFields,
    fields: calendarImplFields,
    mergeFields: calendarImplMergeFields,
  }, {
    monthDayFromFields: calendarProtocolMonthDayFromFields,
    fields: calendarProtocolFields,
    mergeFields: calendarProtocolMergeFields,
  })
}

// time zone
// ---------

export function createTypicalTimeZoneRecord(timeZoneSlot: TimeZoneSlot) {
  return createTimeZoneSlotRecord(timeZoneSlot, {
    getOffsetNanosecondsFor: timeZoneProtocolGetOffsetNanosecondsFor,
    getPossibleInstantsFor: timeZoneProtocolGetPossibleInstantsFor,
  })
}

export function createSimpleTimeZoneRecord(timeZoneSlot: TimeZoneSlot) {
  return createTimeZoneSlotRecord(timeZoneSlot, {
    getOffsetNanosecondsFor: timeZoneProtocolGetOffsetNanosecondsFor,
  })
}
