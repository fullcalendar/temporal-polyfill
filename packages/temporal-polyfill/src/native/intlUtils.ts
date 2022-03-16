import { Instant } from '../public/instant'
import { PlainDate } from '../public/plainDate'
import { PlainDateTime } from '../public/plainDateTime'
import { PlainMonthDay } from '../public/plainMonthDay'
import { PlainTime } from '../public/plainTime'
import { PlainYearMonth } from '../public/plainYearMonth'
import { LocalesArg } from '../public/types'
import { ZonedDateTime } from '../public/zonedDateTime'

export interface DateTimeFormatRangePart extends Intl.DateTimeFormatPart {
  source: 'startDate' | 'endDate'
}

export type DateTimeFormatArg =
  number |
  Date |
  Instant |
  ZonedDateTime |
  PlainDateTime |
  PlainDate |
  PlainYearMonth |
  PlainMonthDay |
  PlainTime

// TODO: unify this as a class/const, to just export DateTimeFormat,
// and have whole src reference it only, not Intl.DateTimeFormat
export const OrigDateTimeFormat = Intl.DateTimeFormat

export function normalizeAndCopyLocalesArg(localesArg: LocalesArg | undefined): string[] {
  return ([] as string[]).concat(localesArg || [])
}
