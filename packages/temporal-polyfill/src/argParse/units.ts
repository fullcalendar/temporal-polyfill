import { DateUnit, TimeUnit, Unit } from '../args'
import { UnitInt } from '../dateUtils/units'
import { strArrayToHash } from '../utils/obj'

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
  } else if ((num = unitMap[input] as UnitType) == null ||
    num < minUnit ||
    num > maxUnit) {
    throw new Error('Invalid unit ' + input) // TOOD: better error message with setting name
  }
  return num
}
