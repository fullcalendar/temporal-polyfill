import { getCommonCalendar } from '../argParse/calendar'
import { parseDiffOptions } from '../argParse/diffOptions'
import {
  OFFSET_IGNORE,
  OFFSET_PREFER,
  OFFSET_REJECT,
  OFFSET_USE,
  OffsetHandlingInt,
} from '../argParse/offsetHandling'
import { parseRoundingOptions } from '../argParse/roundingOptions'
import { unitNames } from '../argParse/unitStr'
import { Duration } from '../public/duration'
import { PlainDateTime } from '../public/plainDateTime'
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
  ZonedDateTimeOptions,
} from '../public/types'
import { ZonedDateTime } from '../public/zonedDateTime'
import { RoundingFunc, roundToMinute } from '../utils/math'
import { addWholeDays } from './add'
import { createDate } from './date'
import { DateTimeFields, createDateTime, roundDateTime } from './dateTime'
import { addDurations, durationToTimeFields, extractBigDuration, nanoToDuration } from './duration'
import { isoFieldsToEpochNano } from './isoMath'
import {
  combineISOWithDayTimeFields,
  computeRoundingNanoIncrement,
  roundBalancedDuration,
  roundTimeToSpecialDay,
} from './rounding'
import { timeFieldsToNano, zeroTimeISOFields } from './time'
import {
  DAY,
  DayTimeUnitInt,
  HOUR,
  NANOSECOND,
  TimeUnitInt,
  UnitInt,
  YEAR,
  isDateUnit,
} from './units'

export type ZonedDateTimeISOEssentials = DateTimeISOFields & { // essentials for creation
  timeZone: TimeZone
  offset?: number | undefined
  Z?: boolean | undefined // whether ISO8601 specified with 'Z' as offset indicator
}
export type ZonedDateTimeFields = DateTimeFields & { offset: string }

export function createZonedDateTime(
  isoFields: ZonedDateTimeISOEssentials,
  options: ZonedDateTimeOptions | undefined, // given directly to timeZone
  offsetHandling: OffsetHandlingInt,
  fromString?: boolean,
): ZonedDateTime {
  const { calendar, timeZone } = isoFields
  const epochNano = computeZonedDateTimeEpochNano(isoFields, offsetHandling, options, fromString)

  return new ZonedDateTime(epochNano, timeZone, calendar)
}

export function checkInvalidOffset(isoFields: ZonedDateTimeISOEssentials): void {
  const { offset, timeZone, Z } = isoFields

  // a non-Z offset defined? (for ALWAYS use Z as zero offset)
  if (offset !== undefined && !Z) {
    const matchingEpochNano = findMatchingEpochNano(isoFields, offset, timeZone)

    if (matchingEpochNano === undefined) {
      throw new RangeError('Mismatching offset/timezone') // TODO: more DRY
    }
  }
}

function computeZonedDateTimeEpochNano(
  isoFields: ZonedDateTimeISOEssentials,
  offsetHandling: OffsetHandlingInt,
  options: ZonedDateTimeOptions | undefined,
  fuzzyMatching?: boolean,
): bigint {
  const { offset, timeZone, Z } = isoFields

  if (offset !== undefined && offsetHandling !== OFFSET_IGNORE) {
    // we ALWAYS use Z as zero offset
    if (offsetHandling === OFFSET_USE || Z) {
      return isoFieldsToEpochNano(isoFields) - BigInt(offset)
    } else {
      const matchingEpochNano = findMatchingEpochNano(isoFields, offset, timeZone, fuzzyMatching)
      if (matchingEpochNano !== undefined) {
        return matchingEpochNano
      }
      if (offsetHandling === OFFSET_REJECT) {
        throw new RangeError('Mismatching offset/timezone')
      }
      // else, OFFSET_PREFER...
    }
  }

  // compute fresh from TimeZone
  return timeZone.getInstantFor(createDateTime(isoFields), options).epochNanoseconds
}

function findMatchingEpochNano(
  isoFields: ZonedDateTimeISOEssentials,
  offsetNano: number,
  timeZone: TimeZone,
  fuzzyMatching?: boolean,
): bigint | undefined {
  const possibleInstants = timeZone.getPossibleInstantsFor(createDateTime(isoFields))
  const utcEpochNano = isoFieldsToEpochNano(isoFields)
  const roundedOffsetNano = fuzzyMatching ? roundToMinute(offsetNano) : offsetNano

  for (const instant of possibleInstants) {
    const possibleEpochNano = instant.epochNanoseconds
    const possibleOffsetNano = Number(utcEpochNano - possibleEpochNano)
    const possibleOffsetRefined = fuzzyMatching
      ? roundToMinute(possibleOffsetNano)
      : possibleOffsetNano

    if (possibleOffsetRefined === roundedOffsetNano) {
      return possibleEpochNano
    }
  }
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

export function diffZonedDateTimes( // why not in diff.ts?
  dt0: ZonedDateTime,
  dt1: ZonedDateTime,
  options: DiffOptions | undefined,
  flip?: boolean,
): Duration {
  const diffConfig = parseDiffOptions<Unit, UnitInt>(
    options,
    HOUR, // largestUnitDefault
    NANOSECOND, // smallestUnitDefault
    NANOSECOND, // minUnit
    YEAR, // maxUnit
  )
  const { largestUnit } = diffConfig

  if (largestUnit >= DAY && dt0.timeZone.id !== dt1.timeZone.id) {
    throw new Error('Must be same timeZone')
  }

  return roundBalancedDuration(
    diffAccurate(dt0, dt1, largestUnit),
    diffConfig,
    dt0,
    dt1,
    flip,
  )
}

// why not in diff.ts?
export function diffAccurate<T extends (ZonedDateTime | PlainDateTime)>(
  dt0: T,
  dt1: T,
  largestUnit: UnitInt,
): Duration {
  const calendar = getCommonCalendar(dt0, dt1)

  // a time unit
  if (!isDateUnit(largestUnit)) {
    return diffTimeScale(dt0, dt1, largestUnit)
  }

  const dateStart = createDate(dt0.getISOFields()) // TODO: util for this?
  let dateMiddle = createDate(dt1.getISOFields()) // TODO: util for this?
  let dateTimeMiddle: T
  let bigDuration: Duration
  let timeDuration: Duration
  let bigSign: CompareResult
  let timeSign: CompareResult

  do {
    bigDuration = calendar.dateUntil(
      dateStart,
      dateMiddle,
      { largestUnit: unitNames[largestUnit] as DateUnit },
    )
    dateTimeMiddle = dt0.add(bigDuration) as T
    timeDuration = diffTimeScale(dateTimeMiddle, dt1, HOUR)
    bigSign = bigDuration.sign
    timeSign = timeDuration.sign
  } while (
    bigSign && timeSign &&
    bigSign !== timeSign &&
    (dateMiddle = dateMiddle.add({ days: timeSign })) // move dateMiddle closer to dt0
  )

  return addDurations(bigDuration, timeDuration)
}

function diffTimeScale<T extends (ZonedDateTime | PlainDateTime)>(
  dt0: T,
  dt1: T,
  largestUnit: TimeUnitInt,
): Duration {
  return nanoToDuration(toNano(dt1) - toNano(dt0), largestUnit)
}

export function toNano(dt: PlainDateTime | ZonedDateTime): bigint {
  if (dt instanceof PlainDateTime) {
    return isoFieldsToEpochNano(dt.getISOFields()) // TODO: util for this?
  }
  return dt.epochNanoseconds
}

export function roundZonedDateTimeWithOptions(
  zonedDateTime: ZonedDateTime,
  options: DateTimeRoundingOptions | undefined,
): ZonedDateTime {
  const roundingConfig = parseRoundingOptions<DayTimeUnit, DayTimeUnitInt>(
    options,
    undefined, // no default. will error-out if unset
    NANOSECOND, // minUnit
    DAY, // maxUnit
  )
  if (roundingConfig.smallestUnit === DAY) {
    const dayTimeFields = roundTimeToSpecialDay(
      zonedDateTime,
      computeNanoInDay(zonedDateTime),
      roundingConfig.roundingMode,
    )
    // TODO: more DRY
    return createDateTime(
      combineISOWithDayTimeFields(zonedDateTime.getISOFields(), dayTimeFields),
    ).toZonedDateTime(zonedDateTime.timeZone)
  }
  return roundZonedDateTime(
    zonedDateTime,
    computeRoundingNanoIncrement(roundingConfig),
    roundingConfig.roundingMode,
  )
}

export function computeNanoInDay(zonedDateTime: ZonedDateTime): number {
  const isoFields = {
    ...zonedDateTime.getISOFields(),
    ...zeroTimeISOFields,
    offset: undefined, // clear explicit offset
  }

  const zdt0 = createZonedDateTime(
    isoFields,
    undefined, // options
    OFFSET_REJECT, // doesn't matter b/c no explicit offset given
  )

  const zdt1 = createZonedDateTime(
    { ...isoFields, ...addWholeDays(isoFields, 1) },
    undefined, // options
    OFFSET_REJECT, // doesn't matter b/c no explicit offset given
  )

  return Number(zdt1.epochNanoseconds - zdt0.epochNanoseconds)
}

export function roundZonedDateTime(
  zonedDateTime: ZonedDateTime,
  nanoIncrement: number,
  roundingFunc: RoundingFunc,
): ZonedDateTime {
  const dateTime = roundDateTime(
    zonedDateTime.toPlainDateTime(), // TODO: way around this conversion?
    nanoIncrement,
    roundingFunc,
  )
  return createZonedDateTime(
    {
      ...dateTime.getISOFields(),
      timeZone: zonedDateTime.timeZone,
      offset: zonedDateTime.offsetNanoseconds, // try to keep same offset with OFFSET_PREFER
    },
    undefined, // options
    OFFSET_PREFER,
  )
}
