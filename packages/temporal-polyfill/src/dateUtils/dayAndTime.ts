import { signDuration } from './durationFields'
import { DurationFields, DurationTimeFields, ISOTimeFields, LocalTimeFields } from './typesPrivate'
import {
  DAY,
  DayTimeUnitInt,
  HOUR,
  MICROSECOND,
  MILLISECOND,
  MINUTE,
  SECOND,
  nanoInDay,
  nanoInDayBI,
  nanoInHour,
  nanoInHourBI,
  nanoInMicro,
  nanoInMicroBI,
  nanoInMilli,
  nanoInMilliBI,
  nanoInMinute,
  nanoInMinuteBI,
  nanoInSecond,
  nanoInSecondBI,
} from './units'

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

export function durationDayTimeToNano(fields: DurationFields): bigint {
  return BigInt(fields.days) * nanoInDayBI + durationTimeToNano(fields)
}

// must return bigint because there could be huge hour value,
// which would cause the nanosecond's precision to max out.
export function durationTimeToNano(fields: DurationTimeFields): bigint {
  return BigInt(fields.hours) * nanoInHourBI +
    BigInt(fields.minutes) * nanoInMinuteBI +
    BigInt(fields.seconds) * nanoInSecondBI +
    BigInt(fields.milliseconds) * nanoInMilliBI +
    BigInt(fields.microseconds) * nanoInMicroBI +
    BigInt(fields.nanoseconds)
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

export function nanoToDuration(nano: bigint, largestUnit: DayTimeUnitInt): DurationFields {
  let days = 0
  let hours = 0
  let minutes = 0
  let seconds = 0
  let milliseconds = 0
  let microseconds = 0
  let temp: bigint

  switch (largestUnit) {
    case DAY:
      temp = nano / nanoInDayBI // does trunc
      days = Number(temp)
      nano -= temp * nanoInDayBI
      // fall through
    case HOUR:
      temp = nano / nanoInHourBI
      hours = Number(temp)
      nano -= temp * nanoInHourBI
      // fall through
    case MINUTE:
      temp = nano / nanoInMinuteBI
      minutes = Number(temp)
      nano -= temp * nanoInMinuteBI
      // fall through
    case SECOND:
      temp = nano / nanoInSecondBI
      seconds = Number(temp)
      nano -= temp * nanoInSecondBI
      // fall through
    case MILLISECOND:
      temp = nano / nanoInMilliBI
      milliseconds = Number(temp)
      nano -= temp * nanoInMilliBI
      // fall through
    case MICROSECOND:
      temp = nano / nanoInMicroBI
      microseconds = Number(temp)
      nano -= temp * nanoInMicroBI
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
    nanoseconds: Number(nano),
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
