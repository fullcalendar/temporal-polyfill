import { isoCalendarId } from './calendarConfig'
import { getObjId } from './class'
import { alwaysI, autoI, criticalI, refineDateDisplayOptions } from './options'

/*
High-level. Refined options
*/
export function formatPossibleDate(internals, options, formatSimple) {
  const calendarDisplayI = refineDateDisplayOptions(options)
  const showCalendar =
    calendarDisplayI === alwaysI || // TODO: use math >=< comparisons?
    calendarDisplayI === criticalI ||
    getObjId(internals.calendar) !== isoCalendarId

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
  showSecond,
  subsecDigits,
) {
  return formatIsoDateFields(isoDateTimeFields) +
    'T' + formatIsoTimeFields(isoDateTimeFields, showSecond, subsecDigits)
}

export function formatIsoTimeFields(
  isoTimeFields,
  showSecond,
  subsecDigits,
) {
}

export function formatDurationInternals(
  durationInternals,
  showSecond,
  subsecDigits,
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
