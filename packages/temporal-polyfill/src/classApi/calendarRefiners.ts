import { ensureBoolean, ensureInteger, ensureIntegerOrUndefined, ensurePositiveInteger, ensureString, ensureStringOrUndefined } from '../internal/cast'

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
