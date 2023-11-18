
/*
Will fullcalendar's application of this cause space-savings?
YES:
- no YearMonth/MonthDay logic
- optional Zoned logic...
  NO: still need to convert inputted LegacyDate/string to PlainDateTime, and need zone
  WILL NEED:
    const pdt = ZonedDateTimeFns.toPlainDateTime(
      ZonedDateTimeFns.fromString(
        str + (strHasTimeZone(str) ? '' : `[${defaultTimeZone}]`)
      )
    )
    // NOTE: PlainDateTimeFns.fromString throws away timezone/offset info,
    // so it's not usable

WE'RE NOT ALLOWING CalendarProtocol or TimeZoneProtocol because they accept
Temporal objects, creating them will break tree-shaking

ALSO, we don't like complex Calendar or TimeZone objects because they have a lot of functionality
all bundled together, making it impossible to tree shake
*/

import { calendarImplDateAdd, createCalendarImplRecord } from "../internal/calendarRecordSimple"
import { moveDateEasy } from "../internal/move"
import { OverflowOptions } from "../internal/options"
import { DurationSlots } from "../public/slots"

/*
NOTE: the inputted `slots.calendar` must always be a string! (NOT a CalendarProtocol)
*/

export function fromString(s: string, options: any) {
}

export function fromFields(fields: any, options: any) {
}

//// slots already have this. only useful for ZonedDateTime
// export function getISOFields(slots: any) {
// }

// era/eraYear/year/month/monthCode/day (not calendar)
export function getFields(slots: any) {
}

export function withFields(slots: any, newFields: any, options: any) {
}

export function withCalendar(slots: any, calendarArg: any) {
}

export function add(
  slots: any, // PlainDateSlots, but with STRING calendar ONLY
  durationSlots: DurationSlots,
  options?: OverflowOptions,
) {
  const calendarRecord = createCalendarImplRecord(slots.calendar, {
    dateAdd: calendarImplDateAdd
  })

  return {
    ...slots,
    ...moveDateEasy(
      calendarRecord,
      slots,
      durationSlots,
      options,
    ),
  }
}

export function subtract(slots: any, durationSlots: any, options: any) {
}

export function until(slots0: any, slots1: any, options: any) {
}

export function since(slots0: any, slots1: any, options: any) {
}

export function compare(slots0: any, slots1: any) {
}

export function equals(slots0: any, slots1: any) {
}

export function toString(slots: any, options: any) {
}

export function toZonedDateTime(slots: any, options: any) {
}

export function toPlainDateTime(slots: any) {
}

export function toPlainYearMonth(slots: any) {
}

export function toPlainMonthDay(slots: any) {
}
