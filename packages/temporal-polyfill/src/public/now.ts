import { isoCalendarID } from '../calendarImpl/isoCalendarImpl'
import { ensureObj } from '../dateUtils/abstract'
import { attachStringTag } from '../dateUtils/mixins'
import { ISODateTimeFields } from '../dateUtils/typesPrivate'
import { nanoInMilliBI } from '../dateUtils/units'
import { OrigDateTimeFormat } from '../native/intlUtils'
import { Calendar } from './calendar'
import { Instant } from './instant'
import { PlainDate, createDate } from './plainDate'
import { PlainDateTime, createDateTime } from './plainDateTime'
import { PlainTime, createTime } from './plainTime'
import { TimeZone } from './timeZone'
import { CalendarArg, TimeZoneArg } from './types'
import {
  ZonedDateTime,
  buildZonedDateTimeISOFields,
  createZonedDateTimeFromFields,
} from './zonedDateTime'

const Now = {
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
attachStringTag(Now, 'Now')

export { Now }

function getZonedDateTimeISO(timeZoneArg?: TimeZoneArg): ZonedDateTime {
  return createZonedDateTimeFromFields(buidZonedFields(isoCalendarID, timeZoneArg))
}

function getZonedDateTime(calendarArg: CalendarArg, timeZoneArg?: TimeZoneArg): ZonedDateTime {
  return createZonedDateTimeFromFields(buidZonedFields(calendarArg, timeZoneArg))
}

function getPlainDateTimeISO(timeZoneArg?: TimeZoneArg): PlainDateTime {
  return createDateTime(buidZonedFields(isoCalendarID, timeZoneArg))
}

function getPlainDateTime(calendarArg: CalendarArg, timeZoneArg?: TimeZoneArg): PlainDateTime {
  return createDateTime(buidZonedFields(calendarArg, timeZoneArg))
}

function getPlainDateISO(timeZoneArg: TimeZoneArg): PlainDate {
  return createDate(buidZonedFields(isoCalendarID, timeZoneArg))
}

function getPlainDate(calendarArg: CalendarArg, timeZoneArg?: TimeZoneArg): PlainDate {
  return createDate(buidZonedFields(calendarArg, timeZoneArg))
}

function getPlainTimeISO(timeZoneArg: TimeZoneArg): PlainTime {
  return createTime(buidZonedFields(isoCalendarID, timeZoneArg))
}

function getInstant(): Instant {
  return new Instant(getEpochNano())
}

function getTimeZone(): TimeZone {
  return new TimeZone(new OrigDateTimeFormat().resolvedOptions().timeZone)
}

// utils

function buidZonedFields(
  calendarArg: CalendarArg,
  timeZoneArg: TimeZoneArg = getTimeZone(),
): ISODateTimeFields & { timeZone: TimeZone, calendar: Calendar } {
  const timeZone = ensureObj(TimeZone, timeZoneArg)
  return {
    ...buildZonedDateTimeISOFields(getEpochNano(), timeZone)[0],
    // build these in to buildZonedDateTimeISOFields?
    timeZone,
    calendar: ensureObj(Calendar, calendarArg),
  }
}

function getEpochNano(): bigint {
  return BigInt(Date.now()) * nanoInMilliBI
}
