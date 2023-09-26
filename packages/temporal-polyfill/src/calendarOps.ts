import { DateBag, MonthDayBag, YearMonthBag } from './calendarFields'
import { DurationInternals } from './durationFields'
import { IsoDateFields } from './isoFields'
import { Overflow } from './options'
import { Unit } from './units'
import { getCommonInnerObj } from './complexObjUtils'
import { BoundArg } from './utils'
import { CalendarSlots, IsoDateSlots } from './slots'

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
  dateFromFields(fields: DateBag, overflow?: Overflow): IsoDateSlots
  yearMonthFromFields(fields: YearMonthBag, overflow?: Overflow): IsoDateSlots
  monthDayFromFields(fields: MonthDayBag, overflow?: Overflow): IsoDateSlots
  dateAdd(isoFields: IsoDateFields, durationInternals: DurationInternals, overflow?: Overflow): IsoDateSlots
  dateUntil(isoFields0: IsoDateFields, isoFields1: IsoDateFields, largestUnit: Unit): DurationInternals
  // It'd be nice to have fieldNames input value be a string[],
  // but unfortunately accessing of array element could have side effects,
  // so pass all the way down to the CalendarImpl to do it
  fields(fieldNames: string[]): string[]
  mergeFields(fields0: Record<string, unknown>, fields1: Record<string, unknown>): Record<string, unknown>
}

export const getCommonCalendarOps = getCommonInnerObj.bind<
  undefined, [BoundArg],
  [CalendarSlots, CalendarSlots],
  CalendarOps // return
>(undefined, 'calendar')
