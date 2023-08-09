import { DateBag, MonthDayBag, YearMonthBag } from './calendarFields'
import { DurationInternals } from './durationFields'
import { IsoDateFields } from './isoFields'
import { IsoDateInternals } from './isoInternals'
import { Overflow } from './options'
import { Unit } from './units'
import { getCommonInnerObj } from './class'
import { CalendarInternals } from './isoInternals'
import { BoundArg } from './utils'

export interface CalendarOps {
  /*
  TODO: due to era/eraYear-related 'crap' hack, make optional?
  */
  id: string
  era(isoFields: IsoDateFields): string | undefined
  eraYear(isoFields: IsoDateFields): number | undefined
  year(isoFields: IsoDateFields): number
  monthCode(isoFields: IsoDateFields): string
  month(isoFields: IsoDateFields): number
  day(isoFields: IsoDateFields): number
  daysInYear(isoFields: IsoDateFields): number
  inLeapYear(isoFields: IsoDateFields): boolean
  monthsInYear(isoFields: IsoDateFields): number
  daysInMonth(isoFields: IsoDateFields): number
  dayOfWeek(isoFields: IsoDateFields): number
  dayOfYear(isoFields: IsoDateFields): number
  weekOfYear(isoFields: IsoDateFields): number
  yearOfWeek(isoFields: IsoDateFields): number
  daysInWeek(isoFields: IsoDateFields): number
  dateFromFields(fields: DateBag, overflow: Overflow): IsoDateInternals
  yearMonthFromFields(fields: YearMonthBag, overflow: Overflow): IsoDateInternals
  monthDayFromFields(fields: MonthDayBag, overflow: Overflow): IsoDateInternals
  dateAdd(isoFields: IsoDateFields, durationInternals: DurationInternals, overflow: Overflow): IsoDateInternals
  dateUntil(isoFields0: IsoDateFields, isoFields1: IsoDateFields, largestUnit: Unit): DurationInternals
  fields(fieldNames: string[]): string[]
  mergeFields(fields0: Record<string, unknown>, fields1: Record<string, unknown>): Record<string, unknown>
}

export const getCommonCalendarOps = getCommonInnerObj.bind<
  undefined, [BoundArg],
  [CalendarInternals, CalendarInternals],
  CalendarOps // return
>(undefined, 'calendar')
