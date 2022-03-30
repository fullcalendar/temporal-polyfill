import {
  OFFSET_IGNORE,
  OFFSET_REJECT,
  OFFSET_USE,
  OffsetHandlingInt,
} from '../argParse/offsetHandling'
import { createDateTime } from '../public/plainDateTime'
import { TimeZone } from '../public/timeZone'
import { ZonedDateTimeOptions } from '../public/types'
import { ZonedDateTime, createZonedDateTime } from '../public/zonedDateTime'
import { roundToMinute } from '../utils/math'
import { addWholeDays } from './add'
import { isoFieldsToEpochNano, zeroTimeISOFields } from './isoMath'
import { ZonedDateTimeISOEssentials } from './types-private'

export function checkInvalidOffset(isoFields: ZonedDateTimeISOEssentials): void {
  const { offset, timeZone, Z } = isoFields

  // a non-Z offset defined? (for ALWAYS use Z as zero offset)
  if (offset !== undefined && !Z) {
    const matchingEpochNano = findMatchingEpochNano(isoFields, offset, timeZone, true)

    if (matchingEpochNano === undefined) {
      throw new RangeError('Mismatching offset/timezone') // TODO: more DRY
    }
  }
}

export function computeZonedDateTimeEpochNano(
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
