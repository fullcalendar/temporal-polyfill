import { requireBoolean, requireInteger, requireIntegerOrUndefined, requirePositiveInteger, requireString, requireStringOrUndefined } from '../internal/cast'

export const yearMonthOnlyRefiners = {
  era: requireStringOrUndefined,
  eraYear: requireIntegerOrUndefined,
  year: requireInteger,
  month: requirePositiveInteger,

  daysInMonth: requirePositiveInteger,
  daysInYear: requirePositiveInteger,
  inLeapYear: requireBoolean,
  monthsInYear: requirePositiveInteger,
}

export const monthOnlyRefiners = {
  monthCode: requireString,
}

export const dayOnlyRefiners = {
  day: requirePositiveInteger,
}

export const dateOnlyRefiners = {
  dayOfWeek: requirePositiveInteger,
  dayOfYear: requirePositiveInteger,
  weekOfYear: requirePositiveInteger,
  yearOfWeek: requireInteger,
  daysInWeek: requirePositiveInteger,
}

export const dateRefiners = {
  ...yearMonthOnlyRefiners,
  ...monthOnlyRefiners,
  ...dayOnlyRefiners,
  ...dateOnlyRefiners,
}
