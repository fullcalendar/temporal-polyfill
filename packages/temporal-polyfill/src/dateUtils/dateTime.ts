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
  addTimeFields,
  constrainTimeISO,
  diffTimeFields,
  overrideTimeFields,
  timeFieldsToConstrainedISO,
  timeLikeToISO,
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
  const [timeFields, dayDelta] = addTimeFields(
    dateTime,
    durationToTimeFields(duration),
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
  t0: PlainDateTime,
  t1: PlainDateTime,
  options: DiffOptions | undefined,
  flip?: boolean,
): Duration {
  const calendar = getCommonCalendar(t0, t1)
  const diffConfig = parseDiffOptions<Unit, UnitInt>(options, DAY, NANOSECOND, NANOSECOND, YEAR)
  const { largestUnit } = diffConfig

  // some sort of time unit?
  if (!isDateUnit(largestUnit)) {
    return nanoToDuration(
      roundNano(
        isoFieldsToEpochNano(t1.getISOFields()) - isoFieldsToEpochNano(t0.getISOFields()),
        diffConfig as RoundingConfig<DayTimeUnitInt>,
      ),
      largestUnit,
    )
  }

  const [timeFields, dayDelta] = diffTimeFields(t0, t1)
  const largeDuration = calendar.dateUntil(
    createDate(t0.getISOFields()),
    addDaysToDate(createDate(t1.getISOFields()), dayDelta),
    { largestUnit: unitNames[largestUnit] as DateUnit },
  )

  const balancedDuration = addDurations(largeDuration, dayTimeFieldsToDuration(timeFields))
  return roundBalancedDuration(balancedDuration, diffConfig, t0, t1, flip)
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
