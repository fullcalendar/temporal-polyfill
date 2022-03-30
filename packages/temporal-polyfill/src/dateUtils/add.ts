import { OverflowHandlingInt } from '../argParse/overflowHandling'
import { constrainInt } from '../argParse/refine'
import { CalendarImpl } from '../calendarImpl/calendarImpl'
import { Duration } from '../public/duration'
import { Instant } from '../public/instant'
import { createDate } from '../public/plainDate'
import { PlainDateTime, createDateTime } from '../public/plainDateTime'
import { PlainTime, createTime } from '../public/plainTime'
import { DateISOFields, OverflowOptions } from '../public/types'
import { ZonedDateTime } from '../public/zonedDateTime'
import { DayTimeFields } from './dayTime'
import {
  computeLargestDurationUnit,
  durationToTimeFields,
  extractBigDuration,
  extractDurationTimeFields,
} from './duration'
import {
  addDaysMilli,
  epochMilliToISOFields,
  epochNanoToISOFields,
  isoFieldsToEpochMilli,
  isoFieldsToEpochNano,
  timeFieldsToNano,
  timeLikeToISO,
  wrapTimeOfDayNano,
} from './isoMath'
import { DateEssentials, DateISOEssentials, TimeFields } from './types-private'
import { DAY } from './units'

export function addToDateTime(
  dateTime: PlainDateTime,
  duration: Duration,
  options: OverflowOptions | undefined, // Calendar needs raw options
): PlainDateTime {
  const { calendar } = dateTime
  const bigDuration = extractBigDuration(duration)
  const durationTimeFields = durationToTimeFields(duration)

  // add large fields first
  const date = calendar.dateAdd(
    createDate(dateTime.getISOFields()),
    bigDuration,
    options,
  )

  return createDateTime({
    ...epochNanoToISOFields(
      isoFieldsToEpochNano(date.getISOFields()) +
      timeFieldsToNano(dateTime) + // restore time-of-day
      timeFieldsToNano(durationTimeFields),
    ),
    calendar,
  })
}

export function addToDateFields(
  dateFields: DateEssentials,
  duration: Duration,
  calendarImpl: CalendarImpl,
  overflowHandling: OverflowHandlingInt,
): DateISOEssentials {
  dateFields = addWholeYears(dateFields, duration.years, calendarImpl, overflowHandling)
  dateFields = addWholeMonths(dateFields, duration.months, calendarImpl, overflowHandling)

  let epochMilli = calendarImpl.epochMilliseconds(dateFields.year, dateFields.month, dateFields.day)

  const [, bigDuration] = extractDurationTimeFields(duration)
  epochMilli = addDaysMilli(
    epochMilli,
    bigDuration.weeks * 7 + bigDuration.days,
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
  const newMonth = constrainInt(month, 1, calendarImpl.monthsInYear(year), overflowHandling)
  let newDay = month === newMonth ? day : 1 // month was constrained? reset day
  newDay = constrainInt(newDay, 1, calendarImpl.daysInMonth(year, newMonth), overflowHandling)
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

    day = constrainInt(day, 1, calendarImpl.daysInMonth(year, month), overflowHandling)
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

export function addToPlainTime(time: PlainTime, dur: Duration): PlainTime {
  const dayTimeFields = translateTimeOfDay(time, durationToTimeFields(dur))
  return createTime(timeLikeToISO(dayTimeFields))
}

function translateTimeOfDay(timeOfDay: TimeFields, delta: TimeFields): DayTimeFields {
  return wrapTimeOfDayNano(timeFieldsToNano(timeOfDay) + timeFieldsToNano(delta))
}

export function addToInstant(instant: Instant, duration: Duration): Instant {
  const largestUnit = computeLargestDurationUnit(duration)

  if (largestUnit >= DAY) {
    throw new RangeError('Duration cant have units larger than days')
  }

  return new Instant(
    instant.epochNanoseconds + timeFieldsToNano(durationToTimeFields(duration)),
  )
}

export function addToZonedDateTime(
  zonedDateTime: ZonedDateTime,
  duration: Duration,
  options: OverflowOptions | undefined, // Calendar needs these options to be raw
): ZonedDateTime {
  const { calendar, timeZone } = zonedDateTime
  const bigDuration = extractBigDuration(duration)
  const timeFields = durationToTimeFields(duration)

  // add large fields first
  const translated = calendar.dateAdd(
    zonedDateTime.toPlainDate(),
    bigDuration,
    options,
  ).toZonedDateTime({
    plainTime: zonedDateTime,
    timeZone,
  })

  // add time fields
  const timeNano = timeFieldsToNano(timeFields)
  const epochNano = translated.epochNanoseconds + timeNano
  return new ZonedDateTime(epochNano, timeZone, calendar)
}
