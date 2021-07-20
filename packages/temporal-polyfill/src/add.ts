import { Calendar, CalendarDate } from './calendar'
import { isoDateToMs, msToIsoDate, MS_FOR } from './convert'
import { PlainDate } from './plainDate'

export const addYears = (
  date: CalendarDate,
  years: number,
  calendar: Calendar,
  rejectOverflow = false
): CalendarDate => {
  const temp = { ...date }
  temp.year += years
  temp.month = handleMonthOverflow(calendar, temp, rejectOverflow)
  return temp
}

export const addMonths = (
  date: CalendarDate,
  months: number,
  calendar: Calendar,
  rejectOverflow = false
): CalendarDate => {
  const temp = { ...date }

  if (months === 0) {
    return date
  }

  while (months > 0) {
    const monthsLeft =
      calendar.monthsInYear(calendar.dateFromFields(temp)) - temp.month + 1

    if (months <= monthsLeft) {
      temp.month += months
      break
    } else {
      temp.year++
      temp.month = 1
      months -= monthsLeft
    }
  }

  while (months < 0) {
    if (temp.month + months >= 1) {
      temp.month += months
      break
    } else {
      temp.year--
      temp.month = calendar.monthsInYear(calendar.dateFromFields(temp))
      months += temp.month + 1
    }
  }

  temp.day = handleDayOverflow(calendar, temp, rejectOverflow)
  return temp
}

export const addDays = (date: PlainDate, days: number): PlainDate => {
  const { isoYear, isoMonth, isoDay } = msToIsoDate(
    isoDateToMs(date) + days * MS_FOR.DAY
  )
  return new PlainDate(isoYear, isoMonth, isoDay)
}

// Overflow Utils
const handleMonthOverflow = (
  calendar: Calendar,
  fields: CalendarDate,
  rejectOverflow: boolean
): number => {
  const { isoYear, isoMonth, isoDay } = calendar.dateFromFields(fields)
  const totalMonths =
    calendar.monthsInYear(new PlainDate(isoYear, isoMonth, isoDay)) + 1

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
  const { isoYear, isoMonth, isoDay } = calendar.dateFromFields(fields)
  const totalDays =
    calendar.daysInMonth(new PlainDate(isoYear, isoMonth, isoDay)) + 1

  if (rejectOverflow && isoDay > totalDays) {
    throw new Error('Day overflow is disabled')
  }
  return isoDay % totalDays
}
