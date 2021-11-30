import { unitNames } from '../argParse/unitStr'
import { TimeFields, timeFieldsToNano } from './time'
import { DayTimeUnitInt, NANOSECOND, nanoIn, nanoInDay } from './units'

export type DayTimeFields = TimeFields & { day: number }

export function dayTimeFieldsToNano(fields: DayTimeFields): number {
  return fields.day * nanoInDay + timeFieldsToNano(fields)
}

export function nanoToDayTimeFields(
  nano: number,
  largestUnit: DayTimeUnitInt,
): Partial<DayTimeFields> {
  const fields: Partial<DayTimeFields> = {}

  for (let unit = largestUnit; unit >= NANOSECOND; unit--) {
    const unitNano = nanoIn[unit]
    const whole = Math.trunc(nano / unitNano)
    nano -= whole * unitNano
    fields[unitNames[unit] as keyof DayTimeFields] = whole
  }

  return fields
}

export function splitEpochNano(epochNano: bigint): [
  bigint, number, // [dayNano, timeNano]
] {
  const dayNano = epochNano / BigInt(nanoInDay) * BigInt(nanoInDay)
  const timeNano = Number(epochNano - dayNano)
  return [dayNano, timeNano]
}

export function joinEpochNano(dayNano: bigint, timeNano: number): bigint {
  return dayNano * BigInt(nanoInDay) + BigInt(timeNano)
}
