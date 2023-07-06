import { isoCalendarId } from './calendarConfig'
import { alwaysI, autoI, criticalI, refineDateDisplayOptions } from './options'

/*
High-level. Refined options
*/
export function formatPossibleDate(formatSimple, internals, options) {
  const calendarDisplayI = refineDateDisplayOptions(options)
  const showCalendar =
    calendarDisplayI === alwaysI || // TODO: use math >=< comparisons?
    calendarDisplayI === criticalI ||
    internals.calendar.id !== isoCalendarId

  if (showCalendar) {
    return formatIsoDateFields(internals) + formatCalendar(internals.calendar, calendarDisplayI)
  } else {
    return formatSimple(internals)
  }
}

/*
Rounding already happened with these...
*/

export function formatIsoDateFields(isoDateFields) {
}

export function formatIsoYearMonthFields(isoDateFields) {
}

export function formatIsoMonthDayFields(isoDateFields) {
}

export function formatIsoDateTimeFields(
  isoDateTimeFields,
  subsecDigits,
) {
  return formatIsoDateFields(isoDateTimeFields) +
    'T' + formatIsoTimeFields(isoDateTimeFields, subsecDigits)
}

export function formatIsoTimeFields(
  isoTimeFields,
  subsecDigits, // undefined/-1/#
) {
}

export function formatDurationInternals(
  durationInternals,
  subsecDigits, // undefined/-1/#
) {
}

export function formatOffsetNano(
  offsetNanoseconds,
  offsetDisplayI = autoI, // auto/never
) {
}

export function formatTimeZone(
  timeZoneOps,
  timeZoneDisplayI,
) {
}

export function formatCalendar(
  calendarOps,
  calendarDisplayI,
) {
}
