import { unitNames } from '../argParse/unitStr'
import { TimeFields, timeFieldsToNano } from './time'
import { DayTimeUnitInt, NANOSECOND, nanoIn, nanoInDayBI, nanoInMilliBI } from './units'

export type DayTimeFields = TimeFields & { day: number }

export function dayTimeFieldsToNano(fields: DayTimeFields): bigint {
  return BigInt(fields.day) * nanoInDayBI + timeFieldsToNano(fields)
}

export function nanoToDayTimeFields(
  nano: bigint,
  largestUnit: DayTimeUnitInt,
): Partial<DayTimeFields> {
  const fields: Partial<DayTimeFields> = {}

  for (let unit = largestUnit; unit >= NANOSECOND; unit--) {
    const unitNano = BigInt(nanoIn[unit])
    const whole = nano / unitNano
    nano -= whole * unitNano
    fields[unitNames[unit] as keyof DayTimeFields] = Number(whole)
  }

  return fields
}

export function splitEpochNano(epochNano: bigint): [
  bigint, bigint, // [dayNano, timeNano]
] {
  const dayNano = epochNano / nanoInMilliBI * nanoInMilliBI
  const timeNano = epochNano - dayNano
  return [dayNano, timeNano]
}

export function joinEpochNano(dayNano: bigint, timeNano: bigint): bigint {
  return dayNano * nanoInDayBI + timeNano
}
