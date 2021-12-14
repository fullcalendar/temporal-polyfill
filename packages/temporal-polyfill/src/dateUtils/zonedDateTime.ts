import { getCommonCalendar } from '../argParse/calendar'
import { parseDiffOptions } from '../argParse/diffOptions'
import {
  OFFSET_IGNORE,
  OFFSET_REJECT,
  OFFSET_USE,
  OffsetHandlingInt,
} from '../argParse/offsetHandling'
import { OverflowHandlingInt } from '../argParse/overflowHandling'
import { RoundingConfig, parseRoundingOptions } from '../argParse/roundingOptions'
import { unitNames } from '../argParse/unitStr'
import { Calendar } from '../public/calendar'
import { Duration } from '../public/duration'
import { Instant } from '../public/instant'
import { TimeZone } from '../public/timeZone'
import {
  CompareResult,
  DateTimeISOFields,
  DateTimeRoundingOptions,
  DateUnit,
  DayTimeUnit,
  DiffOptions,
  OverflowOptions,
  Unit,
  ZonedDateTimeLikeFields,
  ZonedDateTimeOptions,
} from '../public/types'
import { ZonedDateTime } from '../public/zonedDateTime'
import { compareValues } from '../utils/math'
import { addDaysToDate, createDate } from './date'
import {
  DateTimeFields,
  createDateTime,
  dateTimeFieldsToISO,
  overrideDateTimeFields,
} from './dateTime'
import { dayTimeFieldsToNano } from './dayTime'
import { addDurations, extractDurationTimeFields, nanoToDuration } from './duration'
import { isoFieldsToEpochNano } from './isoMath'
import { parseOffsetNano } from './parse'
import { roundBalancedDuration, roundNano } from './rounding'
import { diffTimeOfDays, timeFieldsToNano } from './time'
import { DAY, DayTimeUnitInt, NANOSECOND, UnitInt, YEAR, isDateUnit } from './units'

export type ZonedDateTimeISOEssentials = DateTimeISOFields & { // essentials for creation
  timeZone: TimeZone
  offset?: number | undefined
}
export type ZonedDateTimeFields = DateTimeFields & { offset: string }

export function createZonedDateTime(
  isoFields: ZonedDateTimeISOEssentials,
  options: ZonedDateTimeOptions | undefined,
  offsetHandling: OffsetHandlingInt,
): ZonedDateTime {
  const { calendar, timeZone, offset } = isoFields
  let epochNano: bigint | undefined

  // try using the given offset and see what happens...
  if (offset !== undefined && offsetHandling !== OFFSET_IGNORE) {
    epochNano = isoFieldsToEpochNano(isoFields) - BigInt(offset)

    if (offsetHandling !== OFFSET_USE) {
      const possibleInstants = timeZone.getPossibleInstantsFor(createDateTime(isoFields))

      if (!matchesPossibleInstants(epochNano, possibleInstants)) {
        if (offsetHandling === OFFSET_REJECT) {
          throw new RangeError('Mismatching offset/timezone')
        } else { // OFFSET_PREFER
          epochNano = undefined // will calculate from timeZone
        }
      }
    }
  }

  // calculate from timeZone if necessary
  if (epochNano === undefined) {
    epochNano = timeZone.getInstantFor(createDateTime(isoFields), options).epochNanoseconds
  }

  return new ZonedDateTime(epochNano, timeZone, calendar)
}

function matchesPossibleInstants(epochNano: bigint, possibleInstants: Instant[]): boolean {
  for (const instant of possibleInstants) {
    if (instant.epochNanoseconds === epochNano) {
      return true
    }
  }
  return false
}

export function zonedDateTimeFieldsToISO(
  fields: ZonedDateTimeLikeFields,
  options: ZonedDateTimeOptions | undefined,
  overflowHandling: OverflowHandlingInt,
  calendar: Calendar,
  timeZone: TimeZone,
): ZonedDateTimeISOEssentials {
  return {
    ...dateTimeFieldsToISO(fields, options, overflowHandling, calendar),
    timeZone,
    offset: fields.offset ? parseOffsetNano(fields.offset) : undefined,
  }
}

export function overrideZonedDateTimeFields(
  overrides: Partial<ZonedDateTimeFields>,
  base: ZonedDateTimeFields,
): ZonedDateTimeLikeFields {
  return {
    ...overrideDateTimeFields(overrides, base),
    offset: overrides.offset ?? base.offset,
  }
}

export function compareZonedDateTimes(a: ZonedDateTime, b: ZonedDateTime): CompareResult {
  return compareValues(a.epochNanoseconds, b.epochNanoseconds) ||
    compareValues(a.calendar.id, b.calendar.id) ||
    compareValues(a.timeZone.id, b.timeZone.id)
}

export function addToZonedDateTime(
  zonedDateTime: ZonedDateTime,
  duration: Duration,
  options: OverflowOptions | undefined, // Calendar needs these options to be raw
): ZonedDateTime {
  const [timeFields, bigDuration] = extractDurationTimeFields(duration)

  // add time fields first
  const timeNano = timeFieldsToNano(timeFields)
  const epochNano = zonedDateTime.epochNanoseconds + timeNano
  zonedDateTime = new ZonedDateTime(epochNano, zonedDateTime.timeZone, zonedDateTime.calendar)

  // add larger fields using the calendar
  // Calendar::dateAdd will ignore time parts
  const date = zonedDateTime.calendar.dateAdd(
    zonedDateTime.toPlainDate(),
    bigDuration, // only units >= DAY
    options,
  )

  return date.toZonedDateTime({
    plainTime: zonedDateTime,
    timeZone: zonedDateTime.timeZone,
  })
}

export function diffZonedDateTimes( // why not in diff.ts?
  dt0: ZonedDateTime,
  dt1: ZonedDateTime,
  options: DiffOptions | undefined,
  flip?: boolean,
): Duration {
  const calendar = getCommonCalendar(dt0, dt1)
  const diffConfig = parseDiffOptions<Unit, UnitInt>(
    options,
    DAY, // largestUnitDefault
    NANOSECOND, // smallestUnitDefault
    NANOSECOND, // minUnit
    YEAR, // maxUnit
  )
  const { largestUnit } = diffConfig

  if (largestUnit >= DAY && dt0.timeZone.id !== dt1.timeZone.id) {
    throw new Error('Must be same timeZone')
  }

  // some sort of time unit?
  if (!isDateUnit(largestUnit)) {
    return nanoToDuration(
      roundNano(
        (dt1.epochNanoseconds - dt0.epochNanoseconds) * (flip ? -1n : 1n),
        diffConfig as RoundingConfig<DayTimeUnitInt>,
      ),
      largestUnit,
    )
  }

  const isoFields0 = dt0.getISOFields()
  const isoFields1 = dt1.getISOFields()

  const dayTimeFields = diffTimeOfDays(isoFields0, isoFields1)
  const largeDuration = calendar.dateUntil(
    createDate(isoFields0),
    addDaysToDate(createDate(isoFields1), dayTimeFields.day),
    { largestUnit: unitNames[largestUnit] as DateUnit },
  )

  // advance dt0 to within a day of dt1 and compute the time difference
  // guaranteed to be less than 24 hours
  const timeDuration = nanoToDuration(
    dt1.epochNanoseconds - dt0.add(largeDuration).epochNanoseconds,
    DAY, // overflow to day just in case of weird DST issue
  )

  const balancedDuration = addDurations(largeDuration, timeDuration)
  return roundBalancedDuration(balancedDuration, diffConfig, dt0, dt1, flip)
}

export function roundZonedDateTime(
  zonedDateTime: ZonedDateTime,
  options: DateTimeRoundingOptions | undefined,
): ZonedDateTime {
  const roundingConfig = parseRoundingOptions<DayTimeUnit, DayTimeUnitInt>(
    options,
    undefined, // no default. will error-out if unset
    NANOSECOND, // minUnit
    DAY, // maxUnit
  )
  const origNano = dayTimeFieldsToNano(zonedDateTime)
  const roundedNano = roundNano(origNano, roundingConfig)
  const diffNano = roundedNano - origNano
  return new ZonedDateTime(
    zonedDateTime.epochNanoseconds + diffNano,
    zonedDateTime.timeZone,
    zonedDateTime.calendar,
  )
}
