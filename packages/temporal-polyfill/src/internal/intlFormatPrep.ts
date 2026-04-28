import { isoCalendarId } from './calendarConfig'
import * as errorMessages from './errorMessages'
import { LocalesArg, OptionNames, RawDateTimeFormat } from './intlFormatUtils'
import { IsoDateFields, IsoDateTimeFields, IsoTimeFields } from './isoFields'
import { EpochAndZoneSlots, EpochSlots, getEpochMilli } from './slots'
import { isoTimeFieldsToNano, isoToEpochMilli } from './timeMath'
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
// (Silently removed)

const dateExclusions: OptionNames = [...timeZoneNameStrs, ...timeStandardNames]
const timeExclusions: OptionNames = [
  ...timeZoneNameStrs,
  ...dateStandardNames,
  ...eraStrs,
]
const yearMonthExclusions: OptionNames = [
  ...timeZoneNameStrs,
  'day',
  'weekday',
  ...timeStandardNames,
]
const monthDayExclusions: OptionNames = [
  ...timeZoneNameStrs,
  ...eraStrs,
  'year',
  'weekday',
  ...timeStandardNames,
]
const silentExclusionNames = new Set<OptionNames[number]>([
  ...timeZoneNameStrs,
  ...eraStrs,
])

// Transformer Funcs
// -----------------

export type OptionsTransformer = (
  options: Intl.DateTimeFormatOptions,
  strictOptions: boolean,
) => Intl.DateTimeFormatOptions

function createOptionsTransformer(
  standardNames: OptionNames,
  fallbacks: Intl.DateTimeFormatOptions,
  exclusions?: OptionNames,
  styleConflictNames?: OptionNames,
): OptionsTransformer {
  const excludedNameSet = new Set(exclusions)
  const styleConflictNameSet = new Set(styleConflictNames)

  return (options: Intl.DateTimeFormatOptions, strictOptions: boolean) => {
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

    const hasHardExclusions = // HACK
      exclusions && hasAnyHardExclusion(options, exclusions)

    if (!strictOptions && hasHardExclusions) {
      throw new TypeError(errorMessages.invalidFormatOptions)
    }

    options = excludePropsByName(excludedNameSet, options)

    if (!hasAnyDefinedPropsByName(options, standardNames)) {
      if (strictOptions && hasHardExclusions) {
        // TODO: more specific error about no overlapping options
        throw new TypeError(errorMessages.invalidFormatOptions)
      }

      // still allow options to override fallbacks if present
      options = { ...fallbacks, ...options }
    }

    // HACK: this condition is a proxy for whether this is a Plain type
    // The Plain types are silently forced to UTC
    if (exclusions) {
      options.timeZone = utcTimeZoneId

      // ensure timeStyle doesn't display time zone
      if (['full', 'long'].includes(options.timeStyle!)) {
        options.timeStyle = 'medium'
      }
    }

    return options
  }
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
  timeZoneNameStrs,
)
const transformDateOptions = createOptionsTransformer(
  dateStandardNames,
  dateFallbacks,
  dateExclusions,
  [...dateFallbackNames, 'weekday', ...eraStrs],
)
const transformTimeOptions = createOptionsTransformer(
  timeStandardNames,
  timeFallbacks,
  timeExclusions,
  ['hour', 'minute', 'second', 'dayPeriod', 'fractionalSecondDigits'],
)
const transformYearMonthBaseOptions = createOptionsTransformer(
  yearMonthStandardNames,
  yearMonthFallbacks,
  yearMonthExclusions,
  yearMonthFallbackNames,
)
const transformMonthDayBaseOptions = createOptionsTransformer(
  monthDayStandardNames,
  monthDayFallbacks,
  monthDayExclusions,
  monthDayFallbackNames,
)

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

const transformYearMonthOptions = createPartialDateStyleTransformer(
  transformYearMonthBaseOptions,
  yearMonthStyleFields,
  [...yearMonthFallbackNames, ...eraStrs],
)
const transformMonthDayOptions = createPartialDateStyleTransformer(
  transformMonthDayBaseOptions,
  monthDayStyleFields,
  [...monthDayFallbackNames, ...eraStrs],
)

function createPartialDateStyleTransformer(
  baseTransformer: OptionsTransformer,
  styleFields: Record<string, Intl.DateTimeFormatOptions>,
  styleConflictNames: OptionNames,
): OptionsTransformer {
  return (options: Intl.DateTimeFormatOptions, strictOptions: boolean) => {
    if (options.timeStyle !== undefined && !strictOptions) {
      throw new TypeError(errorMessages.invalidFormatOptions)
    }

    const dateStyle = options.dateStyle
    if (dateStyle !== undefined) {
      throwIfStyleFieldConflicts(options, styleConflictNames)

      if (strictOptions) {
        // Intl.DateTimeFormat formatting of partial plain dates ignores a
        // paired timeStyle once dateStyle has selected the date pattern.
        options = { ...options, timeStyle: undefined }
      }

      options = {
        ...options,
        dateStyle: undefined,
        ...styleFields[dateStyle],
      }
    }

    return baseTransformer(options, strictOptions)
  }
}

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

function hasAnyHardExclusion<P extends {}>(
  props: P,
  names: (keyof P)[],
): boolean {
  for (let i = 0; i < names.length; i++) {
    const name = names[i]
    if (
      !silentExclusionNames.has(name as OptionNames[number]) &&
      props[name] !== undefined
    ) {
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

export type ClassFormatConfig<S> = [
  optionsTransformer: OptionsTransformer,
  slotsToEpochMilli: EpochNanoConverter<S>,
  strictCalendarChecks?: boolean,
  getForcedTimeZoneId?: (...slotsList: S[]) => string,
]

export type EpochNanoConverter<S> = (
  slots: S,
  resolvedOptions: Intl.ResolvedDateTimeFormatOptions,
) => number

// stable reference for caching
const emptyOptions: Intl.DateTimeFormatOptions = {}

export type FormatPrepper<S> = (
  locales: LocalesArg | undefined,
  options: Intl.DateTimeFormatOptions | undefined,
  ...slotsList: S[]
) => [Intl.DateTimeFormat, ...number[]]

export type FormatQuerier = (
  forcedTimeZoneId: string | undefined,
  locales: LocalesArg | undefined,
  options: Intl.DateTimeFormatOptions,
  transformOptions: OptionsTransformer,
  strictOptions: boolean,
) => Intl.DateTimeFormat

export function createFormatPrepper<S>(
  config: ClassFormatConfig<S>,
  queryFormat: FormatQuerier = createFormatForPrep,
  strictOptions = false,
): FormatPrepper<S> {
  const [transformOptions, , , getForcedTimeZoneId] = config

  return (locales, options = emptyOptions, ...slotsList: S[]) => {
    const subformat = queryFormat(
      getForcedTimeZoneId && getForcedTimeZoneId(...slotsList),
      locales,
      options,
      transformOptions,
      strictOptions,
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
  strictOptions: boolean,
): Intl.DateTimeFormat {
  options = transformOptions(options, strictOptions)

  if (forcedTimeZoneId) {
    if (options.timeZone !== undefined) {
      throw new TypeError(errorMessages.forbiddenFormatTimeZone)
    }
    options.timeZone = forcedTimeZoneId
  }

  return new RawDateTimeFormat(locales, options)
}

function getForcedCommonTimeZone(
  slots0?: { timeZone: string }, // actually needed
  slots1?: { timeZone: string }, // optional!
): string {
  const timeZoneId = slots0!.timeZone
  if (slots1 && slots1.timeZone !== timeZoneId) {
    throw new RangeError(errorMessages.mismatchingTimeZones)
  }
  return timeZoneId
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

export const instantConfig: ClassFormatConfig<EpochSlots> = [
  transformInstantOptions,
  getEpochMilli,
]

export const zonedConfig: ClassFormatConfig<EpochAndZoneSlots> = [
  transformZonedOptions,
  getEpochMilli,
  false, // strictCalendarChecks
  getForcedCommonTimeZone,
]

export const dateTimeConfig: ClassFormatConfig<IsoDateTimeFields> = [
  transformDateTimeOptions,
  isoToEpochMilli as (isoFields: IsoDateTimeFields) => number,
]

export const dateConfig: ClassFormatConfig<IsoDateFields> = [
  transformDateOptions,
  isoToEpochMilli as (isoFields: IsoDateFields) => number,
]

export const timeConfig: ClassFormatConfig<IsoTimeFields> = [
  transformTimeOptions,
  (isoFields: IsoTimeFields) => isoTimeFieldsToNano(isoFields) / nanoInMilli,
]

export const yearMonthConfig: ClassFormatConfig<IsoDateFields> = [
  transformYearMonthOptions,
  isoToEpochMilli as (isoFields: IsoDateFields) => number,
  nonBuggyIsoResolve, // strictCalendarChecks
]

export const monthDayConfig: ClassFormatConfig<IsoDateFields> = [
  transformMonthDayOptions,
  isoToEpochMilli as (isoFields: IsoDateFields) => number,
  nonBuggyIsoResolve, // strictCalendarChecks
]

// General Epoch Conversion
// -----------------------------------------------------------------------------

function toEpochMillis<S>(
  config: ClassFormatConfig<S>,
  resolvedOptions: Intl.ResolvedDateTimeFormatOptions,
  slotsList: S[],
): number[] {
  const [, slotsToEpochMilli, strictCalendarCheck] = config

  return slotsList.map((slots: S) => {
    if ((slots as any).calendar) {
      checkCalendarsCompatible(
        (slots as any).calendar, // !!!
        resolvedOptions.calendar,
        strictCalendarCheck,
      )
    }

    return slotsToEpochMilli(slots, resolvedOptions)
  })
}

function checkCalendarsCompatible(
  internalCalendarId: string,
  resolvedCalendarId: string,
  strictCalendarCheck: boolean | undefined,
): void {
  if (
    (strictCalendarCheck || internalCalendarId !== isoCalendarId) &&
    internalCalendarId !== resolvedCalendarId
  ) {
    throw new RangeError(errorMessages.mismatchingCalendars)
  }
}
