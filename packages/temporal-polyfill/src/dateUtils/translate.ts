import { OverflowHandlingInt } from '../argParse/overflowHandling'
import { constrainInt } from '../argParse/refine'
import { CalendarImpl } from '../calendarImpl/calendarImpl'
import { Calendar } from '../public/calendar'
import { createDate } from '../public/plainDate'
import { createDateTime } from '../public/plainDateTime'
import { TimeZone } from '../public/timeZone'
import { OverflowOptions } from '../public/types'
import {
  durationDayTimeToNano,
  durationTimeToNano,
  isoTimeToNano,
  nanoToDuration,
  nanoToISOTime,
} from './dayAndTime'
import { DiffableObj, diffAccurate } from './diff'
import { computeLargestDurationUnit } from './durationFields'
import {
  addDaysMilli,
  epochMilliToISOFields,
  epochNanoToISOFields,
  isoFieldsToEpochNano,
  isoToEpochMilli,
} from './epoch'
import {
  DurationFields,
  ISODateFields,
  ISODateTimeFields,
  ISOTimeFields,
  LocalDateFields,
} from './typesPrivate'
import { DAY, DayTimeUnitInt } from './units'

export function translateZonedDateTimeFields(
  fields: ISODateTimeFields & { calendar: Calendar, timeZone: TimeZone },
  duration: DurationFields,
  options: OverflowOptions | undefined, // Calendar needs these options to be raw
): bigint {
  const { calendar, timeZone } = fields

  // add date fields first
  // will ignore smaller time parts???
  const translatedDate = calendar.dateAdd(createDate(fields), duration, options)

  // add time-of-day back in
  const translatedDateTime = createDateTime({
    ...fields,
    ...translatedDate.getISOFields(),
  })

  // add time fields of duration
  const translatedInstant = timeZone.getInstantFor(translatedDateTime) // what about option!!!
  return translatedInstant.epochNanoseconds + durationTimeToNano(duration)
}

export function translateDateTime(
  fields: ISODateTimeFields & { calendar: Calendar },
  duration: DurationFields,
  options: OverflowOptions | undefined, // Calendar needs raw options
): ISODateTimeFields {
  const { calendar } = fields

  // add large fields first
  const date = calendar.dateAdd(createDate(fields), duration, options)

  const epochNano = isoFieldsToEpochNano(date.getISOFields()) +
    BigInt(isoTimeToNano(fields)) + // restore original time-of-day
    durationTimeToNano(duration) // add duration time parts

  return epochNanoToISOFields(epochNano)
}

export function translateDate(
  fields: LocalDateFields,
  durationFields: DurationFields,
  calendarImpl: CalendarImpl,
  overflowHandling: OverflowHandlingInt,
): ISODateFields {
  fields = addYears(fields, durationFields.years, calendarImpl, overflowHandling)
  fields = addMonths(fields, durationFields.months, calendarImpl, overflowHandling)

  let epochMilli = calendarImpl.epochMilliseconds(fields.year, fields.month, fields.day)
  epochMilli = addDaysMilli(epochMilli, durationFields.weeks * 7 + durationFields.days)

  return epochMilliToISOFields(epochMilli)
}

export function addYears(
  { year, month, day }: LocalDateFields,
  yearsToAdd: number,
  calendarImpl: CalendarImpl,
  overflowHandling: OverflowHandlingInt,
): LocalDateFields {
  year += yearsToAdd
  const newMonth = constrainInt(month, 1, calendarImpl.monthsInYear(year), overflowHandling)
  let newDay = month === newMonth ? day : 1 // month was constrained? reset day
  newDay = constrainInt(newDay, 1, calendarImpl.daysInMonth(year, newMonth), overflowHandling)
  return { year, month: newMonth, day: newDay }
}

export function addMonths(
  { year, month, day }: LocalDateFields,
  monthsToAdd: number,
  calendarImpl: CalendarImpl,
  overflowHandling: OverflowHandlingInt,
): LocalDateFields {
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

export function addDays(
  { isoYear, isoMonth, isoDay }: ISODateFields,
  days: number,
): ISODateFields {
  if (days) {
    let epochMilli = isoToEpochMilli(isoYear, isoMonth, isoDay)
    epochMilli = addDaysMilli(epochMilli, days)
    ;({ isoYear, isoMonth, isoDay } = epochMilliToISOFields(epochMilli))
  }
  return { isoYear, isoMonth, isoDay }
}

export function translateTime(
  timeFields: ISOTimeFields,
  durationFields: DurationFields,
): ISOTimeFields {
  // TODO: will loss of precision cause a bug?
  const nano = isoTimeToNano(timeFields) + Number(durationTimeToNano(durationFields))
  const [newTimeFields] = nanoToISOTime(nano)
  return newTimeFields
}

export function translateEpochNano(epochNano: bigint, durationFields: DurationFields): bigint {
  const largestUnit = computeLargestDurationUnit(durationFields)

  if (largestUnit >= DAY) {
    throw new RangeError('Duration cant have units >= days')
  }

  return epochNano + durationTimeToNano(durationFields)
}

// duration

export function addDurationFields(
  d0: DurationFields, // should be added to relativeToArg FIRST
  d1: DurationFields, // should be added to relativeToArg SECOND
  relativeTo: DiffableObj | undefined,
  calendar: Calendar | undefined,
): DurationFields {
  const largestUnit = Math.max(
    computeLargestDurationUnit(d0),
    computeLargestDurationUnit(d1),
  ) as DayTimeUnitInt

  if (relativeTo === undefined && largestUnit <= DAY) {
    return nanoToDuration(
      durationDayTimeToNano(d0) + durationDayTimeToNano(d1),
      largestUnit,
    )
  }

  if (!relativeTo) {
    throw new RangeError('Need relativeTo')
  }

  const translated = relativeTo.add(d0).add(d1)
  return diffAccurate(relativeTo, translated, calendar!, largestUnit)
}
