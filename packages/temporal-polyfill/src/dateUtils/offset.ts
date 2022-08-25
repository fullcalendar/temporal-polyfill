import { Temporal } from 'temporal-spec'
import { parseDisambigOption } from '../argParse/disambig'
import {
  OFFSET_IGNORE,
  OFFSET_REJECT,
  OFFSET_USE,
  OffsetHandlingInt,
} from '../argParse/offsetHandling'
import { Calendar } from '../public/calendar'
import { Instant } from '../public/instant'
import { createDateTime } from '../public/plainDateTime'
import { LargeInt } from '../utils/largeInt'
import { roundToMinute } from '../utils/math'
import { zeroISOTimeFields } from './dayAndTime'
import { epochNanoSymbol, isoFieldsToEpochNano } from './epoch'
import { ISODateFields, ISODateTimeFields } from './isoFields'
import { getInstantFor } from './timeZone'
import { addDays } from './translate'

export interface OffsetComputableFields extends ISODateTimeFields {
  calendar: Temporal.CalendarProtocol
  timeZone: Temporal.TimeZoneProtocol
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
  disambigOptions?: Temporal.AssignmentOptions,
): LargeInt {
  const { offsetNanoseconds: offsetNano, timeZone, Z } = isoFields

  if (offsetNano !== undefined && offsetHandling !== OFFSET_IGNORE) {
    // we ALWAYS use Z as zero offset
    if (offsetHandling === OFFSET_USE || Z) {
      return isoFieldsToEpochNano(isoFields).sub(offsetNano)
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
  const instant = getInstantFor(
    timeZone,
    createDateTime(isoFields),
    parseDisambigOption(disambigOptions),
  )

  // TODO: better typing solution
  return (instant as Instant)[epochNanoSymbol]
}

function findMatchingEpochNano(
  isoFields: ISODateTimeFields & { calendar: Temporal.CalendarProtocol },
  offsetNano: number,
  timeZone: Temporal.TimeZoneProtocol,
  fuzzyMatching?: boolean,
): LargeInt | undefined {
  const possibleInstants = timeZone.getPossibleInstantsFor(createDateTime(isoFields))
  const utcEpochNano = isoFieldsToEpochNano(isoFields)
  const roundedOffsetNano = fuzzyMatching ? roundToMinute(offsetNano) : offsetNano

  for (const instant of possibleInstants) {
    const possibleEpochNano = (instant as Instant)[epochNanoSymbol] // TODO: better typing
    const possibleOffsetNano = utcEpochNano.sub(possibleEpochNano).toNumber()
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
  fields: ISODateFields & { timeZone: Temporal.TimeZoneProtocol },
): number {
  const { timeZone } = fields

  // TODO: awkard with iso8601 calendar
  const day0 = { ...fields, ...zeroISOTimeFields, calendar: new Calendar('iso8601') }
  const day1 = { ...addDays(day0, 1), ...zeroISOTimeFields, calendar: new Calendar('iso8601') }
  const epochNano0 = (getInstantFor(timeZone, createDateTime(day0)) as Instant)[epochNanoSymbol]
  const epochNano1 = (getInstantFor(timeZone, createDateTime(day1)) as Instant)[epochNanoSymbol]

  return epochNano1.sub(epochNano0).toNumber()
}
