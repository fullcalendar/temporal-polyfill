import { Temporal } from 'temporal-spec'
import { NANOSECOND, UnitInt, YEAR } from '../dateUtils/units'
import { PlainDateTimeArg } from '../public/plainDateTime'
import { ensureOptionsObj } from './refine'
import { parseUnit } from './unitStr'

// only for duration

export interface DurationTotalConfig {
  unit: UnitInt,
  relativeTo?: PlainDateTimeArg
}

export function parseTotalConfig(optionsArg: Temporal.DurationTotalOf): DurationTotalConfig {
  let relativeTo: PlainDateTimeArg | undefined
  let unitName: Temporal.TotalUnit<Temporal.DateTimeUnit> | undefined

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
