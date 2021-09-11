import { unitNames } from '../argParse/units'
import { DayTimeUnit } from '../args'
import { TimeFields, timeFieldsToNano } from './time'
import { DayTimeUnitInt, NANOSECOND, nanoIn, nanoInDay } from './units'

export type DayTimeFields = TimeFields & { day: number }

export function dayTimeFieldsToNano(fields: DayTimeFields): number {
  return fields.day * nanoInDay + timeFieldsToNano(fields)
}

export function nanoToDayTimeFields(nano: number, largestUnit: DayTimeUnitInt): DayTimeFields {
  const fields = {} as DayTimeFields

  for (let unit = largestUnit; unit >= NANOSECOND; unit--) {
    const unitNano = nanoIn[unit]
    const whole = Math.trunc(nano / unitNano)
    nano -= whole * unitNano
    fields[unitNames[unit] as DayTimeUnit] = whole
  }

  return fields
}
