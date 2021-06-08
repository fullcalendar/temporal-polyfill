import { Calendar, CalendarDate } from './calendar'
import { msToIsoDate } from './convert'
import { PlainDate } from './plainDateTime'
import { dateValue, toUnitMs } from './utils'

export const addYears = (
  date: CalendarDate,
  years: number,
  calendar: Calendar,
  rejectOverflow = false
): CalendarDate => {
  const fullDate: CalendarDate = {
    year: date.year + years,
    month: date.month || 1,
    day: date.day || 1,
  }
  return {
    ...fullDate,
    month: handleMonthOverflow(calendar, fullDate, rejectOverflow),
  }
}

export const addMonths = (
  date: CalendarDate,
  months: number,
  calendar: Calendar,
  rejectOverflow = false
): CalendarDate => {
  const fullDate: CalendarDate = {
    year: date.year,
    month: date.month + months,
    day: date.day || 1,
  }
  return {
    ...fullDate,
    day: handleDayOverflow(calendar, fullDate, rejectOverflow),
  }
}

export const addDays = (date: PlainDate, days: number): PlainDate => {
  return msToIsoDate(dateValue(date) + days * toUnitMs('days'))
}

// Overflow Utils
const handleMonthOverflow = (
  calendar: Calendar,
  fields: CalendarDate,
  rejectOverflow: boolean
): number => {
  const { isoYear, isoMonth, isoDay } =
    'year' in fields ? calendar.dateFromFields(fields) : fields
  const totalMonths = calendar.monthsInYear({ isoYear, isoMonth, isoDay }) + 1

  if (rejectOverflow && isoMonth > totalMonths) {
    throw new Error('Month overflow is disabled')
  }
  return isoMonth % totalMonths
}

const handleDayOverflow = (
  calendar: Calendar,
  fields: CalendarDate,
  rejectOverflow: boolean
): number => {
  const { isoYear, isoMonth, isoDay } =
    'year' in fields ? calendar.dateFromFields(fields) : fields
  const totalDays = calendar.daysInMonth({ isoYear, isoMonth, isoDay }) + 1

  if (rejectOverflow && isoDay > totalDays) {
    throw new Error('Day overflow is disabled')
  }
  return isoDay % totalDays
}
