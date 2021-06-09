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
  date.year += years
  date.month = handleMonthOverflow(calendar, date, rejectOverflow)
  return date
}

export const addMonths = (
  date: CalendarDate,
  months: number,
  calendar: Calendar,
  rejectOverflow = false
): CalendarDate => {
  while (months > 0) {
    const monthsLeft =
      calendar.monthsInYear(calendar.dateFromFields(date)) - date.month + 1

    if (months <= monthsLeft) {
      date.month += months
      break
    } else {
      date.year++
      date.month = 1
      months -= monthsLeft
    }
  }

  while (months < 0) {
    if (date.month + months >= 1) {
      date.month += months
      break
    } else {
      date.year--
      date.month = calendar.monthsInYear(calendar.dateFromFields(date))
      months += date.month + 1
    }
  }

  date.day = handleDayOverflow(calendar, date, rejectOverflow)
  return date
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
