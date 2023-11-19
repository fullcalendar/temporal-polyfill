import { DateBag, MonthDayBag, TimeBag, YearMonthBag } from '../internal/calendarFields'

export type PlainDateBag<C> = DateBag & { calendar?: C }
export type PlainDateTimeBag<C> = DateBag & TimeBag & { calendar?: C }
export type ZonedDateTimeBag<C, T> = PlainDateTimeBag<C> & { timeZone: T, offset?: string }
export type PlainTimeBag = TimeBag
export type PlainYearMonthBag<C> = YearMonthBag & { calendar?: C }
export type PlainMonthDayBag<C> = MonthDayBag & { calendar?: C }
