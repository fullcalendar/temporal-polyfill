import { NANOSECOND, UnitInt, YEAR } from '../dateUtils/units'
import { DateTimeArg, DurationTotalOptions, Unit } from '../public/types'
import { ensureOptionsObj } from './refine'
import { parseUnit } from './unitStr'

// only for duration

export interface DurationTotalConfig {
  unit: UnitInt,
  relativeTo?: DateTimeArg
}

export function parseTotalConfig(optionsArg: DurationTotalOptions | Unit): DurationTotalConfig {
  let relativeTo: DateTimeArg | undefined
  let unitName: Unit | undefined

  if (typeof optionsArg === 'string') {
    unitName = optionsArg
  } else {
    unitName = ensureOptionsObj(optionsArg).unit
    relativeTo = optionsArg.relativeTo
  }

  return {
    unit: parseUnit<UnitInt>(unitName, undefined, NANOSECOND, YEAR),
    relativeTo,
  }
}
