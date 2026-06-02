import * as errorMessages from './errorMessages'
import { utcTimeZoneId } from './timeZoneConfig'

type OptionFields = Record<
  string,
  Intl.DateTimeFormatOptions[keyof Intl.DateTimeFormatOptions]
>
type DateStyleReplacementFields = Record<
  NonNullable<Intl.DateTimeFormatOptions['dateStyle']>,
  Intl.DateTimeFormatOptions
>

const modifierFieldNames = ['era']

interface OptionsAnalysis {
  dateStyle: Intl.DateTimeFormatOptions['dateStyle']
  timeStyle: Intl.DateTimeFormatOptions['timeStyle']
  granularShapeFields: OptionFields
  modifierFields: OptionFields
  otherFields: OptionFields
  hasInvalidGranularShapeFields: boolean
  hasInvalidStyleFields: boolean
}

export type OptionsTransformer = (
  options: Intl.DateTimeFormatOptions,
  // Allows an options bag to contain fields that do not apply to this Temporal
  // type, as long as at least one compatible field remains after exclusions are
  // stripped. Intl.DateTimeFormat-with-Temporal-input paths allow this;
  // Temporal.prototype.toLocaleString paths do not.
  allowPartialOverlap: boolean,
) => Intl.DateTimeFormatOptions

function analyzeOptions(
  options: Intl.DateTimeFormatOptions,
  shapeFieldNames: readonly string[],
  invalidShapeFieldNames: readonly string[],
  ignoredFieldNames: readonly string[],
): OptionsAnalysis {
  // TODO: cache these Sets somewhere first
  const shapeFieldNameSet = new Set(shapeFieldNames)
  const modifierFieldNameSet = new Set(modifierFieldNames)
  const invalidShapeFieldNameSet = new Set(invalidShapeFieldNames)
  const ignoredFieldNameSet = new Set(ignoredFieldNames)

  const analysis: OptionsAnalysis = {
    dateStyle: undefined,
    timeStyle: undefined,
    granularShapeFields: {},
    modifierFields: {},
    otherFields: {},
    hasInvalidGranularShapeFields: false,
    hasInvalidStyleFields: false,
  }

  for (const name of Object.keys(options)) {
    const value = options[name as keyof Intl.DateTimeFormatOptions]

    if (value === undefined || ignoredFieldNameSet.has(name)) {
      continue
    }

    if (shapeFieldNameSet.has(name)) {
      if (name === 'dateStyle') {
        analysis.dateStyle = value as Intl.DateTimeFormatOptions['dateStyle']
      } else if (name === 'timeStyle') {
        analysis.timeStyle = value as Intl.DateTimeFormatOptions['timeStyle']
      } else {
        analysis.granularShapeFields[name] = value
      }
    } else if (modifierFieldNameSet.has(name)) {
      analysis.modifierFields[name] = value
    } else if (invalidShapeFieldNameSet.has(name)) {
      if (name === 'dateStyle' || name === 'timeStyle') {
        analysis.hasInvalidStyleFields = true
      } else {
        analysis.hasInvalidGranularShapeFields = true
      }
    } else {
      analysis.otherFields[name] = value
    }
  }

  return analysis
}

function createOptionsTransformer(
  // Fields that define the visible output shape for this Temporal type.
  shapeFieldNames: readonly string[],

  // Shape fields that belong to other Temporal types. These can be stripped on
  // DateTimeFormat-created paths with partial overlap, but otherwise reject.
  invalidShapeFieldNames: readonly string[],

  // Fields to remove without treating them as caller errors.
  ignoredFieldNames: readonly string[],

  // Fields to inject when the caller selected no output shape.
  defaultShapeFields: Intl.DateTimeFormatOptions,

  // Plain types need a neutral internal timeZone for Intl.DateTimeFormat, but
  // must not expose a meaningful time zone to callers.
  // TODO: move elsewehre
  suppressTimeZone: boolean,

  // Partial date types expand dateStyle to the concrete fields they support.
  dateStyleReplacementFields?: DateStyleReplacementFields,
): OptionsTransformer {
  return (
    options: Intl.DateTimeFormatOptions,
    allowPartialOverlap: boolean,
  ): Intl.DateTimeFormatOptions => {
    const analysis = analyzeOptions(
      options,
      shapeFieldNames,
      invalidShapeFieldNames,
      ignoredFieldNames,
    )

    const hasDateStyle = analysis.dateStyle !== undefined
    const hasTimeStyle = analysis.timeStyle !== undefined
    const hasAnyStyle = hasDateStyle || hasTimeStyle
    const hasGranularShapeFields =
      Object.keys(analysis.granularShapeFields).length > 0
    const hasInvalids =
      analysis.hasInvalidGranularShapeFields || analysis.hasInvalidStyleFields
    const hasShapeFields =
      hasGranularShapeFields || hasDateStyle || hasTimeStyle
    const hasModifierFields = Object.keys(analysis.modifierFields).length > 0
    const hasStyleConflictFields =
      hasGranularShapeFields ||
      hasModifierFields ||
      analysis.hasInvalidGranularShapeFields

    if (
      (!allowPartialOverlap && hasInvalids) ||
      (allowPartialOverlap && hasInvalids && !hasShapeFields) ||
      (hasAnyStyle && hasStyleConflictFields)
    ) {
      throw new TypeError(errorMessages.invalidFormatOptions)
    }

    const transformedOptions: Intl.DateTimeFormatOptions = {}

    if (!hasAnyStyle && !hasShapeFields) {
      Object.assign(transformedOptions, defaultShapeFields)
    }

    Object.assign(
      transformedOptions,
      analysis.granularShapeFields,
      analysis.modifierFields,
      analysis.otherFields,
    )

    if (hasDateStyle) {
      if (dateStyleReplacementFields) {
        Object.assign(
          transformedOptions,
          dateStyleReplacementFields[analysis.dateStyle!],
        )
      } else {
        transformedOptions.dateStyle = analysis.dateStyle
      }
    }

    if (hasTimeStyle) {
      transformedOptions.timeStyle = analysis.timeStyle
    }

    if (suppressTimeZone) {
      // Plain types have no time zone, but the later Intl formatting path
      // still needs a neutral one to convert their ISO fields to an epoch.
      transformedOptions.timeZone = utcTimeZoneId

      // full/long timeStyle would expose a time zone name, so downgrade it.
      if (['full', 'long'].includes(transformedOptions.timeStyle!)) {
        transformedOptions.timeStyle = 'medium'
      }
    }

    return transformedOptions
  }
}

// Shape fields are options that define the visible Temporal output shape.
const dateShapeFieldNames = ['weekday', 'year', 'month', 'day', 'dateStyle']
const timeShapeFieldNames = [
  'dayPeriod',
  'hour',
  'minute',
  'second',
  'fractionalSecondDigits',
  'timeStyle',
]
const dateTimeShapeFieldNames = [...dateShapeFieldNames, ...timeShapeFieldNames]

// Partial-date types accept only a subset of date fields, but still treat the
// remaining date/time shape fields as meaningful conflicts.
const yearMonthShapeFieldNames = ['year', 'month', 'dateStyle']
const yearMonthInvalidShapeFieldNames = [
  'weekday',
  'day',
  ...timeShapeFieldNames,
]

const monthDayShapeFieldNames = ['month', 'day', 'dateStyle']
const monthDayInvalidShapeFieldNames = [
  'weekday',
  'year',
  ...timeShapeFieldNames,
]

// These options are known DateTimeFormat shape-ish fields, but some Temporal
// types intentionally remove them without treating them as caller errors.
const timeZoneNameStrs = ['timeZoneName']
const timeZoneNameAndEraStrs = ['timeZoneName', 'era']

// Defaults are injected only when the caller did not select any shape fields.
const dateDefaultShapeFields: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
}
const timeDefaultShapeFields: Intl.DateTimeFormatOptions = {
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
}
const dateTimeDefaultShapeFields: Intl.DateTimeFormatOptions = {
  ...dateDefaultShapeFields,
  ...timeDefaultShapeFields,
}
const zonedDateTimeDefaultShapeFields: Intl.DateTimeFormatOptions = {
  ...dateTimeDefaultShapeFields,
  timeZoneName: 'short',
}
const yearMonthDefaultShapeFields: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'numeric',
}
const monthDayDefaultShapeFields: Intl.DateTimeFormatOptions = {
  month: 'numeric',
  day: 'numeric',
}

export const transformInstantOptions = createOptionsTransformer(
  /* shapeFieldNames = */ dateTimeShapeFieldNames,
  /* invalidShapeFieldNames = */ [],
  /* ignoredFieldNames = */ [],
  /* defaultShapeFields = */ dateTimeDefaultShapeFields,
  /* suppressTimeZone = */ false,
)

export const transformZonedOptions = createOptionsTransformer(
  /* shapeFieldNames = */ dateTimeShapeFieldNames,
  /* invalidShapeFieldNames = */ [],
  /* ignoredFieldNames = */ [],
  /* defaultShapeFields = */ zonedDateTimeDefaultShapeFields,
  /* suppressTimeZone = */ false,
)

export const transformDateTimeOptions = createOptionsTransformer(
  /* shapeFieldNames = */ dateTimeShapeFieldNames,
  /* invalidShapeFieldNames = */ [],
  /* ignoredFieldNames = */ timeZoneNameStrs,
  /* defaultShapeFields = */ dateTimeDefaultShapeFields,
  /* suppressTimeZone = */ true,
)

export const transformDateOptions = createOptionsTransformer(
  /* shapeFieldNames = */ dateShapeFieldNames,
  /* invalidShapeFieldNames = */ timeShapeFieldNames,
  /* ignoredFieldNames = */ timeZoneNameStrs,
  /* defaultShapeFields = */ dateDefaultShapeFields,
  /* suppressTimeZone = */ true,
)

export const transformTimeOptions = createOptionsTransformer(
  /* shapeFieldNames = */ timeShapeFieldNames,
  /* invalidShapeFieldNames = */ dateShapeFieldNames,
  /* ignoredFieldNames = */ timeZoneNameAndEraStrs,
  /* defaultShapeFields = */ timeDefaultShapeFields,
  /* suppressTimeZone = */ true,
)

export const transformYearMonthOptions = createOptionsTransformer(
  /* shapeFieldNames = */ yearMonthShapeFieldNames,
  /* invalidShapeFieldNames = */ yearMonthInvalidShapeFieldNames,
  /* ignoredFieldNames = */ timeZoneNameStrs,
  /* defaultShapeFields = */ yearMonthDefaultShapeFields,
  /* suppressTimeZone = */ true,
  /* dateStyleReplacementFields = */ {
    full: { year: 'numeric', month: 'long' },
    long: { year: 'numeric', month: 'long' },
    medium: { year: 'numeric', month: 'short' },
    short: { year: '2-digit', month: 'numeric' },
  },
)

export const transformMonthDayOptions = createOptionsTransformer(
  /* shapeFieldNames = */ monthDayShapeFieldNames,
  /* invalidShapeFieldNames = */ monthDayInvalidShapeFieldNames,
  /* ignoredFieldNames = */ timeZoneNameAndEraStrs,
  /* defaultShapeFields = */ monthDayDefaultShapeFields,
  /* suppressTimeZone = */ true,
  /* dateStyleReplacementFields = */ {
    full: { month: 'long', day: 'numeric' },
    long: { month: 'long', day: 'numeric' },
    medium: { month: 'short', day: 'numeric' },
    short: { month: 'numeric', day: 'numeric' },
  },
)
