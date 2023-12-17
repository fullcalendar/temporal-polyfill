import { timeFieldNamesAsc } from '../internal/calendarFields'
import { ensureBoolean, ensureInteger, ensureIntegerOrUndefined, ensurePositiveInteger, ensureString, ensureStringOrUndefined, toStringViaPrimitive, toInteger, toStrictInteger, toPositiveInteger } from '../internal/cast'
import { durationFieldNamesAsc } from '../internal/durationFields'
import { mapPropNamesToConstant } from '../internal/utils'

// Refiner Config
// -------------------------------------------------------------------------------------------------
// These refine things on OUTPUT of CalendarProtocol queries

export const yearMonthOnlyRefiners = {
  era: ensureStringOrUndefined,
  eraYear: ensureIntegerOrUndefined,
  year: ensureInteger,
  month: ensurePositiveInteger,

  daysInMonth: ensurePositiveInteger,
  daysInYear: ensurePositiveInteger,
  inLeapYear: ensureBoolean,
  monthsInYear: ensurePositiveInteger,
}

export const monthOnlyRefiners = {
  monthCode: ensureString,
}

export const dayOnlyRefiners = {
  day: ensurePositiveInteger,
}

export const dateOnlyRefiners = {
  dayOfWeek: ensurePositiveInteger,
  dayOfYear: ensurePositiveInteger,
  weekOfYear: ensurePositiveInteger,
  yearOfWeek: ensureInteger,
  daysInWeek: ensurePositiveInteger,
}

export const dateRefiners = {
  ...yearMonthOnlyRefiners,
  ...monthOnlyRefiners,
  ...dayOnlyRefiners,
  ...dateOnlyRefiners,
}

// -------------------------------------------------------------------------------------------------
// These should refine things on INPUT of user-entered fields and should allow {valueOf()}

const dateFieldRefiners = {
  era: toStringViaPrimitive,
  eraYear: toInteger,
  year: toInteger,
  month: toPositiveInteger,
  monthCode: toStringViaPrimitive,
  day: toPositiveInteger,
}

const timeFieldRefiners = mapPropNamesToConstant(timeFieldNamesAsc, toInteger)

const durationFieldRefiners = mapPropNamesToConstant(durationFieldNamesAsc, toStrictInteger)

export const builtinRefiners = {
  ...dateFieldRefiners,
  ...timeFieldRefiners,
  ...durationFieldRefiners,
  offset: toStringViaPrimitive,
}
