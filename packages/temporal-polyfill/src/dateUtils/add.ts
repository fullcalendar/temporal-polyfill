import { OverflowHandlingInt } from '../argParse/overflowHandling'
import { constrainValue } from '../argParse/refine'
import { CalendarImpl } from '../calendarImpl/calendarImpl'
import { Duration } from '../public/duration'
import { DateISOFields } from '../public/types'
import { DateEssentials, DateISOEssentials } from './date'
import { durationToTimeFields } from './duration'
import { addDaysMilli, epochMilliToISOFields, isoFieldsToEpochMilli } from './isoMath'
import { nanoToWrappedTimeFields, timeFieldsToNano } from './time'

export function addToDateFields(
  dateFields: DateEssentials,
  duration: Duration,
  calendarImpl: CalendarImpl,
  overflowHandling: OverflowHandlingInt,
): DateISOEssentials {
  dateFields = addWholeYears(dateFields, duration.years, calendarImpl, overflowHandling)
  dateFields = addWholeMonths(dateFields, duration.months, calendarImpl, overflowHandling)

  let epochMilli = calendarImpl.epochMilliseconds(dateFields.year, dateFields.month, dateFields.day)

  // convert time-fields to a number of days, rounding towards zero
  // ALTERNATIVE SOLUTION: have nanoToWrappedTimeFields accept a rounding function
  const timeNano = timeFieldsToNano(durationToTimeFields(duration))
  const timeNanoSign = timeNano < 0 ? -1 : 1 // custom solution because of bigint
  const dayDelta = nanoToWrappedTimeFields(timeNano * BigInt(timeNanoSign))[1] * timeNanoSign

  epochMilli = addDaysMilli(
    epochMilli,
    duration.weeks * 7 +
      duration.days +
      dayDelta,
  )

  return epochMilliToISOFields(epochMilli)
}

export function addWholeYears(
  { year, month, day }: DateEssentials,
  yearsToAdd: number,
  calendarImpl: CalendarImpl,
  overflowHandling: OverflowHandlingInt,
): DateEssentials {
  year += yearsToAdd
  const newMonth = constrainValue(month, 1, calendarImpl.monthsInYear(year), overflowHandling)
  const newDay = month === newMonth ? day : 1 // month was constrained? reset day
  return { year, month: newMonth, day: newDay }
}

export function addWholeMonths(
  { year, month, day }: DateEssentials,
  monthsToAdd: number,
  calendarImpl: CalendarImpl,
  overflowHandling: OverflowHandlingInt,
): DateEssentials {
  if (monthsToAdd) {
    month += monthsToAdd

    if (monthsToAdd < 0) {
      while (month < 1) {
        month += calendarImpl.monthsInYear(--year)
      }
    } else {
      let monthsInYear
      while (month > (monthsInYear = calendarImpl.monthsInYear(year))) {
        month -= monthsInYear
        year++
      }
    }

    day = constrainValue(day, 1, calendarImpl.daysInMonth(year, month), overflowHandling)
  }
  return { year, month, day }
}

// Unlike the other utils, this functions accepts and returns a DateISOFields object,
// which contains a CALENDAR.
export function addWholeDays(
  fields: DateISOFields,
  days: number,
): DateISOFields {
  if (days) {
    return {
      ...epochMilliToISOFields(addDaysMilli(isoFieldsToEpochMilli(fields), days)),
      calendar: fields.calendar,
    }
  }
  return fields
}
