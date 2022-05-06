
import { Calendar } from './calendar'
import { Duration } from './duration'
import { Instant } from './instant'
import { Now } from './now'
import { PlainDate } from './plainDate'
import { PlainDateTime } from './plainDateTime'
import { PlainMonthDay } from './plainMonthDay'
import { PlainTime } from './plainTime'
import { PlainYearMonth } from './plainYearMonth'
import { TimeZone } from './timeZone'
import { ZonedDateTime } from './zonedDateTime'

export const Temporal = {
  PlainYearMonth,
  PlainMonthDay,
  PlainDate,
  PlainTime,
  PlainDateTime,
  ZonedDateTime,
  Instant,
  Calendar,
  TimeZone,
  Duration,
  Now,
  [Symbol.toStringTag]: 'Temporal', // TODO: make readonly, dry with attachStringTag?
}
