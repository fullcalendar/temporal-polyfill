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
  addDurations,
  extractDurationTimeFields,
  nanoToDuration,
  timeFieldsToDuration,
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

export function addToDateTime( // why not in add.ts?
  dateTime: PlainDateTime,
  duration: Duration,
  options: OverflowOptions | undefined, // Calendar needs raw options
): PlainDateTime {
  const [timeFields, bigDuration] = extractDurationTimeFields(duration)

  // add time first
  const dayTimeFields = translateTimeOfDay(dateTime, timeFields)

  const date0 = createDate(dateTime.getISOFields())
  const date1 = date0.calendar.dateAdd(
    addDaysToDate(date0, dayTimeFields.day),
    bigDuration,
    options,
  )

  return createDateTime({
    ...date1.getISOFields(), // supplies day fields & calendar
    ...timeLikeToISO(dayTimeFields),
  })
}

export function diffDateTimes( // why not in diff.ts?
  dt0: PlainDateTime,
  dt1: PlainDateTime,
  options: DiffOptions | undefined,
  flip?: boolean,
): Duration {
  const calendar = getCommonCalendar(dt0, dt1)
  const diffConfig = parseDiffOptions<Unit, UnitInt>(options, DAY, NANOSECOND, NANOSECOND, YEAR)
  const { largestUnit } = diffConfig

  const isoFields0 = dt0.getISOFields()
  const isoFields1 = dt1.getISOFields()

  // some sort of time unit?
  if (!isDateUnit(largestUnit)) {
    return nanoToDuration(
      roundNano(
        (isoFieldsToEpochNano(isoFields1) - isoFieldsToEpochNano(isoFields0)) * (flip ? -1n : 1n),
        diffConfig as RoundingConfig<DayTimeUnitInt>,
      ),
      largestUnit,
    )
  }

  const dayTimeDiff = diffTimeOfDays(isoFields0, isoFields1)
  const largeDuration = calendar.dateUntil(
    createDate(isoFields0),
    addDaysToDate(createDate(isoFields1), dayTimeDiff.day),
    { largestUnit: unitNames[largestUnit] as DateUnit },
  )

  const balancedDuration = addDurations(largeDuration, timeFieldsToDuration(dayTimeDiff))
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
  const dayTimeFields = roundTimeOfDay(dateTime, roundingConfig)
  const dateISOFields = addWholeDays(dateTime.getISOFields(), dayTimeFields.day)
  // ^preserves `calendar`

  return createDateTime({
    ...dateISOFields,
    ...timeLikeToISO(dayTimeFields),
  })
}
