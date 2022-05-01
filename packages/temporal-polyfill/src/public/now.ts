import { Temporal } from 'temporal-spec'
import { isoCalendarID } from '../calendarImpl/isoCalendarImpl'
import { ensureObj } from '../dateUtils/abstract'
import { ISODateTimeFields } from '../dateUtils/isoFields'
import { nanoInMilliBI } from '../dateUtils/units'
import { OrigDateTimeFormat } from '../native/intlUtils'
import { Calendar } from './calendar'
import { Instant } from './instant'
import { createDate } from './plainDate'
import { createDateTime } from './plainDateTime'
import { createTime } from './plainTime'
import { TimeZone } from './timeZone'
import {
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
  [Symbol.toStringTag]: 'Temporal.Now' as ('Temporal.Now'), // TODO: make readonly
}

export { Now }

function getZonedDateTimeISO(timeZoneArg?: Temporal.TimeZoneLike): Temporal.ZonedDateTime {
  return createZonedDateTimeFromFields(buidZonedFields(isoCalendarID, timeZoneArg))
}

function getZonedDateTime(
  calendarArg: Temporal.CalendarLike,
  timeZoneArg?: Temporal.TimeZoneLike,
): Temporal.ZonedDateTime {
  return createZonedDateTimeFromFields(buidZonedFields(calendarArg, timeZoneArg))
}

function getPlainDateTimeISO(timeZoneArg?: Temporal.TimeZoneLike): Temporal.PlainDateTime {
  return createDateTime(buidZonedFields(isoCalendarID, timeZoneArg))
}

function getPlainDateTime(
  calendarArg: Temporal.CalendarLike,
  timeZoneArg?: Temporal.TimeZoneLike,
): Temporal.PlainDateTime {
  return createDateTime(buidZonedFields(calendarArg, timeZoneArg))
}

function getPlainDateISO(timeZoneArg?: Temporal.TimeZoneLike): Temporal.PlainDate {
  return createDate(buidZonedFields(isoCalendarID, timeZoneArg))
}

function getPlainDate(
  calendarArg: Temporal.CalendarLike,
  timeZoneArg?: Temporal.TimeZoneLike,
): Temporal.PlainDate {
  return createDate(buidZonedFields(calendarArg, timeZoneArg))
}

function getPlainTimeISO(timeZoneArg?: Temporal.TimeZoneLike): Temporal.PlainTime {
  return createTime(buidZonedFields(isoCalendarID, timeZoneArg))
}

function getInstant(): Temporal.Instant {
  return new Instant(getEpochNano())
}

function getTimeZone(): Temporal.TimeZone {
  return new TimeZone(new OrigDateTimeFormat().resolvedOptions().timeZone)
}

// utils

function buidZonedFields(
  calendarArg: Temporal.CalendarLike,
  timeZoneArg: Temporal.TimeZoneLike = getTimeZone(),
): ISODateTimeFields & {
    timeZone: Temporal.TimeZoneProtocol,
    calendar: Temporal.CalendarProtocol,
  } {
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
