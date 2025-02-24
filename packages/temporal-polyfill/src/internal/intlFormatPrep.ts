import { isoCalendarId } from './calendarConfig'
import * as errorMessages from './errorMessages'
import { LocalesArg, OptionNames, RawDateTimeFormat } from './intlFormatUtils'
import { IsoDateFields, IsoDateTimeFields, IsoTimeFields } from './isoFields'
import { EpochAndZoneSlots, EpochSlots, getEpochMilli } from './slots'
import { isoTimeFieldsToNano, isoToEpochMilli } from './timeMath'
import { utcTimeZoneId } from './timeZoneConfig'
import { nanoInMilli } from './units'
import { excludePropsByName, hasAnyPropsByName } from './utils'

/*
RULES:
DateTimeFormat always determines calendar and timeZone. If given date object conflicts, throw error.
However, for ZonedDateTimeFormat::toLocaleString, timeZone is forced by obj and can't be provided.
*/

// Options Transformers
// -----------------------------------------------------------------------------

const numericStr = 'numeric'
const timeZoneNameStrs: OptionNames = ['timeZoneName']

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
  'timeStyle',
]
const dateTimeStandardNames: OptionNames = [
  ...dateStandardNames,
  ...timeStandardNames,
]
const zonedStandardNames: OptionNames = [
  ...dateTimeStandardNames,
  ...timeZoneNameStrs,
]

// Exclusions
// (Silently removed)

const dateExclusions: OptionNames = [...timeZoneNameStrs, ...timeStandardNames]
const timeExclusions: OptionNames = [...timeZoneNameStrs, ...dateStandardNames]
const yearMonthExclusions: OptionNames = [
  ...timeZoneNameStrs,
  'day',
  'weekday',
  ...timeStandardNames,
]
const monthDayExclusions: OptionNames = [
  ...timeZoneNameStrs,
  'year',
  'weekday',
  ...timeStandardNames,
]

// Transformer Funcs
// -----------------

export type OptionsTransformer = (
  options: Intl.DateTimeFormatOptions,
) => Intl.DateTimeFormatOptions

function createOptionsTransformer(
  standardNames: OptionNames,
  fallbacks: Intl.DateTimeFormatOptions,
  exclusions?: OptionNames,
): OptionsTransformer {
  const excludedNameSet = new Set(exclusions)

  return (options: Intl.DateTimeFormatOptions) => {
    options = excludePropsByName(excludedNameSet, options)

    if (!hasAnyPropsByName(options, standardNames)) {
      Object.assign(options, fallbacks)
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
  zonedStandardNames,
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
)
const transformTimeOptions = createOptionsTransformer(
  timeStandardNames,
  timeFallbacks,
  timeExclusions,
)
const transformYearMonthOptions = createOptionsTransformer(
  yearMonthStandardNames,
  yearMonthFallbacks,
  yearMonthExclusions,
)
const transformMonthDayOptions = createOptionsTransformer(
  monthDayStandardNames,
  monthDayFallbacks,
  monthDayExclusions,
)

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
) => Intl.DateTimeFormat

export function createFormatPrepper<S>(
  config: ClassFormatConfig<S>,
  queryFormat: FormatQuerier = createFormatForPrep,
): FormatPrepper<S> {
  const [transformOptions, , , getForcedTimeZoneId] = config

  return (locales, options = emptyOptions, ...slotsList: S[]) => {
    const subformat = queryFormat(
      getForcedTimeZoneId && getForcedTimeZoneId(...slotsList),
      locales,
      options,
      transformOptions,
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
): Intl.DateTimeFormat {
  options = transformOptions(options)

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
  true, // strictCalendarChecks
]

export const monthDayConfig: ClassFormatConfig<IsoDateFields> = [
  transformMonthDayOptions,
  isoToEpochMilli as (isoFields: IsoDateFields) => number,
  true, // strictCalendarChecks
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
