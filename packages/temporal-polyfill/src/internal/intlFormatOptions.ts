import * as errorMessages from './errorMessages'
import { OptionNames } from './intlFormatUtils'
import { utcTimeZoneId } from './timeZoneConfig'
import { excludePropsByName } from './utils'

const numericStr = 'numeric'
const timeZoneNameStrs: OptionNames = ['timeZoneName']
const eraStrs: OptionNames = ['era']

// Fallbacks
// (Used if no Standard Options provided, after Exclusions)

const monthDayFallbacks: Intl.DateTimeFormatOptions = {
  month: numericStr,
  day: numericStr,
}
const yearMonthFallbacks: Intl.DateTimeFormatOptions = {
  year: numericStr,
  month: numericStr,
}
const dateFallbacks: Intl.DateTimeFormatOptions = {
  ...yearMonthFallbacks,
  day: numericStr,
}
const timeFallbacks: Intl.DateTimeFormatOptions = {
  hour: numericStr,
  minute: numericStr,
  second: numericStr,
}
const dateTimeFallbacks: Intl.DateTimeFormatOptions = {
  ...dateFallbacks,
  ...timeFallbacks,
}
const zonedFallbacks: Intl.DateTimeFormatOptions = {
  ...dateTimeFallbacks,
  timeZoneName: 'short',
}

const yearMonthFallbackNames = Object.keys(yearMonthFallbacks) as OptionNames
const monthDayFallbackNames = Object.keys(monthDayFallbacks) as OptionNames
const dateFallbackNames = Object.keys(dateFallbacks) as OptionNames
const timeFallbackNames = Object.keys(timeFallbacks) as OptionNames

// Standard Options
// (See notes for Fallbacks and Exclusions)

const dateStyleNames = ['dateStyle'] as OptionNames
const timeStyleNames = ['timeStyle'] as OptionNames
const yearMonthStandardNames = [...yearMonthFallbackNames, ...dateStyleNames]
const monthDayStandardNames = [...monthDayFallbackNames, ...dateStyleNames]
const dateStandardNames: OptionNames = [
  ...dateFallbackNames,
  ...dateStyleNames,
  'weekday',
]
const timeStandardNames: OptionNames = [
  ...timeFallbackNames,
  'dayPeriod',
  ...timeStyleNames,
  'fractionalSecondDigits',
]
const dateTimeStandardNames: OptionNames = [
  ...dateStandardNames,
  ...timeStandardNames,
]

// Exclusions

const timeZoneNameAndEraExclusions: OptionNames = [
  ...timeZoneNameStrs,
  ...eraStrs,
]
const yearMonthRejectingExclusions: OptionNames = [
  'day',
  'weekday',
  ...timeStandardNames,
]
const monthDayRejectingExclusions: OptionNames = [
  'year',
  'weekday',
  ...timeStandardNames,
]

// Style Conflict Names
// (options that conflict with (date|time)Style)

const dateStyleConflictNames: OptionNames = [
  ...dateFallbackNames,
  'weekday',
  ...eraStrs,
]
const timeStyleConflictNames: OptionNames = [
  'hour',
  'minute',
  'second',
  'dayPeriod',
  'fractionalSecondDigits',
]
const yearMonthStyleConflictNames: OptionNames = [
  ...yearMonthFallbackNames,
  ...eraStrs,
]
const monthDayStyleConflictNames: OptionNames = [
  ...monthDayFallbackNames,
  ...eraStrs,
]

export type OptionsTransformer = (
  options: Intl.DateTimeFormatOptions,
  // Allows an options bag to contain fields that do not apply to this Temporal
  // type, as long as at least one compatible field remains after exclusions are
  // stripped. Intl.DateTimeFormat-with-Temporal-input paths allow this;
  // Temporal.prototype.toLocaleString paths do not.
  allowPartialOverlap: boolean,
) => Intl.DateTimeFormatOptions

function createOptionsTransformer(
  // Fields this Temporal type can actually format. If none of these are
  // defined after excluded fields are stripped, the transformer adds fallbacks
  // instead of passing an empty format shape to Intl.DateTimeFormat.
  standardNames: OptionNames,

  // Fields to apply when none of the standard fields are defined.
  fallbacks: Intl.DateTimeFormatOptions,

  // Fields this type cannot expose directly, and that should count as errors
  // when they do not overlap with the target Temporal type. toLocaleString
  // rejects them immediately; Intl.DateTimeFormat Temporal formatting strips
  // them unless doing so leaves no standard field to format.
  rejectingExclusions?: OptionNames,

  // Fields this type should strip without treating them as caller errors, such
  // as timeZoneName output on Plain types or era output on types without a year.
  silentExclusions?: OptionNames,

  // Plain types need a neutral internal timeZone for Intl.DateTimeFormat, but
  // must not expose a meaningful time zone to callers.
  suppressTimeZone?: boolean,

  // Granular fields that cannot mix with dateStyle/timeStyle because style
  // formats are complete patterns.
  styleConflictNames?: OptionNames,

  // For partial date types, expands dateStyle into the concrete fields that
  // exist on the type, such as year/month or month/day.
  partialDateStyleFields?: Record<string, Intl.DateTimeFormatOptions>,

  // Granular fields that cannot mix with the original partial dateStyle before
  // it is expanded into concrete fields.
  partialDateStyleConflictNames?: OptionNames,
): OptionsTransformer {
  // TODO: maybe define these originally with Set, then we don't need factory
  // architecture, just bindArgs
  const excludedNameSet = new Set([
    ...(rejectingExclusions || []),
    ...(silentExclusions || []),
  ])
  const styleConflictNameSet = new Set(styleConflictNames)

  return (
    options: Intl.DateTimeFormatOptions,

    // Allows DateTimeFormat-created options to include fields for other
    // Temporal types, so long as this Temporal type still has at least one
    // compatible output field after exclusions are stripped.
    allowPartialOverlap: boolean,
  ) => {
    if (partialDateStyleFields) {
      const dateStyle = options.dateStyle
      if (dateStyle !== undefined) {
        throwIfStyleFieldConflicts(options, partialDateStyleConflictNames!)

        if (allowPartialOverlap) {
          // Intl.DateTimeFormat formatting of partial plain dates ignores a
          // paired timeStyle once dateStyle has selected the date pattern.
          options = { ...options, timeStyle: undefined }
        }

        options = {
          ...options,
          dateStyle: undefined,
          ...partialDateStyleFields[dateStyle],
        }
      }
    }

    const hasDateStyle = options.dateStyle !== undefined
    const hasTimeStyle = options.timeStyle !== undefined
    const hasAnyStyle = hasDateStyle || hasTimeStyle

    if (hasAnyStyle && styleConflictNames) {
      const propNames = Object.keys(options) as OptionNames

      // Style formats are complete patterns. ECMA-402 rejects any defined
      // granular field that would also participate in the style pattern.
      for (let i = 0; i < propNames.length; i++) {
        const propName = propNames[i]
        if (
          styleConflictNameSet.has(propName) &&
          options[propName] !== undefined
        ) {
          throw new TypeError(errorMessages.invalidFormatOptions)
        }
      }
    }

    const hasRejectingExclusions =
      rejectingExclusions &&
      hasAnyDefinedPropsByName(options, rejectingExclusions)

    if (!allowPartialOverlap && hasRejectingExclusions) {
      // Temporal.prototype.toLocaleString owns this options bag directly. If
      // the caller asks a Plain type to render an incompatible field, reject it
      // here instead of silently dropping the field and applying fallbacks.
      throw new TypeError(errorMessages.invalidFormatOptions)
    }

    options = excludePropsByName(excludedNameSet, options)

    if (!hasAnyDefinedPropsByName(options, standardNames)) {
      if (allowPartialOverlap && hasRejectingExclusions) {
        // Intl.DateTimeFormat can be constructed with fields for multiple
        // Temporal types. When formatting one Temporal value, drop incompatible
        // fields if a compatible field remains, but reject a formatter whose
        // configured shape has no overlap with the value being formatted.
        // TODO: more specific error about no overlapping options
        throw new TypeError(errorMessages.invalidFormatOptions)
      }

      // Add default output fields while preserving other Intl options and
      // caller-provided values for fallback fields. For example, ZonedDateTime
      // defaults timeZoneName to "short", but callers can still choose another
      // timeZoneName style; getForcedTimeZoneId only handles the timeZone.
      options = { ...fallbacks, ...options }
    }

    if (suppressTimeZone) {
      // Plain types have no time zone, but Intl.DateTimeFormat needs one to
      // turn the ISO fields into an epoch value. Use UTC as a neutral anchor.
      options.timeZone = utcTimeZoneId

      // full/long timeStyle patterns include a time zone name, so downgrade
      // them to keep Plain-type formatting from displaying one.
      if (['full', 'long'].includes(options.timeStyle!)) {
        options.timeStyle = 'medium'
      }
    }

    return options
  }
}

const yearMonthStyleFields: Record<string, Intl.DateTimeFormatOptions> = {
  full: { year: numericStr, month: 'long' },
  long: { year: numericStr, month: 'long' },
  medium: { year: numericStr, month: 'short' },
  short: { year: '2-digit', month: numericStr },
}

const monthDayStyleFields: Record<string, Intl.DateTimeFormatOptions> = {
  full: { month: 'long', day: numericStr },
  long: { month: 'long', day: numericStr },
  medium: { month: 'short', day: numericStr },
  short: { month: numericStr, day: numericStr },
}

export const transformInstantOptions = createOptionsTransformer(
  dateTimeStandardNames,
  dateTimeFallbacks,
)
export const transformZonedOptions = createOptionsTransformer(
  dateTimeStandardNames,
  zonedFallbacks,
)
export const transformDateTimeOptions = createOptionsTransformer(
  dateTimeStandardNames,
  dateTimeFallbacks,
  /* rejectingExclusions = */ undefined,
  /* silentExclusions = */ timeZoneNameStrs,
  /* suppressTimeZone = */ true,
)
export const transformDateOptions = createOptionsTransformer(
  dateStandardNames,
  dateFallbacks,
  /* rejectingExclusions = */ timeStandardNames,
  /* silentExclusions = */ timeZoneNameStrs,
  /* suppressTimeZone = */ true,
  /* styleConflictNames = */ dateStyleConflictNames,
)
export const transformTimeOptions = createOptionsTransformer(
  timeStandardNames,
  timeFallbacks,
  /* rejectingExclusions = */ dateStandardNames,
  /* silentExclusions = */ timeZoneNameAndEraExclusions,
  /* suppressTimeZone = */ true,
  /* styleConflictNames = */ timeStyleConflictNames,
)
export const transformYearMonthOptions = createOptionsTransformer(
  yearMonthStandardNames,
  yearMonthFallbacks,
  /* rejectingExclusions = */ yearMonthRejectingExclusions,
  /* silentExclusions = */ timeZoneNameStrs,
  /* suppressTimeZone = */ true,
  /* styleConflictNames = */ yearMonthFallbackNames,
  /* partialDateStyleFields = */ yearMonthStyleFields,
  /* partialDateStyleConflictNames = */ yearMonthStyleConflictNames,
)
export const transformMonthDayOptions = createOptionsTransformer(
  monthDayStandardNames,
  monthDayFallbacks,
  /* rejectingExclusions = */ monthDayRejectingExclusions,
  /* silentExclusions = */ timeZoneNameAndEraExclusions,
  /* suppressTimeZone = */ true,
  /* styleConflictNames = */ monthDayFallbackNames,
  /* partialDateStyleFields = */ monthDayStyleFields,
  /* partialDateStyleConflictNames = */ monthDayStyleConflictNames,
)

function hasAnyDefinedPropsByName<P extends {}>(
  props: P,
  names: (keyof P)[],
): boolean {
  // Undefined style options are explicitly treated as absent by ECMA-402.
  // Keep this separate from hasAnyPropsByName, whose "in" semantics are useful
  // in option-ordering code elsewhere.
  for (let i = 0; i < names.length; i++) {
    const name = names[i]
    if (props[name] !== undefined) {
      return true
    }
  }
  return false
}

function throwIfStyleFieldConflicts(
  options: Intl.DateTimeFormatOptions,
  conflictNames: OptionNames,
): void {
  for (let i = 0; i < conflictNames.length; i++) {
    const conflictName = conflictNames[i]
    if (options[conflictName] !== undefined) {
      throw new TypeError(errorMessages.invalidFormatOptions)
    }
  }
}
