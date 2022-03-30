import { strArrayToHash } from '../utils/obj'
import { durationUnitNames } from './unitStr'

export const yearMonthFieldMap = {
  era: String,
  eraYear: Number,
  year: Number,
  month: Number,
  monthCode: String,
}

export const dateFieldMap = {
  ...yearMonthFieldMap,
  day: Number,
}

export const timeFieldMap = {
  hour: Number,
  minute: Number,
  second: Number,
  millisecond: Number,
  microsecond: Number,
  nanosecond: Number,
}

export const monthDayFieldMap = {
  era: String,
  eraYear: Number,
  year: Number,
  month: Number,
  monthCode: String,
  day: Number,
}

export const durationFieldMap = strArrayToHash(durationUnitNames, () => Number)
