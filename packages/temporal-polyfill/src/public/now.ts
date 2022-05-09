import { Temporal } from 'temporal-spec'
import { isoCalendarID } from '../calendarImpl/isoCalendarImpl'
import { ensureObj } from '../dateUtils/abstract'
import { ISODateTimeFields } from '../dateUtils/isoFields'
import { attachStringTag } from '../dateUtils/mixins'
import { nanoInMilli } from '../dateUtils/units'
import { OrigDateTimeFormat } from '../native/intlUtils'
import { LargeInt, createLargeInt } from '../utils/largeInt'
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

const _Now = {
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

attachStringTag(_Now, 'Now')

export const Now = _Now as (typeof _Now & { [Symbol.toStringTag]: 'Temporal.Now' })

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

function getEpochNano(): LargeInt {
  return createLargeInt(Date.now()).mult(nanoInMilli)
}
