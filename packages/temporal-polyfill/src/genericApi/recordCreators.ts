import { calendarImplDateAdd, calendarImplDateFromFields, calendarImplDateUntil, calendarImplDay, calendarImplDaysInMonth, calendarImplFields, calendarImplMergeFields, calendarImplMonthDayFromFields, calendarImplYearMonthFromFields, createCalendarImplRecord } from './calendarRecordSimple'
import { createTimeZoneImplRecord, timeZoneImplGetOffsetNanosecondsFor, timeZoneImplGetPossibleInstantsFor } from './timeZoneRecordSimple'

// date
// ----

export function createDateNewCalendarRecordIMPL(calendarId: string) {
  return createCalendarImplRecord(calendarId, {
    dateFromFields: calendarImplDateFromFields,
    fields: calendarImplFields,
  })
}

export function getDateModCalendarRecordIMPL(calendarId: string) {
  return createCalendarImplRecord(calendarId, {
    dateFromFields: calendarImplDateFromFields,
    fields: calendarImplFields,
    mergeFields: calendarImplMergeFields,
  })
}

export function getMoveCalendarRecordIMPL(calendarId: string) {
  return createCalendarImplRecord(calendarId, {
    dateAdd: calendarImplDateAdd,
  })
}

export function getDiffCalendarRecordIMPL(calendarId: string) {
  return createCalendarImplRecord(calendarId, {
    dateAdd: calendarImplDateAdd,
    dateUntil: calendarImplDateUntil,
  })
}

// year month
// ----------

export function createYearMonthNewCalendarRecordIMPL(calendarId: string) {
  return createCalendarImplRecord(calendarId, {
    yearMonthFromFields: calendarImplYearMonthFromFields,
    fields: calendarImplFields,
  })
}

export function createYearMonthModCalendarRecordIMPL(calendarId: string) {
  return createCalendarImplRecord(calendarId, {
    yearMonthFromFields: calendarImplYearMonthFromFields,
    fields: calendarImplFields,
    mergeFields: calendarImplMergeFields,
  })
}

export function createYearMonthMoveCalendarRecordIMPL(calendarId: string) {
  return createCalendarImplRecord(calendarId, {
    dateAdd: calendarImplDateAdd,
    daysInMonth: calendarImplDaysInMonth,
    day: calendarImplDay,
  })
}

export function createYearMonthDiffCalendarRecordIMPL(calendarId: string) {
  return createCalendarImplRecord(calendarId, {
    dateAdd: calendarImplDateAdd,
    dateUntil: calendarImplDateUntil,
    day: calendarImplDay,
  })
}

// month day
// ---------

export function createMonthDayNewCalendarRecordIMPL(calendarId: string) {
  return createCalendarImplRecord(calendarId, {
    monthDayFromFields: calendarImplMonthDayFromFields,
    fields: calendarImplFields,
  })
}

export function createMonthDayModCalendarRecordIMPL(calendarId: string) {
  return createCalendarImplRecord(calendarId, {
    monthDayFromFields: calendarImplMonthDayFromFields,
    fields: calendarImplFields,
    mergeFields: calendarImplMergeFields,
  })
}

// time zone
// ---------

export function createTypicalTimeZoneRecordIMPL(timeZoneSlot: string) {
  return createTimeZoneImplRecord(timeZoneSlot, {
    getOffsetNanosecondsFor: timeZoneImplGetOffsetNanosecondsFor,
    getPossibleInstantsFor: timeZoneImplGetPossibleInstantsFor,
  })
}

export function createSimpleTimeZoneRecordIMPL(timeZoneSlot: string) {
  return createTimeZoneImplRecord(timeZoneSlot, {
    getOffsetNanosecondsFor: timeZoneImplGetOffsetNanosecondsFor,
  })
}
