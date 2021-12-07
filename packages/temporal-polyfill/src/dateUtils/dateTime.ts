import { getCommonCalendar } from '../argParse/calendar'
import { parseDiffOptions } from '../argParse/diffOptions'
import { OverflowHandlingInt } from '../argParse/overflowHandling'
import { RoundingConfig, parseRoundingOptions } from '../argParse/roundingOptions'
import { unitNames } from '../argParse/unitStr'
import { Calendar } from '../public/calendar'
import { Duration } from '../public/duration'
import { PlainDateTime } from '../public/plainDateTime'
import {
  CompareResult,
  DateTimeISOFields,
  DateTimeLikeFields,
  DateTimeOverrides,
  DateTimeRoundingOptions,
  DateUnit,
  DayTimeUnit,
  DiffOptions,
  OverflowOptions,
  Unit,
} from '../public/types'
import { compareValues } from '../utils/math'
import { addWholeDays } from './add'
import {
  DateFields,
  DateISOEssentials,
  addDaysToDate,
  constrainDateISO,
  createDate,
  overrideDateFields,
} from './date'
import {
  addDaysToDuration,
  addDurations,
  dayTimeFieldsToDuration,
  durationToTimeFields,
  nanoToDuration,
} from './duration'
import { isoFieldsToEpochNano } from './isoMath'
import { roundBalancedDuration, roundNano, roundTimeOfDay } from './rounding'
import {
  TimeFields,
  TimeISOEssentials,
  TimeISOMilli,
  constrainTimeISO,
  diffTimeOfDays,
  overrideTimeFields,
  timeFieldsToConstrainedISO,
  timeLikeToISO,
  translateTimeOfDay,
} from './time'
import { DAY, DayTimeUnitInt, NANOSECOND, UnitInt, YEAR, isDateUnit } from './units'

export type DateTimeISOMilli = DateISOEssentials & TimeISOMilli
export type DateTimeISOEssentials = DateISOEssentials & TimeISOEssentials
export type DateTimeFields = DateFields & TimeFields

export function createDateTime(isoFields: DateTimeISOFields): PlainDateTime {
  return new PlainDateTime(
    isoFields.isoYear,
    isoFields.isoMonth,
    isoFields.isoDay,
    isoFields.isoHour,
    isoFields.isoMinute,
    isoFields.isoSecond,
    isoFields.isoMillisecond,
    isoFields.isoMicrosecond,
    isoFields.isoNanosecond,
    isoFields.calendar,
  )
}

export function dateTimeFieldsToISO(
  fields: DateTimeLikeFields,
  options: OverflowOptions | undefined,
  overflowHandling: OverflowHandlingInt,
  calendar: Calendar,
): DateTimeISOFields {
  return {
    ...calendar.dateFromFields(fields, options).getISOFields(),
    ...timeFieldsToConstrainedISO(fields, overflowHandling),
  }
}

export function overrideDateTimeFields(
  overrides: DateTimeOverrides,
  base: DateTimeFields,
): DateTimeLikeFields {
  return {
    ...overrideDateFields(overrides, base),
    ...overrideTimeFields(overrides, base),
  }
}

export function constrainDateTimeISO( // also ensures numbers
  isoFields: DateTimeISOEssentials,
  overflow: OverflowHandlingInt,
): DateTimeISOEssentials {
  return {
    ...constrainDateISO(isoFields, overflow),
    ...constrainTimeISO(isoFields, overflow),
  }
}

export function compareDateTimes(a: PlainDateTime, b: PlainDateTime): CompareResult {
  return compareValues(
    isoFieldsToEpochNano(a.getISOFields()),
    isoFieldsToEpochNano(b.getISOFields()),
  ) || compareValues(a.calendar.id, b.calendar.id)
}

export function addToDateTime(
  dateTime: PlainDateTime,
  duration: Duration,
  options: OverflowOptions | undefined, // Calendar needs raw options
): PlainDateTime {
  // add time first
  const [timeFields, dayDelta] = translateTimeOfDay(
    dateTime, // used as time-of-day
    durationToTimeFields(duration), // could be much larger than a time-of-day
  )

  const date0 = createDate(dateTime.getISOFields())
  const date1 = date0.calendar.dateAdd(
    date0,
    addDaysToDuration(duration, dayDelta),
    options,
  )

  return createDateTime({
    ...date1.getISOFields(), // supplies day fields & calendar
    ...timeLikeToISO(timeFields),
  })
}

export function diffDateTimes(
  dt0: PlainDateTime,
  dt1: PlainDateTime,
  options: DiffOptions | undefined,
  flip?: boolean,
): Duration {
  const calendar = getCommonCalendar(dt0, dt1)
  const diffConfig = parseDiffOptions<Unit, UnitInt>(options, DAY, NANOSECOND, NANOSECOND, YEAR)
  const { largestUnit } = diffConfig

  // some sort of time unit?
  if (!isDateUnit(largestUnit)) {
    return nanoToDuration(
      roundNano(
        isoFieldsToEpochNano(dt1.getISOFields()) - isoFieldsToEpochNano(dt0.getISOFields()),
        diffConfig as RoundingConfig<DayTimeUnitInt>,
      ),
      largestUnit,
    )
  }

  const [timeFields, dayDelta] = diffTimeOfDays(dt0, dt1) // arguments used as time-of-day
  const largeDuration = calendar.dateUntil(
    createDate(dt0.getISOFields()),
    addDaysToDate(createDate(dt1.getISOFields()), dayDelta),
    { largestUnit: unitNames[largestUnit] as DateUnit },
  )

  const balancedDuration = addDurations(largeDuration, dayTimeFieldsToDuration(timeFields))
  return roundBalancedDuration(balancedDuration, diffConfig, dt0, dt1, flip)
}

export function roundDateTime(
  dateTime: PlainDateTime,
  options: DateTimeRoundingOptions,
): PlainDateTime {
  const roundingConfig = parseRoundingOptions<DayTimeUnit, DayTimeUnitInt>(
    options,
    undefined, // no default. required
    NANOSECOND, // minUnit
    DAY, // maxUnit
  )
  const [timeFields, dayDelta] = roundTimeOfDay(dateTime, roundingConfig)
  const dateISOFields = addWholeDays(dateTime.getISOFields(), dayDelta) // preserves `calendar`

  return createDateTime({
    ...dateISOFields,
    ...timeLikeToISO(timeFields),
  })
}
