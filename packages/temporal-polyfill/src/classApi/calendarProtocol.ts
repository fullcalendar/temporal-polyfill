import { DateBagStrict, MonthDayBagStrict, YearMonthBagStrict } from '../internal/calendarFields'
import { LargestUnitOptions, OverflowOptions } from '../internal/optionsRefine'
import { PlainDate, PlainDateArg } from './plainDate'
import { PlainMonthDay } from './plainMonthDay'
import { PlainYearMonth } from './plainYearMonth'
import { Duration, DurationArg } from './duration'
import { dateRefiners } from '../internal/refiners'
import { createProtocolChecker } from './utils'

interface CalendarProtocolMethods {
  year(dateArg: PlainYearMonth | PlainDateArg): number
  month(dateArg: PlainYearMonth | PlainDateArg): number
  monthCode(dateArg: PlainYearMonth | PlainMonthDay | PlainDateArg): string
  day(dateArg: PlainMonthDay | PlainDateArg): number
  era(dateArg: PlainYearMonth | PlainDateArg): string | undefined
  eraYear(dateArg: PlainYearMonth | PlainDateArg): number | undefined
  dayOfWeek(dateArg: PlainDateArg): number
  dayOfYear(dateArg: PlainDateArg): number
  weekOfYear(dateArg: PlainDateArg): number
  yearOfWeek(dateArg: PlainDateArg): number
  daysInWeek(dateArg: PlainDateArg): number
  daysInMonth(dateArg: PlainYearMonth | PlainDateArg): number
  daysInYear(dateArg: PlainYearMonth | PlainDateArg): number
  monthsInYear(dateArg: PlainYearMonth | PlainDateArg): number
  inLeapYear(dateArg: PlainYearMonth | PlainDateArg): boolean
  dateFromFields(fields: DateBagStrict, options?: OverflowOptions): PlainDate
  yearMonthFromFields(fields: YearMonthBagStrict, options?: OverflowOptions): PlainYearMonth
  monthDayFromFields(fields: MonthDayBagStrict, options?: OverflowOptions): PlainMonthDay
  dateAdd(dateArg: PlainDateArg, duration: DurationArg, options?: OverflowOptions): PlainDate
  dateUntil(dateArg0: PlainDateArg, dateArg1: PlainDateArg, options?: LargestUnitOptions): Duration
  fields(fieldNames: Iterable<string>): Iterable<string>
  mergeFields(fields0: Record<string, unknown>, fields1: Record<string, unknown>): Record<string, unknown>
  toString?(): string
  toJSON?(): string
}

export interface CalendarProtocol extends CalendarProtocolMethods {
  id: string
}

const requiredMethodNames: string[] = [
  ...Object.keys(dateRefiners).slice(2), // remove era/eraYear
  // TODO: use adapter keys? (might result in more complexity and larger size)
  'dateAdd',
  'dateUntil',
  'dateFromFields',
  'yearMonthFromFields',
  'monthDayFromFields',
  'fields',
  'mergeFields',
]
export const checkCalendarProtocol = createProtocolChecker(requiredMethodNames)
