import { Temporal } from 'temporal-spec'
import { LargeInt, createLargeInt } from '../utils/largeInt'
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

export function durationDayTimeToNano(fields: DurationFields): LargeInt {
  return createLargeInt(nanoInDay)
    .mult(fields.days)
    .add(durationTimeToNano(fields))
}

// must return bigint because there could be huge hour value,
// which would cause the nanosecond's precision to max out.
export function durationTimeToNano(fields: DurationTimeFields): LargeInt {
  return createLargeInt(fields.nanoseconds)
    .add(createLargeInt(fields.microseconds).mult(nanoInMicro))
    .add(createLargeInt(fields.milliseconds).mult(nanoInMilli))
    .add(createLargeInt(fields.seconds).mult(nanoInSecond))
    .add(createLargeInt(fields.minutes).mult(nanoInMinute))
    .add(createLargeInt(fields.hours).mult(nanoInHour))
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

export function nanoToDuration(nano: LargeInt, largestUnit: DayTimeUnitInt): DurationFields {
  let days = 0
  let hours = 0
  let minutes = 0
  let seconds = 0
  let milliseconds = 0
  let microseconds = 0
  let temp: LargeInt

  switch (largestUnit) {
    case DAY:
      temp = nano.div(nanoInDay)
      days = temp.toNumber()
      nano = nano.sub(temp.mult(nanoInDay))
      // fall through
    case HOUR:
      temp = nano.div(nanoInHour)
      hours = temp.toNumber()
      nano = nano.sub(temp.mult(nanoInHour))
      // fall through
    case MINUTE:
      temp = nano.div(nanoInMinute)
      minutes = temp.toNumber()
      nano = nano.sub(temp.mult(nanoInMinute))
      // fall through
    case SECOND:
      temp = nano.div(nanoInSecond)
      seconds = temp.toNumber()
      nano = nano.sub(temp.mult(nanoInSecond))
      // fall through
    case MILLISECOND:
      temp = nano.div(nanoInMilli)
      milliseconds = temp.toNumber()
      nano = nano.sub(temp.mult(nanoInMilli))
      // fall through
    case MICROSECOND:
      temp = nano.div(nanoInMicro)
      microseconds = temp.toNumber()
      nano = nano.sub(temp.mult(nanoInMicro))
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
    nanoseconds: nano.toNumber(),
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
