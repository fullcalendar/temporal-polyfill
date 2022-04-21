import { OVERFLOW_REJECT, OverflowHandlingInt } from '../argParse/overflowHandling'
import { constrainInt } from '../argParse/refine'
import { CalendarImpl } from '../calendarImpl/calendarImpl'
import { isoCalendarImpl } from '../calendarImpl/isoCalendarImpl'
import { ISODateFields, ISODateTimeFields, ISOTimeFields } from './isoFields'

export function constrainDateFields(
  year: number,
  month: number,
  day: number,
  calendarImpl: CalendarImpl,
  overflow: OverflowHandlingInt,
): [number, number, number] {
  year = Number(year) // not using constrainValue, which converts to a number
  month = constrainInt(month, 1, calendarImpl.monthsInYear(year), overflow)
  day = constrainInt(day, 1, calendarImpl.daysInMonth(year, month), overflow)

  return [year, month, day]
}

export function constrainDateISO( // also ensures numbers
  isoFields: ISODateFields,
  overflow: OverflowHandlingInt,
): ISODateFields {
  const [isoYear, isoMonth, isoDay] = constrainDateFields(
    isoFields.isoYear,
    isoFields.isoMonth,
    isoFields.isoDay,
    isoCalendarImpl,
    overflow,
  )
  return { isoYear, isoMonth, isoDay }
}

export function isValidDateISO(isoFields: ISODateFields): boolean {
  // HACK
  try {
    constrainDateISO(isoFields, OVERFLOW_REJECT)
    return true
  } catch (ex) {
    return false
  }
}

export function constrainDateTimeISO( // also ensures numbers
  isoFields: ISODateTimeFields,
  overflow: OverflowHandlingInt,
): ISODateTimeFields {
  return {
    ...constrainDateISO(isoFields, overflow),
    ...constrainTimeISO(isoFields, overflow),
  }
}

export function constrainTimeISO( // also converts to number
  {
    isoHour, isoMinute, isoSecond,
    isoMillisecond, isoMicrosecond, isoNanosecond,
  }: ISOTimeFields,
  overflow: OverflowHandlingInt,
): ISOTimeFields {
  isoHour = constrainInt(isoHour, 0, 23, overflow)
  isoMinute = constrainInt(isoMinute, 0, 59, overflow)
  isoSecond = constrainInt(isoSecond, 0, 59, overflow)
  isoMillisecond = constrainInt(isoMillisecond, 0, 999, overflow)
  isoMicrosecond = constrainInt(isoMicrosecond, 0, 999, overflow)
  isoNanosecond = constrainInt(isoNanosecond, 0, 999, overflow)
  return { isoHour, isoMinute, isoSecond, isoMillisecond, isoMicrosecond, isoNanosecond }
}
