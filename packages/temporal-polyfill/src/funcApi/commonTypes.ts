import { DateTimeFields } from '../internal/fieldTypes'

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

// temporal-spec can't be used as-is because calendar is a *record* here
export type ZonedDateTimeFields<CalendarRecord> = Partial<DateTimeFields> & {
  calendar?: CalendarRecord
  offset?: string
  timeZone: string
}
