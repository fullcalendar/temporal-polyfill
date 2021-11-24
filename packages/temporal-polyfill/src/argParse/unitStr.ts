import { DateFields } from '../dateUtils/date'
import { DurationFields } from '../dateUtils/duration'
import { TimeFields } from '../dateUtils/time'
import { UnitInt } from '../dateUtils/units'
import { YearMonthFields } from '../dateUtils/yearMonth'
import { DateUnit, TimeUnit, Unit } from '../public/types'
import { strArrayToHash } from '../utils/obj'

export type YearMonthUnitProper = keyof YearMonthFields
export type DateUnitProper = keyof DateFields | 'week'
export type TimeUnitProper = keyof TimeFields

// These names must match the indexes of the Unit integers

export const timeUnitNames: TimeUnit[] = [
  'nanosecond',
  'microsecond',
  'millisecond',
  'second',
  'minute',
  'hour',
]
export const dateUnitNames: DateUnit[] = [
  'day',
  'week',
  'month',
  'year',
]
export const unitNames: Unit[] = [
  ...timeUnitNames,
  ...dateUnitNames,
]

// Duration

export const durationUnitNames: (keyof DurationFields)[] = unitNames.map(
  (unit) => (unit + 's') as keyof DurationFields, // plural
)

// Parsing

const unitMap = strArrayToHash(unitNames, (_str, i) => i)

export function parseUnit<UnitType extends UnitInt>(
  input: Unit | undefined,
  defaultUnit: UnitType | undefined,
  minUnit: UnitType,
  maxUnit: UnitType,
): UnitType {
  let num: UnitType
  if (input == null) {
    if (defaultUnit == null) {
      throw new Error('Unit is required') // TOOD: better error message with setting name
    }
    num = defaultUnit
  } else {
    num = (unitMap[input] | unitMap[input + 's']) as UnitType // query plural as well

    if (num == null || num < minUnit || num > maxUnit) {
      throw new Error('Invalid unit ' + input) // TOOD: better error message with setting name
    }
  }

  return num
}
