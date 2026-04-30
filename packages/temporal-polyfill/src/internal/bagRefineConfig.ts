import { coerceMonthCodeString } from './bagFieldUtils'
import {
  toInteger,
  toPositiveInteger,
  toStrictInteger,
  toStringViaPrimitive,
} from './cast'
import { durationFieldNamesAsc } from './durationFields'
import {
  DateBag,
  DateTimeBag,
  DurationBag,
  MonthDayBag,
  TimeBag,
  TimeFields,
  YearMonthBag,
  timeFieldNamesAsc,
} from './fields'
import { IsoTimeFields, isoTimeFieldNamesAsc } from './isoFields'
import { parseOffsetNano } from './offsetParse'
import { Overflow } from './optionsModel'
import { bindArgs, mapPropNamesToConstant, remapProps } from './utils'

export type PlainDateBag = DateBag & { calendar?: string }
export type PlainDateTimeBag = DateBag & TimeBag & { calendar?: string }
export type ZonedDateTimeBag = PlainDateTimeBag & {
  timeZone: string
  offset?: string
}
export type PlainTimeBag = TimeBag
export type PlainYearMonthBag = YearMonthBag & { calendar?: string }
export type PlainMonthDayBag = MonthDayBag & { calendar?: string }

export type DateOptionsTuple = [overflow: Overflow, ...extraOptions: unknown[]]
export type DateOptionsRefiner<T extends DateOptionsTuple> = () => T
export type OverflowRefiner = () => Overflow

// These maps define the first, property-by-property coercion pass over user
// bags. Calendar-sensitive validation stays in bagFromFields.ts because its
// exact position relative to option reads is observable by test262.
export const dateFieldCoercers = {
  era: toStringViaPrimitive,
  // `year` and `eraYear` are intentionally absent. resolveYear() coerces them
  // after required-field checks and monthCode syntax parsing, preserving the
  // observable error order required by the from-fields algorithms.
  month: toPositiveInteger,
  // The monthCode coercer only validates type. Range validation is deferred to
  // dateFromFields/yearMonthFromFields/monthDayFromFields so missing-field
  // TypeError precedes invalid-monthCode RangeError.
  monthCode(monthCode: unknown, entityName = 'monthCode') {
    return coerceMonthCodeString(monthCode, entityName)
  },
  day: toPositiveInteger,
}

export const timeFieldCoercers = mapPropNamesToConstant(
  timeFieldNamesAsc,
  toInteger,
)

export const durationFieldCoercers = mapPropNamesToConstant(
  durationFieldNamesAsc,
  toStrictInteger,
)

const builtinOffsetCoercers = {
  offset(offsetString: string) {
    const s = toStringViaPrimitive(offsetString)
    // Validate now so bad offset strings fail during the field-coercion pass.
    // Consumers intentionally parse again later when they need the nanoseconds.
    parseOffsetNano(s)
    return s
  },
}

export const builtinFieldCoercers = {
  ...dateFieldCoercers,
  ...timeFieldCoercers,
  ...durationFieldCoercers,
  ...builtinOffsetCoercers,
}

export const timeFieldsToIso = bindArgs(
  remapProps<TimeFields, IsoTimeFields>,
  timeFieldNamesAsc,
  isoTimeFieldNamesAsc,
)

export const isoTimeFieldsToCal = bindArgs(
  remapProps<IsoTimeFields, TimeFields>,
  isoTimeFieldNamesAsc,
  timeFieldNamesAsc,
)

export type { DateBag, DateTimeBag, DurationBag, MonthDayBag, TimeBag }
