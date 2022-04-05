import {
  OFFSET_IGNORE,
  OFFSET_REJECT,
  OFFSET_USE,
  OffsetHandlingInt,
} from '../argParse/offsetHandling'
import { Calendar } from '../public/calendar'
import { createDateTime } from '../public/plainDateTime'
import { TimeZone } from '../public/timeZone'
import { ZonedDateTimeOptions } from '../public/types'
import { roundToMinute } from '../utils/math'
import { zeroISOTimeFields } from './dayAndTime'
import { isoFieldsToEpochNano } from './epoch'
import { addDays } from './translate'
import { ISODateFields, ISODateTimeFields } from './typesPrivate'

export interface OffsetComputableFields extends ISODateTimeFields {
  calendar: Calendar
  timeZone: TimeZone
  offsetNanoseconds?: number // TODO: change this back to `offset`? better for ZonedDateTime?
  Z?: boolean
}

export function checkInvalidOffset(isoFields: OffsetComputableFields): void {
  const { offsetNanoseconds: offsetNano, timeZone, Z } = isoFields

  // a non-Z offset defined? (for ALWAYS use Z as zero offset)
  if (offsetNano !== undefined && !Z) {
    const matchingEpochNano = findMatchingEpochNano(isoFields, offsetNano, timeZone, true)

    if (matchingEpochNano === undefined) {
      throw new RangeError('Mismatching offset/timezone') // TODO: more DRY
    }
  }
}

export function computeZonedDateTimeEpochNano(
  isoFields: OffsetComputableFields,
  fuzzyMatching?: boolean,
  offsetHandling: OffsetHandlingInt = OFFSET_REJECT,
  disambigOptions?: ZonedDateTimeOptions, // TODO: more specific type
): bigint {
  const { offsetNanoseconds: offsetNano, timeZone, Z } = isoFields

  if (offsetNano !== undefined && offsetHandling !== OFFSET_IGNORE) {
    // we ALWAYS use Z as zero offset
    if (offsetHandling === OFFSET_USE || Z) {
      return isoFieldsToEpochNano(isoFields) - BigInt(offsetNano)
    } else {
      const matchingEpochNano = findMatchingEpochNano(
        isoFields,
        offsetNano,
        timeZone,
        fuzzyMatching,
      )
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
  return timeZone.getInstantFor(createDateTime(isoFields), disambigOptions).epochNanoseconds
}

function findMatchingEpochNano(
  isoFields: ISODateTimeFields & { calendar: Calendar },
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

// best file for this?
export function computeNanoInDay(
  fields: ISODateFields & { timeZone: TimeZone },
): number {
  const { timeZone } = fields

  // TODO: awkard with iso8601 calendar
  const day0 = { ...fields, ...zeroISOTimeFields, calendar: new Calendar('iso8601') }
  const day1 = { ...addDays(day0, 1), ...zeroISOTimeFields, calendar: new Calendar('iso8601') }
  const epochNano0 = timeZone.getInstantFor(createDateTime(day0)).epochNanoseconds
  const epochNano1 = timeZone.getInstantFor(createDateTime(day1)).epochNanoseconds

  return Number(epochNano1 - epochNano0)
}
