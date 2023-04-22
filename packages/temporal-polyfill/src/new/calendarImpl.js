
/*
If we don't use a class, we can pile-in iso util methods like:
- getIsoDayOfWeek
*/

export class CalendarImpl {
  era(isoDateFields) {
    // return string
  }

  eraYear(isoDateFields) {
    // return number
  }

  year(isoDateFields) {
    // return number
  }

  month(isoDateFields) {
    // return number
  }

  monthCode(isoDateFields) {
    // return string
  }

  day(isoDateFields) {
    // return number
  }

  dayOfWeek(isoDateFields) {
    // return number
  }

  dayOfYear(isoDateFields) {
    // return number
  }

  weekOfYear(isoDateFields) {
    // return number
  }

  yearOfWeek(isoDateFields) {
    // return number
  }

  daysInWeek(isoDateFields) {
    // return number
  }

  daysInMonth(isoDateFields) {
    // return number
  }

  daysInYear(isoDateFields) {
    // return number
  }

  monthsInYear(isoDateFields) {
    // return number
  }

  inLeapYear(isoDateFields) {
    // return boolean
  }

  // should return IsoFields+calendar props!
  dateFromFields(fields, overflow) {
    // return isoDateFields
  }

  // should return IsoFields+calendar props!
  yearMonthFromFields(fields, overflow) {
    // return isoDateFields. should be very similar to what's already in calendar.ts
  }

  // should return IsoFields+calendar props!
  monthDayFromFields(fields, overflow) {
    // return isoDateFields. should be very similar to what's already in calendar.ts
  }

  // should return IsoFields+calendar props!
  dateAdd(isoDateFields, durationFields, overflow) {
    // return isoDateFields
  }

  dateUntil(startIsoDateFields, endIsoDateFields, largestUnit) {
    // return durationFields
  }

  fields(fieldNames) {
    // return string[]
  }

  mergeFields(baseFieldNames, additionalFieldNames) {
    // return object
  }
}
