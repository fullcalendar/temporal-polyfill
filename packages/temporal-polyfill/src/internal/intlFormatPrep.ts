import {
  type CalendarSlot,
  getCalendarSlotId,
  isoCalendar,
} from './calendarSlot'
import { isoDateTimeToEpochMilli, isoDateToEpochMilli } from './epochMath'
import * as errorMessages from './errorMessages'
import {
  CalendarDateFields,
  CalendarDateTimeFields,
  TimeFields,
} from './fieldTypes'
import { isoCalendarId } from './intlCalendarConfig'
import { LocalesArg, OptionNames, RawDateTimeFormat } from './intlFormatUtils'
import { EpochNanoFields, ZonedEpochNanoFields, getEpochMilli } from './slots'
import { timeFieldsToNano } from './timeFieldMath'
import { utcTimeZoneId } from './timeZoneConfig'
import { nanoInMilli } from './units'
import { excludePropsByName } from './utils'

/*
RULES:
DateTimeFormat always determines calendar and timeZone. If given date object conflicts, throw error.
However, for ZonedDateTimeFormat::toLocaleString, timeZone is forced by obj and can't be provided.
*/

// Options Transformers
// -----------------------------------------------------------------------------

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

// Transformer Funcs
// -----------------

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

const transformInstantOptions = createOptionsTransformer(
  dateTimeStandardNames,
  dateTimeFallbacks,
)
const transformZonedOptions = createOptionsTransformer(
  dateTimeStandardNames,
  zonedFallbacks,
)
const transformDateTimeOptions = createOptionsTransformer(
  dateTimeStandardNames,
  dateTimeFallbacks,
  /* rejectingExclusions = */ undefined,
  /* silentExclusions = */ timeZoneNameStrs,
  /* suppressTimeZone = */ true,
)
const transformDateOptions = createOptionsTransformer(
  dateStandardNames,
  dateFallbacks,
  /* rejectingExclusions = */ timeStandardNames,
  /* silentExclusions = */ timeZoneNameStrs,
  /* suppressTimeZone = */ true,
  /* styleConflictNames = */ dateStyleConflictNames,
)
const transformTimeOptions = createOptionsTransformer(
  timeStandardNames,
  timeFallbacks,
  /* rejectingExclusions = */ dateStandardNames,
  /* silentExclusions = */ timeZoneNameAndEraExclusions,
  /* suppressTimeZone = */ true,
  /* styleConflictNames = */ timeStyleConflictNames,
)
const transformYearMonthOptions = createOptionsTransformer(
  yearMonthStandardNames,
  yearMonthFallbacks,
  /* rejectingExclusions = */ yearMonthRejectingExclusions,
  /* silentExclusions = */ timeZoneNameStrs,
  /* suppressTimeZone = */ true,
  /* styleConflictNames = */ yearMonthFallbackNames,
  /* partialDateStyleFields = */ yearMonthStyleFields,
  /* partialDateStyleConflictNames = */ yearMonthStyleConflictNames,
)
const transformMonthDayOptions = createOptionsTransformer(
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

// Config Utils
// -----------------------------------------------------------------------------

/*
TODO: improve way range (2 args) is handled

TODO: consider fn api `createFormat` more



*/

// !!!
export type ClassFormatConfig<S> = {
  transformOptions: OptionsTransformer
  slotsToEpochMilli: EpochNanoConverter<S>

  // given slots (maybe 2 sets), intended to get timeZone and force into options
  getForcedTimeZoneId?: (...slotsList: S[]) => string

  // given slots (maybe 2 sets), if enabled, checks to make sure final resolvedOptions
  // not incompatible with slots
  strictCalendarChecks?: boolean
}

export type EpochNanoConverter<S> = (
  slots: S,
  resolvedOptions: Intl.ResolvedDateTimeFormatOptions,
) => number | undefined

// stable reference for caching
const emptyOptions: Intl.DateTimeFormatOptions = {}

// !!!
export type FormatPrepper<S> = (
  locales: LocalesArg | undefined,
  options: Intl.DateTimeFormatOptions | undefined,
  ...slotsList: S[]
) => [Intl.DateTimeFormat, ...number[]]

// !!!
export type FormatQuerier = (
  forcedTimeZoneId: string | undefined,
  locales: LocalesArg | undefined,
  options: Intl.DateTimeFormatOptions,
  transformOptions: OptionsTransformer,
  allowPartialOverlap: boolean,
) => Intl.DateTimeFormat

export function createFormatPrepper<S>(
  config: ClassFormatConfig<S>,
  queryFormat: FormatQuerier = createFormatForPrep,
  // Allows DateTimeFormat-with-Temporal-input callers to reuse one formatter
  // across Temporal types with partially overlapping field sets.
  allowPartialOverlap = false,
): FormatPrepper<S> {
  const { transformOptions, getForcedTimeZoneId } = config

  return (locales, options = emptyOptions, ...slotsList: S[]) => {
    const subformat = queryFormat(
      getForcedTimeZoneId && getForcedTimeZoneId(...slotsList),
      locales,
      options,
      transformOptions,
      allowPartialOverlap,
    )

    const resolvedOptions = subformat.resolvedOptions()

    return [subformat, ...toEpochMillis(config, resolvedOptions, slotsList)]
  }
}

export function createFormatForPrep(
  forcedTimeZoneId: string | undefined, // data-dependent
  locales: LocalesArg | undefined,
  options: Intl.DateTimeFormatOptions,
  transformOptions: OptionsTransformer,
  allowPartialOverlap: boolean,
): Intl.DateTimeFormat {
  options = transformOptions(options, allowPartialOverlap)

  if (forcedTimeZoneId) {
    if (options.timeZone !== undefined) {
      throw new TypeError(errorMessages.forbiddenFormatTimeZone)
    }
    options.timeZone = forcedTimeZoneId
  }

  return new RawDateTimeFormat(locales, options)
}

function getForcedCommonTimeZone(
  slots0?: ZonedEpochNanoFields, // actually needed
  slots1?: ZonedEpochNanoFields, // optional!
): string {
  const timeZone = slots0!.timeZone
  if (slots1 && slots1.timeZone.compareKey !== timeZone.compareKey) {
    throw new RangeError(errorMessages.mismatchingTimeZones)
  }
  return timeZone.id
}

// Config Data
// -----------------------------------------------------------------------------

/*
Detect bug where explicitly specifying calendar:iso8601 results in calendar:gregory
Happens in Node 14 and some version of V8 (Chrome version 80 at least)
https://github.com/nodejs/node/issues/42440
https://codepen.io/arshaw/pen/RNwVewm?editors=0010

If buggy, relax strictCalendarChecks for PlainYearMonth/PlainMonthDay
Much more elegant that intercepting `calendar` in the options, which
requires reading all props with a whitelist to ensure proper call order,
not to mention parsing locale strings like 'en-u-ca-iso8601'
Whitelists are fickle; won't adjust if new DateTimeFormat options added.

TODO: share this DateTimeFormat with computeCurrentTimeZoneId
*/
// HACK for pureTopLevel
function computeNonBuggyIsoResolve() {
  return (
    new RawDateTimeFormat(undefined, {
      calendar: isoCalendarId,
    }).resolvedOptions().calendar === isoCalendarId
  )
}
const nonBuggyIsoResolve = computeNonBuggyIsoResolve()

export const instantConfig: ClassFormatConfig<EpochNanoFields> = {
  transformOptions: transformInstantOptions,
  slotsToEpochMilli: getEpochMilli,
}

export const zonedConfig: ClassFormatConfig<ZonedEpochNanoFields> = {
  transformOptions: transformZonedOptions,
  slotsToEpochMilli: getEpochMilli,
  getForcedTimeZoneId: getForcedCommonTimeZone,
}

function formatTimeToEpochMilli(fields: TimeFields): number {
  return timeFieldsToNano(fields) / nanoInMilli
}

export const dateTimeConfig: ClassFormatConfig<CalendarDateTimeFields> = {
  transformOptions: transformDateTimeOptions,
  slotsToEpochMilli: isoDateTimeToEpochMilli,
}

export const dateConfig: ClassFormatConfig<CalendarDateFields> = {
  transformOptions: transformDateOptions,
  slotsToEpochMilli: isoDateToEpochMilli,
}

export const timeConfig: ClassFormatConfig<TimeFields> = {
  transformOptions: transformTimeOptions,
  slotsToEpochMilli: formatTimeToEpochMilli,
}

export const yearMonthConfig: ClassFormatConfig<CalendarDateFields> = {
  transformOptions: transformYearMonthOptions,
  slotsToEpochMilli: isoDateToEpochMilli,
  strictCalendarChecks: nonBuggyIsoResolve,
}

export const monthDayConfig: ClassFormatConfig<CalendarDateFields> = {
  transformOptions: transformMonthDayOptions,
  slotsToEpochMilli: isoDateToEpochMilli,
  strictCalendarChecks: nonBuggyIsoResolve,
}

// General Epoch Conversion
// -----------------------------------------------------------------------------

function toEpochMillis<S>(
  config: ClassFormatConfig<S>,
  resolvedOptions: Intl.ResolvedDateTimeFormatOptions,
  slotsList: S[],
): number[] {
  const { slotsToEpochMilli, strictCalendarChecks } = config

  return slotsList.map((slots: S) => {
    const calendar = (slots as any).calendar
    if ('calendar' in (slots as any)) {
      checkCalendarsCompatible(
        calendar,
        resolvedOptions.calendar,
        strictCalendarChecks,
      )
    }

    // Formatting only passes already-valid Temporal slots here. The ISO epoch
    // helpers can return undefined for out-of-bounds plain data, but those
    // bounds have been enforced before a Temporal object reaches this point.
    return slotsToEpochMilli(slots, resolvedOptions)!
  })
}

function checkCalendarsCompatible(
  calendarSlot: CalendarSlot,
  resolvedCalendarId: string,
  strictCalendarCheck: boolean | undefined,
): void {
  if (
    (strictCalendarCheck || calendarSlot !== isoCalendar) &&
    getCalendarSlotId(calendarSlot) !== resolvedCalendarId
  ) {
    throw new RangeError(errorMessages.mismatchingCalendars)
  }
}
