import { strArrayToHash } from '../utils/obj'
import { durationUnitNames } from './unitStr'

const eraFieldMap = {
  era: String,
  eraYear: refineNumber,
}

export const yearMonthFieldMap = {
  year: refineNumber,
  month: refineNumber,
  monthCode: String,
}

export const allYearMonthFieldMap = {
  ...eraFieldMap,
  ...yearMonthFieldMap,
}

export const monthDayFieldMap = {
  year: refineNumber,
  month: refineNumber,
  monthCode: String,
  day: refineNumber,
}

export const allMonthDayFieldMap = {
  ...eraFieldMap,
  ...monthDayFieldMap,
}

export const dateFieldMap = {
  ...yearMonthFieldMap,
  day: refineNumber,
}

export const allDateFieldMap = {
  ...eraFieldMap,
  ...dateFieldMap,
}

export const timeFieldMap = {
  hour: refineNumber,
  minute: refineNumber,
  second: refineNumber,
  millisecond: refineNumber,
  microsecond: refineNumber,
  nanosecond: refineNumber,
}

export const dateTimeFieldMap = {
  ...dateFieldMap,
  ...timeFieldMap,
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
