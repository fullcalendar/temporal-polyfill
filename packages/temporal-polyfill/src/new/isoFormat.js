import { isoCalendarId } from './calendarConfig'
import { getObjId } from './class'
import { refineDateDisplayOptions } from './options'

export function formatPossibleDate(internals, options, formatSimple) {
  const calendarDisplay = refineDateDisplayOptions(options)
  const showCalendar =
    calendarDisplay === 'always' || // TODO: use indexes
    calendarDisplay === 'critical' ||
    getObjId(internals.calendar) !== isoCalendarId

  if (showCalendar) {
    return formatIsoDateFields(internals) +
      formatCalendarWithSingleOpt(internals.calendar, calendarDisplay)
  } else {
    return formatSimple(internals)
  }
}

export function formatIsoDateTimeFields(
  isoDateTimeFields,
  options, // TODO: use spread args
) {
  return formatIsoDateFields(isoDateTimeFields) +
    'T' + formatIsoTimeFields(isoDateTimeFields, options)
}

export function formatIsoDateFields(isoDateFields) {

}

export function formatIsoYearMonthFields(isoDateFields) {

}

export function formatIsoMonthDayFields(isoDateFields) {

}

export function formatIsoTimeFields(
  isoTimeFields,
  options, // TODO: use spread args
) {
  // smallestUnit will be <= MINUTE (meaning minute ALWAYS displayed)
}

export function formatOffsetNanoseconds(
  offsetNanoseconds,
  options, // TODO: use spread args
) {

}

export function formatTimeZone(
  timeZoneProtocol,
  options, // TODO: use spread args
) {

}

export function formatCalendar(
  calendarProtocol,
  options, // TODO: use spread args
) {
  return formatCalendarWithSingleOpt(calendarProtocol, refineDateDisplayOptions(options))
}

function formatCalendarWithSingleOpt(calendarProtocol, calendarNameOptIndex) {

}

export function formatDurationInternals(
  durationInternals,
  options, // TODO: use spread args
) {

}
