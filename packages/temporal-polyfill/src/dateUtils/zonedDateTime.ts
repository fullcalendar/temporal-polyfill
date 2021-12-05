import { getCommonCalendar } from '../argParse/calendar'
import { parseDiffOptions } from '../argParse/diffOptions'
import {
  OFFSET_IGNORE,
  OFFSET_REJECT,
  OFFSET_USE,
  OffsetHandlingInt,
} from '../argParse/offsetHandling'
import { OverflowHandlingInt } from '../argParse/overflowHandling'
import { RoundConfig, parseRoundOptions } from '../argParse/roundOptions'
import { unitNames } from '../argParse/unitStr'
import { Calendar } from '../public/calendar'
import { Duration } from '../public/duration'
import { TimeZone } from '../public/timeZone'
import {
  CompareResult,
  DateTimeISOFields,
  DateTimeRoundOptions,
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
import { addDurations, durationToTimeFields, nanoToDuration } from './duration'
import { isoFieldsToEpochNano } from './isoMath'
import { DateTimeParseResult, parseOffsetNano } from './parse'
import { roundBalancedDuration, roundNano } from './round'
import { diffTimeFields, timeFieldsToNano } from './time'
import { DAY, DayTimeUnitInt, NANOSECOND, UnitInt, YEAR, isDateUnit } from './units'

export type ZonedDateTimeISOEssentials = DateTimeISOFields & { // essentials for creation
  timeZone: TimeZone
  offset?: number | null
}
export type ZonedDateTimeFields = DateTimeFields & { offset: string }

export function createZonedDateTime(
  isoFields: ZonedDateTimeISOEssentials,
  options: ZonedDateTimeOptions | undefined,
  offsetHandling: OffsetHandlingInt,
): ZonedDateTime {
  const dateTime = createDateTime(isoFields)
  let zonedDateTime = dateTime.toZonedDateTime(isoFields.timeZone, options)
  const literalOffset = isoFields.offset

  if (
    literalOffset != null &&
    literalOffset !== zonedDateTime.offsetNanoseconds
  ) {
    if (offsetHandling === OFFSET_REJECT) {
      throw new Error('Mismatching offset/timezone')
    } else if (offsetHandling !== OFFSET_IGNORE) {
      const newEpochNano = isoFieldsToEpochNano(isoFields) - BigInt(literalOffset)
      let useNew = false

      if (offsetHandling === OFFSET_USE) {
        useNew = true
      } else { // OFFSET_PREFER
        const instants = isoFields.timeZone.getPossibleInstantsFor(dateTime)

        for (const instant of instants) {
          if (instant.epochNanoseconds === newEpochNano) {
            useNew = true
            break
          }
        }
      }

      if (useNew) {
        zonedDateTime = new ZonedDateTime(newEpochNano, isoFields.timeZone, isoFields.calendar)
      }
    }
  }

  return zonedDateTime
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
    offset: fields.offset ? parseOffsetNano(fields.offset) : null,
  }
}

export function zoneDateTimeParseResult(parsed: DateTimeParseResult): ZonedDateTimeISOEssentials {
  return {
    ...parsed,
    timeZone: new TimeZone(parsed.timeZone!), // will throw error if empty timeZone
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
  // add time fields first
  const timeNano = timeFieldsToNano(durationToTimeFields(duration))
  const epochNano = zonedDateTime.epochNanoseconds + BigInt(timeNano)
  const isoFields = new ZonedDateTime(epochNano, zonedDateTime.timeZone, zonedDateTime.calendar)
    .getISOFields()

  // add larger fields using the calendar
  // Calendar::dateAdd will ignore time parts
  const date = zonedDateTime.calendar.dateAdd(
    createDate(isoFields),
    duration,
    options,
  )

  return date.toZonedDateTime({
    plainTime: zonedDateTime,
    timeZone: zonedDateTime.timeZone,
  })
}

export function diffZonedDateTimes(
  dt0: ZonedDateTime,
  dt1: ZonedDateTime,
  options: DiffOptions | undefined,
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

  // some sort of time unit
  if (!isDateUnit(largestUnit)) {
    return nanoToDuration(
      roundNano(
        dt1.epochNanoseconds - dt0.epochNanoseconds,
        diffConfig as RoundConfig<DayTimeUnitInt>,
      ),
      largestUnit,
    )
  }

  const [, dayDelta] = diffTimeFields(dt0, dt1)

  const largeDuration = calendar.dateUntil(
    createDate(dt0.getISOFields()),
    addDaysToDate(createDate(dt1.getISOFields()), dayDelta),
    { largestUnit: unitNames[largestUnit] as DateUnit },
  )

  // advance dt0 to within a day of dt1 and compute the time different
  // guaranteed to be less than 24 hours
  const timeDuration = nanoToDuration(
    dt1.epochNanoseconds - dt0.add(largeDuration).epochNanoseconds,
    DAY, // overflow to day just in case of weird DST issue
  )

  const balancedDuration = addDurations(largeDuration, timeDuration)
  return roundBalancedDuration(balancedDuration, diffConfig, dt0, dt1)
}

export function roundZonedDateTime(
  zonedDateTime: ZonedDateTime,
  options: DateTimeRoundOptions | undefined,
): ZonedDateTime {
  const roundConfig = parseRoundOptions<DayTimeUnit, DayTimeUnitInt>(
    options,
    undefined, // no default. will error-out if unset
    NANOSECOND, // minUnit
    DAY, // maxUnit
  )
  const origNano = dayTimeFieldsToNano(zonedDateTime)
  const roundedNano = roundNano(origNano, roundConfig)
  const diffNano = roundedNano - origNano
  return new ZonedDateTime(
    zonedDateTime.epochNanoseconds + BigInt(diffNano),
    zonedDateTime.timeZone,
    zonedDateTime.calendar,
  )
}
