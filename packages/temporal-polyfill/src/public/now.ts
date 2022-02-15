import { OrigDateTimeFormat } from '../native/intl'
import { nanoInMicroBI } from '../dateUtils/units'
import { Instant } from './instant'
import { PlainDate } from './plainDate'
import { PlainDateTime } from './plainDateTime'
import { PlainTime } from './plainTime'
import { TimeZone } from './timeZone'
import { CalendarArg, TimeZoneArg } from './types'
import { ZonedDateTime } from './zonedDateTime'

function getZonedDateTimeISO(timeZoneArg: TimeZoneArg = getTimeZone()): ZonedDateTime {
  return getInstant().toZonedDateTimeISO(timeZoneArg)
}

function getZonedDateTime(calendarArg: CalendarArg, timeZoneArg?: TimeZoneArg): ZonedDateTime {
  if (calendarArg === undefined) {
    throw new RangeError('Must specify calendar') // bad
  }
  return getInstant().toZonedDateTime({
    calendar: calendarArg,
    timeZone: timeZoneArg ?? getTimeZone(),
  })
}

function getPlainDateTimeISO(timeZoneArg: TimeZoneArg = getTimeZone()): PlainDateTime {
  return getZonedDateTimeISO(timeZoneArg).toPlainDateTime()
}

function getPlainDateTime(calendarArg: CalendarArg, timeZoneArg?: TimeZoneArg): PlainDateTime {
  return getZonedDateTime(calendarArg, timeZoneArg).toPlainDateTime()
}

function getPlainDateISO(timeZoneArg: TimeZoneArg = getTimeZone()): PlainDate {
  return getPlainDateTimeISO(timeZoneArg).toPlainDate()
}

function getPlainDate(calendarArg: CalendarArg, timeZoneArg?: TimeZoneArg): PlainDate {
  return getPlainDateTime(calendarArg, timeZoneArg).toPlainDate()
}

function getPlainTimeISO(timeZoneArg: TimeZoneArg = getTimeZone()): PlainTime {
  return getInstant().toZonedDateTimeISO(timeZoneArg).toPlainTime()
}

function getInstant(): Instant {
  return new Instant(BigInt(Date.now()) * nanoInMicroBI)
}

function getTimeZone(): TimeZone {
  return new TimeZone(new OrigDateTimeFormat().resolvedOptions().timeZone)
}

export const Now = {
  zonedDateTimeISO: getZonedDateTimeISO,
  zonedDateTime: getZonedDateTime,
  plainDateTimeISO: getPlainDateTimeISO,
  plainDateTime: getPlainDateTime,
  plainDateISO: getPlainDateISO,
  plainDate: getPlainDate,
  plainTimeISO: getPlainTimeISO,
  instant: getInstant,
  timeZone: getTimeZone,
}
