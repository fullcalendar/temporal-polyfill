import { Temporal } from 'temporal-spec'
import { OverflowHandlingInt } from '../argParse/overflowHandling'
import { constrainInt } from '../argParse/refine'
import { CalendarImpl } from '../calendarImpl/calendarImpl'
import { Instant } from '../public/instant'
import { createDate } from '../public/plainDate'
import { createDateTime } from '../public/plainDateTime'
import { LargeInt } from '../utils/largeInt'
import {
  durationDayTimeToNano,
  durationTimeToNano,
  isoTimeToNano,
  nanoToDuration,
  nanoToISOTime,
  zeroDurationTimeFields,
} from './dayAndTime'
import { DiffableObj, diffAccurate } from './diff'
import { DurationFields, computeLargestDurationUnit, overrideDuration } from './durationFields'
import {
  addDaysMilli,
  epochMilliToISOFields,
  epochNanoSymbol,
  epochNanoToISOFields,
  isoFieldsToEpochNano,
  isoToEpochMilli,
} from './epoch'
import {
  ISODateFields,
  ISODateTimeFields,
  ISOTimeFields,
} from './isoFields'
import { LocalDateFields } from './localFields'
import { getInstantFor } from './timeZone'
import { DAY, DayTimeUnitInt, nanoInDay } from './units'

type TranslatableObj = ISODateTimeFields & { calendar: Temporal.CalendarProtocol }
type ZonedTranslatableObj = TranslatableObj & { timeZone: Temporal.TimeZoneProtocol }

export function translateZonedDateTimeFields(
  fields: ZonedTranslatableObj,
  duration: DurationFields,
  options: Temporal.AssignmentOptions | undefined, // Calendar needs these options to be raw
): LargeInt {
  const { calendar, timeZone } = fields

  // add date fields first
  const translatedDate = calendar.dateAdd(
    createDate(fields),
    // don't let calendar round time fields to day
    overrideDuration(duration, zeroDurationTimeFields),
    options,
  )

  // add time-of-day back in
  const translatedDateTime = createDateTime({
    ...fields,
    ...translatedDate.getISOFields(),
  })

  // add time fields of duration
  const translatedInstant = getInstantFor(timeZone, translatedDateTime) as Instant // TODO: better
  return translatedInstant[epochNanoSymbol].add(durationTimeToNano(duration))
}

export function translateDateTime(
  fields: TranslatableObj,
  duration: DurationFields,
  options: Temporal.AssignmentOptions | undefined, // Calendar needs raw options
): ISODateTimeFields {
  const { calendar } = fields

  // add large fields first
  const date = calendar.dateAdd(
    createDate(fields),
    // don't let calendar round time fields to day
    overrideDuration(duration, zeroDurationTimeFields),
    options,
  )

  const epochNano = isoFieldsToEpochNano(date.getISOFields())
    .add(isoTimeToNano(fields)) // restore original time-of-day
    .add(durationTimeToNano(duration)) // add duration time parts

  return epochNanoToISOFields(epochNano)
}

export function translateDate(
  dateFields: LocalDateFields,
  durationFields: DurationFields,
  calendarImpl: CalendarImpl,
  overflowHandling: OverflowHandlingInt,
): ISODateFields {
  dateFields = addYears(dateFields, durationFields.years, calendarImpl, overflowHandling)
  dateFields = addMonths(dateFields, durationFields.months, calendarImpl, overflowHandling)

  let epochMilli = calendarImpl.epochMilliseconds(dateFields.year, dateFields.month, dateFields.day)

  const daysFromTime = Math.trunc(durationTimeToNano(durationFields).div(nanoInDay).toNumber())
  const days = durationFields.weeks * 7 + durationFields.days + daysFromTime
  epochMilli = addDaysMilli(epochMilli, days)

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
  const nano = isoTimeToNano(timeFields) + durationTimeToNano(durationFields).toNumber()
  const [newTimeFields] = nanoToISOTime(nano)
  return newTimeFields
}

export function translateEpochNano(epochNano: LargeInt, durationFields: DurationFields): LargeInt {
  const largestUnit = computeLargestDurationUnit(durationFields)

  if (largestUnit >= DAY) {
    throw new RangeError('Duration cant have units >= days')
  }

  return epochNano.add(durationTimeToNano(durationFields))
}

// duration

export function addDurationFields(
  d0: DurationFields, // should be added to relativeToArg FIRST
  d1: DurationFields, // should be added to relativeToArg SECOND
  relativeTo: DiffableObj | undefined,
  calendar: Temporal.CalendarProtocol | undefined,
): DurationFields {
  const largestUnit = Math.max(
    computeLargestDurationUnit(d0),
    computeLargestDurationUnit(d1),
  ) as DayTimeUnitInt

  if (relativeTo === undefined && largestUnit <= DAY) {
    return nanoToDuration(
      durationDayTimeToNano(d0).add(durationDayTimeToNano(d1)),
      largestUnit,
    )
  }

  if (!relativeTo) {
    throw new RangeError('Need relativeTo')
  }

  const translated = relativeTo.add(d0).add(d1)
  return diffAccurate(relativeTo, translated, calendar!, largestUnit)
}
