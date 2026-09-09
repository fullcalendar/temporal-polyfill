import {
  DateFields,
  DateTimeFields,
  DayFields,
  MonthDayFields,
} from '../internal/fieldTypes'
import type { RoundingMathOptions, RoundingMode } from './index'

export type DateTimeFormatLike<R> = Omit<
  Intl.DateTimeFormat,
  'format' | 'formatToParts' | 'formatRange' | 'formatRangeToParts'
> & {
  format(record: R): string
  formatToParts(record: R): Intl.DateTimeFormatPart[]
  formatRange(record0: R, record1: R): string
  formatRangeToParts(
    record0: R,
    record1: R,
  ): ReturnType<Intl.DateTimeFormat['formatRangeToParts']>
}

// temporal-spec can't be used as-is because plainTime is a *record* here
export type PlainDateToZonedDateTimeOptions<PlainTimeRecord> = {
  timeZone: string
  plainTime?: PlainTimeRecord
}

export type RelativeToRecord<
  ZonedDateTimeRecord,
  PlainDateTimeRecord,
  PlainDateRecord,
> = ZonedDateTimeRecord | PlainDateTimeRecord | PlainDateRecord

export type NativeDiffFunc<T> = (
  record0: T,
  record1: T,
  options?: RoundingMathOptions | RoundingMode,
) => number

// Field bags accepted by fromFields. temporal-spec's *LikeObject types can't
// be used as-is because calendar is a *record* here, but they agree on shape:
// anything with a day requires it (PlainDate, PlainDateTime, PlainMonthDay,
// ZonedDateTime), while PlainYearMonth's bag stays fully optional.
export type DateFromFields<CalendarRecord> = Partial<DateFields> &
  DayFields & {
    calendar?: CalendarRecord
  }

export type DateTimeFromFields<CalendarRecord> = Partial<DateTimeFields> &
  DayFields & {
    calendar?: CalendarRecord
  }

export type MonthDayFromFields<CalendarRecord> = Partial<MonthDayFields> &
  DayFields & {
    calendar?: CalendarRecord
  }

export type ZonedDateTimeFields<CalendarRecord> = Partial<DateTimeFields> &
  DayFields & {
    calendar?: CalendarRecord
    offset?: string
    timeZone: string
  }
