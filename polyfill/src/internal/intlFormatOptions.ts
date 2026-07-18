import * as errorMessages from './errorMessages'
import { throwTypeError } from './utils'
type OptionFields = Record<
  string,
  Intl.DateTimeFormatOptions[keyof Intl.DateTimeFormatOptions]
>
type DateStyleReplacementFields = Record<
  NonNullable<Intl.DateTimeFormatOptions['dateStyle']>,
  Intl.DateTimeFormatOptions
>

export type OptionsTransformer = (
  options: Intl.DateTimeFormatOptions,
  // Allows an options bag to contain fields that do not apply to this Temporal
  // type, as long as at least one compatible field remains after exclusions are
  // stripped. Intl.DateTimeFormat-with-Temporal-input paths allow this;
  // Temporal.prototype.toLocaleString paths do not.
  allowPartialOverlap?: boolean,
) => Intl.DateTimeFormatOptions

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

  // Partial date types expand dateStyle to the concrete fields they support.
  dateStyleReplacementFields?: DateStyleReplacementFields,
): OptionsTransformer {
  const shapeFieldNameSet = new Set(shapeFieldNames)
  const invalidShapeFieldNameSet = new Set(invalidShapeFieldNames)
  const ignoredFieldNameSet = new Set(ignoredFieldNames)

  return (
    options: Intl.DateTimeFormatOptions,
    allowPartialOverlap?: boolean,
  ): Intl.DateTimeFormatOptions => {
    let dateStyle: Intl.DateTimeFormatOptions['dateStyle']
    let timeStyle: Intl.DateTimeFormatOptions['timeStyle']
    const granularShapeFields: OptionFields = {}
    const modifierFields: OptionFields = {}
    const otherFields: OptionFields = {}
    let hasInvalidGranularShapeFields = false
    let hasInvalidStyleFields = false

    for (const name of Object.keys(options)) {
      const value = options[name as keyof Intl.DateTimeFormatOptions]

      if (value === undefined || ignoredFieldNameSet.has(name)) {
        continue
      }

      if (shapeFieldNameSet.has(name)) {
        if (name === 'dateStyle') {
          dateStyle = value as Intl.DateTimeFormatOptions['dateStyle']
        } else if (name === 'timeStyle') {
          timeStyle = value as Intl.DateTimeFormatOptions['timeStyle']
        } else {
          granularShapeFields[name] = value
        }
      } else if (name === 'era') {
        modifierFields[name] = value
      } else if (invalidShapeFieldNameSet.has(name)) {
        if (name === 'dateStyle' || name === 'timeStyle') {
          hasInvalidStyleFields = true
        } else {
          hasInvalidGranularShapeFields = true
        }
      } else {
        otherFields[name] = value
      }
    }

    const hasDateStyle = dateStyle !== undefined
    const hasTimeStyle = timeStyle !== undefined
    const hasAnyStyle = hasDateStyle || hasTimeStyle
    const hasGranularShapeFields = Object.keys(granularShapeFields).length > 0
    const hasInvalids = hasInvalidGranularShapeFields || hasInvalidStyleFields
    const hasShapeFields =
      hasGranularShapeFields || hasDateStyle || hasTimeStyle
    const hasModifierFields = Object.keys(modifierFields).length > 0
    const hasStyleConflictFields =
      hasGranularShapeFields ||
      hasModifierFields ||
      hasInvalidGranularShapeFields

    if (
      (!allowPartialOverlap && hasInvalids) ||
      (allowPartialOverlap && hasInvalids && !hasShapeFields) ||
      (hasAnyStyle && hasStyleConflictFields)
    ) {
      throwTypeError(errorMessages.invalidFormatOptions)
    }

    const transformedOptions: Intl.DateTimeFormatOptions = {}

    if (!hasAnyStyle && !hasShapeFields) {
      Object.assign(transformedOptions, defaultShapeFields)
    }

    Object.assign(
      transformedOptions,
      granularShapeFields,
      modifierFields,
      otherFields,
    )

    if (hasDateStyle) {
      if (dateStyleReplacementFields) {
        Object.assign(
          transformedOptions,
          dateStyleReplacementFields[dateStyle!],
        )
      } else {
        transformedOptions.dateStyle = dateStyle
      }
    }

    if (hasTimeStyle) {
      transformedOptions.timeStyle = timeStyle
    }

    return transformedOptions
  }
}

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

const yearMonthIgnoredFieldNames = ['weekday', 'day', ...timeShapeFieldNames]
const monthDayIgnoredFieldNames = ['weekday', 'year', ...timeShapeFieldNames]

export const transformInstantOptions = createOptionsTransformer(
  /* shapeFieldNames = */ dateTimeShapeFieldNames,
  /* invalidShapeFieldNames = */ [],
  /* ignoredFieldNames = */ [],
  /* defaultShapeFields = */ dateTimeDefaultShapeFields,
)

export const transformZonedOptions = createOptionsTransformer(
  /* shapeFieldNames = */ dateTimeShapeFieldNames,
  /* invalidShapeFieldNames = */ [],
  /* ignoredFieldNames = */ [],
  /* defaultShapeFields = */ {
    ...dateTimeDefaultShapeFields,
    timeZoneName: 'short',
  },
)

export const transformDateTimeOptions = createOptionsTransformer(
  /* shapeFieldNames = */ dateTimeShapeFieldNames,
  /* invalidShapeFieldNames = */ [],
  /* ignoredFieldNames = */ ['timeZoneName'],
  /* defaultShapeFields = */ dateTimeDefaultShapeFields,
)

export const transformDateOptions = createOptionsTransformer(
  /* shapeFieldNames = */ dateShapeFieldNames,
  /* invalidShapeFieldNames = */ timeShapeFieldNames,
  /* ignoredFieldNames = */ ['timeZoneName'],
  /* defaultShapeFields = */ dateDefaultShapeFields,
)

export const transformTimeOptions = createOptionsTransformer(
  /* shapeFieldNames = */ timeShapeFieldNames,
  /* invalidShapeFieldNames = */ dateShapeFieldNames,
  /* ignoredFieldNames = */ ['timeZoneName', 'era'],
  /* defaultShapeFields = */ timeDefaultShapeFields,
)

export const transformYearMonthOptions = createOptionsTransformer(
  /* shapeFieldNames = */ ['year', 'month', 'dateStyle'],
  // Partial-date types accept only a subset of date fields, but still treat the
  // remaining date/time shape fields as meaningful conflicts.
  /* invalidShapeFieldNames = */ yearMonthIgnoredFieldNames,
  /* ignoredFieldNames = */ ['timeZoneName'],
  /* defaultShapeFields = */ {
    year: 'numeric',
    month: 'numeric',
  },
  /* dateStyleReplacementFields = */ {
    full: { year: 'numeric', month: 'long' },
    long: { year: 'numeric', month: 'long' },
    medium: { year: 'numeric', month: 'short' },
    short: { year: '2-digit', month: 'numeric' },
  },
)

export const transformMonthDayOptions = createOptionsTransformer(
  /* shapeFieldNames = */ ['month', 'day', 'dateStyle'],
  // Partial-date types accept only a subset of date fields, but still treat the
  // remaining date/time shape fields as meaningful conflicts.
  /* invalidShapeFieldNames = */ monthDayIgnoredFieldNames,
  /* ignoredFieldNames = */ ['timeZoneName', 'era'],
  /* defaultShapeFields = */ {
    month: 'numeric',
    day: 'numeric',
  },
  /* dateStyleReplacementFields = */ {
    full: { month: 'long', day: 'numeric' },
    long: { month: 'long', day: 'numeric' },
    medium: { month: 'short', day: 'numeric' },
    short: { month: 'numeric', day: 'numeric' },
  },
)
