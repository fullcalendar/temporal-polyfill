import { DateTimeFields } from '../internal/fieldTypes'

export interface DateTimeFormatLike<R> {
  format(record: R): string
  formatToParts(record: R): Intl.DateTimeFormatPart[]
  formatRange(record0: R, record1: R): string
  formatRangeToParts(
    record0: R,
    record1: R,
  ): ReturnType<Intl.DateTimeFormat['formatRangeToParts']>
  resolvedOptions(): Intl.ResolvedDateTimeFormatOptions
}

export type ToZonedDateTimeOptions<PlainTimeRecord> = {
  timeZone: string
  plainTime?: PlainTimeRecord
}

export type RelativeToRecord<
  ZonedDateTimeRecord,
  PlainDateTimeRecord,
  PlainDateRecord,
> = ZonedDateTimeRecord | PlainDateTimeRecord | PlainDateRecord

export type ZonedDateTimeFields<CalendarRecord> = Partial<DateTimeFields> & {
  calendar?: CalendarRecord
  offset?: string
  timeZone: string
}
