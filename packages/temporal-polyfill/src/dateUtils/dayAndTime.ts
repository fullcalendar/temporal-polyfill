import { Temporal } from 'temporal-spec'
import { BigNano, createBigNano } from '../utils/bigNano'
import { DurationFields, DurationTimeFields, signDuration } from './durationFields'
import { ISOTimeFields } from './isoFields'
import { LocalTimeFields } from './localFields'
import {
  DAY,
  DayTimeUnitInt,
  HOUR,
  MICROSECOND,
  MILLISECOND,
  MINUTE,
  SECOND,
  milliInDay,
  milliInHour,
  milliInMinute,
  milliInSecond,
  nanoInDay,
  nanoInHour,
  nanoInMicro,
  nanoInMilli,
  nanoInMinute,
  nanoInSecond,
} from './units'

// weird place for this
export type DayTimeUnit = 'day' | Temporal.TimeUnit

export const zeroISOTimeFields: ISOTimeFields = {
  isoHour: 0,
  isoMinute: 0,
  isoSecond: 0,
  isoMillisecond: 0,
  isoMicrosecond: 0,
  isoNanosecond: 0,
}

export const zeroDurationTimeFields: DurationTimeFields = {
  hours: 0,
  minutes: 0,
  seconds: 0,
  milliseconds: 0,
  microseconds: 0,
  nanoseconds: 0,
}

// fields -> fields
// -------------------------------------------------------------------------------------------------

export function partialLocalTimeToISO(fields: Partial<LocalTimeFields>): ISOTimeFields {
  return {
    isoHour: fields.hour || 0,
    isoMinute: fields.minute || 0,
    isoSecond: fields.second || 0,
    isoMillisecond: fields.millisecond || 0,
    isoMicrosecond: fields.microsecond || 0,
    isoNanosecond: fields.nanosecond || 0,
  }
}

// fields -> nano
// -------------------------------------------------------------------------------------------------

export function durationDayTimeToNano(fields: DurationFields): BigNano {
  return createBigNano(nanoInDay)
    .mult(fields.days)
    .add(durationTimeToNano(fields))
}

// must return bigint because there could be huge hour value,
// which would cause the nanosecond's precision to max out.
export function durationTimeToNano(fields: DurationTimeFields): BigNano {
  // we're allowed to ue the constructor because same-sign is guaranteed
  return new BigNano(
    fields.hours * milliInHour +
    fields.minutes * milliInMinute +
    fields.seconds * milliInSecond +
    fields.milliseconds,
    fields.microseconds * nanoInMicro +
    fields.nanoseconds,
  )
}

export function isoTimeToNano(fields: ISOTimeFields): number {
  return fields.isoHour * nanoInHour +
    fields.isoMinute * nanoInMinute +
    fields.isoSecond * nanoInSecond +
    fields.isoMillisecond * nanoInMilli +
    fields.isoMicrosecond * nanoInMicro +
    fields.isoNanosecond
}

// nano -> fields
// -------------------------------------------------------------------------------------------------

export function nanoToDuration(nanoWrap: BigNano, largestUnit: DayTimeUnitInt): DurationFields {
  let nanoseconds = nanoWrap.nanoRemainder
  let microseconds = 0
  let milliseconds = nanoWrap.milli
  let seconds = 0
  let minutes = 0
  let hours = 0
  let days = 0

  switch (largestUnit) {
    case DAY:
      days = Math.trunc(milliseconds / milliInDay)
      milliseconds -= days * milliInDay
      // fall through
    case HOUR:
      hours = Math.trunc(milliseconds / milliInHour)
      milliseconds -= hours * milliInHour
      // fall through
    case MINUTE:
      minutes = Math.trunc(milliseconds / milliInMinute)
      milliseconds -= minutes * milliInMinute
      // fall through
    case SECOND:
      seconds = Math.trunc(milliseconds / milliInSecond)
      milliseconds -= seconds * milliInSecond
      // fall through
    case MILLISECOND:
    case MICROSECOND:
      microseconds = Math.trunc(nanoseconds / nanoInMicro)
      nanoseconds -= microseconds * nanoInMicro
  }

  return signDuration({
    years: 0,
    months: 0,
    weeks: 0,
    days,
    hours,
    minutes,
    seconds,
    milliseconds,
    microseconds,
    nanoseconds,
  })
}

/*
Ensures the resulting ISOTimeFields are positive and within 24 hours.
Will adjust dayDelta if necessary.
*/
export function nanoToISOTime(timeNano: number): [ISOTimeFields, number] {
  const dayDelta = Math.floor(timeNano / nanoInDay)
  timeNano -= dayDelta * nanoInDay // ensures timeNano becomes positive

  const isoHour = Math.floor(timeNano / nanoInHour)
  timeNano -= isoHour * nanoInHour

  const isoMinute = Math.floor(timeNano / nanoInMinute)
  timeNano -= isoMinute * nanoInMinute

  const isoSecond = Math.floor(timeNano / nanoInSecond)
  timeNano -= isoSecond * nanoInSecond

  const isoMillisecond = Math.floor(timeNano / nanoInMilli)
  timeNano -= isoMillisecond * nanoInMilli

  const isoMicrosecond = Math.floor(timeNano / nanoInMicro)
  timeNano -= isoMicrosecond * nanoInMicro

  const isoTimeFields: ISOTimeFields = {
    isoHour,
    isoMinute,
    isoSecond,
    isoMillisecond,
    isoMicrosecond,
    isoNanosecond: timeNano,
  }

  return [isoTimeFields, dayDelta]
}
