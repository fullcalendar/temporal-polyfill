import { strArrayToHash } from '../utils/obj'
import { durationUnitNames } from './unitStr'

export const yearMonthFieldMap = {
  era: String,
  eraYear: refineNumber,
  year: refineNumber,
  month: refineNumber,
  monthCode: String,
}

export const dateFieldMap = {
  ...yearMonthFieldMap,
  day: refineNumber,
}

export const timeFieldMap = {
  hour: refineNumber,
  minute: refineNumber,
  second: refineNumber,
  millisecond: refineNumber,
  microsecond: refineNumber,
  nanosecond: refineNumber,
}

export const monthDayFieldMap = {
  era: String,
  eraYear: refineNumber,
  year: refineNumber,
  month: refineNumber,
  monthCode: String,
  day: refineNumber,
}

// TODO: more DRY with constrainInt
function refineNumber(input: any): number {
  const num = Number(input)

  if (!Number.isFinite(num)) {
    throw new RangeError('Number must be finite')
  }

  return num
}

export const durationFieldMap = strArrayToHash(durationUnitNames, () => Number)
