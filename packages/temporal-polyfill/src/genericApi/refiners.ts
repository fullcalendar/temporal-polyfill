import { timeFieldNamesAsc } from '../internal/calendarFields'
import { ensureBoolean, ensureInteger, ensureIntegerOrUndefined, ensurePositiveInteger, ensureString, ensureStringOrUndefined, ensureStringViaPrimitive, toInteger, toIntegerStrict } from '../internal/cast'
import { durationFieldNamesAsc } from '../internal/durationFields'
import { mapPropNamesToConstant } from '../internal/utils'

// Refiner Config
// -------------------------------------------------------------------------------------------------

export const yearMonthFieldOnlyRefiners = {
  era: ensureStringOrUndefined,
  eraYear: ensureIntegerOrUndefined,
  year: ensureInteger,
  month: ensurePositiveInteger,
}

export const yearMonthOnlyRefiners = {
  ...yearMonthFieldOnlyRefiners,
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

export const dateFieldRefiners = {
  ...yearMonthFieldOnlyRefiners,
  ...monthOnlyRefiners,
  ...dayOnlyRefiners,
}

export const timeFieldRefiners = mapPropNamesToConstant(timeFieldNamesAsc, toInteger)

export const durationFieldRefiners = mapPropNamesToConstant(durationFieldNamesAsc, toIntegerStrict)

// -------------------------------------------------------------------------------------------------

export const builtinRefiners = {
  ...dateFieldRefiners,
  ...timeFieldRefiners,
  ...durationFieldRefiners,
  offset: ensureStringViaPrimitive,
}
