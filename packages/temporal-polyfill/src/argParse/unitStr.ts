import { Temporal } from 'temporal-spec'
import { UnsignedDurationFields } from '../dateUtils/durationFields'
import { UnitInt } from '../dateUtils/units'
import { strArrayToHash } from '../utils/obj'

// These names must match the indexes of the Unit integers

export const timeUnitNames: Temporal.TimeUnit[] = [
  'nanosecond',
  'microsecond',
  'millisecond',
  'second',
  'minute',
  'hour',
]
export const dateUnitNames: Temporal.DateUnit[] = [
  'day',
  'week',
  'month',
  'year',
]
export const unitNames: Temporal.DateTimeUnit[] = [
  ...timeUnitNames,
  ...dateUnitNames,
]

// Duration / Plurals
// TODO: use Temporal.PluralUnit type somehow?

export const durationUnitNames: (keyof UnsignedDurationFields)[] = unitNames.map(
  (unit) => (unit + 's') as keyof UnsignedDurationFields,
)

// Parsing

const unitMap = strArrayToHash(unitNames, (_str, i) => i)
const pluralUnitMap = strArrayToHash(durationUnitNames, (_str, i) => i)

export function parseUnit<UnitType extends UnitInt>(
  input: Temporal.DateTimeUnit | Temporal.PluralUnit<Temporal.DateTimeUnit> | undefined,
  defaultUnit: UnitType | undefined,
  minUnit: UnitType,
  maxUnit: UnitType,
): UnitType {
  let num: UnitType
  if (input === undefined) {
    if (defaultUnit === undefined) {
      throw new RangeError('Unit is required') // TOOD: better error message with setting name
    }
    num = defaultUnit
  } else {
    num = (unitMap[input] ?? pluralUnitMap[input]) as UnitType

    if (num === undefined || num < minUnit || num > maxUnit) {
      throw new RangeError('Invalid unit ' + input) // TOOD: better error message with setting name
    }
  }

  return num
}
