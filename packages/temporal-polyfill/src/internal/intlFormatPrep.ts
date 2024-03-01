import { BigNano } from './bigNano'
import { isoCalendarId } from './calendarConfig'
import * as errorMessages from './errorMessages'
import { LocalesArg, OptionNames, RawDateTimeFormat } from './intlFormatUtils'
import {
  IsoDateFields,
  IsoDateTimeFields,
  IsoTimeFields,
  isoTimeFieldDefaults,
} from './isoFields'
import { isoEpochOriginYear } from './isoMath'
import {
  EpochAndZoneSlots,
  EpochSlots,
  IdLike,
  extractEpochNano,
  getId,
} from './slots'
import { epochNanoToMilli } from './timeMath'
import { queryNativeTimeZone } from './timeZoneNative'
import { getSingleInstantFor } from './timeZoneOps'
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

const dateFallbackNames = Object.keys(dateFallbacks) as OptionNames
const timeFallbackNames = Object.keys(timeFallbacks) as OptionNames

// Standard Options
// (See notes for Fallbacks and Exclusions)

const monthDayStandardNames = Object.keys(monthDayFallbacks) as OptionNames
const yearMonthStandardNames = Object.keys(yearMonthFallbacks) as OptionNames

const dateStandardNames: OptionNames = [
  ...dateFallbackNames,
  'weekday',
  'dateStyle',
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
  'dateStyle',
  ...timeStandardNames,
]
const monthDayExclusions: OptionNames = [
  ...timeZoneNameStrs,
  'year',
  'weekday',
  'dateStyle',
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
  exclusions: OptionNames = [],
): OptionsTransformer {
  const excludedNameSet = new Set(exclusions)

  return (options: Intl.DateTimeFormatOptions) => {
    options = excludePropsByName(excludedNameSet, options)

    if (!hasAnyPropsByName(options, standardNames)) {
      Object.assign(options, fallbacks)
    }

    return options
  }
}

export const transformMonthDayOptions = createOptionsTransformer(
  monthDayStandardNames,
  monthDayFallbacks,
  monthDayExclusions,
)
export const transformYearMonthOptions = createOptionsTransformer(
  yearMonthStandardNames,
  yearMonthFallbacks,
  yearMonthExclusions,
)
export const transformDateOptions = createOptionsTransformer(
  dateStandardNames,
  dateFallbacks,
  dateExclusions,
)
export const transformDateTimeOptions = createOptionsTransformer(
  dateTimeStandardNames,
  dateTimeFallbacks,
  timeZoneNameStrs,
)
export const transformTimeOptions = createOptionsTransformer(
  timeStandardNames,
  timeFallbacks,
  timeExclusions,
)
export const transformInstantOptions = createOptionsTransformer(
  dateTimeStandardNames,
  dateTimeFallbacks,
)
export const transformZonedOptions = createOptionsTransformer(
  zonedStandardNames,
  zonedFallbacks,
)

// Specific Epoch Nano Converters
// -----------------------------------------------------------------------------

export function isoDateFieldsToEpochNano(
  isoFields: IsoDateTimeFields | IsoDateFields,
  resolvedOptions: Intl.ResolvedDateTimeFormatOptions,
): BigNano {
  const timeZoneNative = queryNativeTimeZone(resolvedOptions.timeZone)

  return getSingleInstantFor(timeZoneNative, {
    ...isoTimeFieldDefaults,
    isoHour: 12, // for whole-day dates, will not dst-shift into prev/next day
    ...isoFields,
  })
}

export function isoTimeFieldsToEpochNano(
  internals: IsoTimeFields,
  resolvedOptions: Intl.ResolvedDateTimeFormatOptions,
): BigNano {
  const timeZoneNative = queryNativeTimeZone(resolvedOptions.timeZone)

  return getSingleInstantFor(timeZoneNative, {
    isoYear: isoEpochOriginYear,
    isoMonth: 1,
    isoDay: 1,
    ...internals,
  })
}

// Config Utils
// -----------------------------------------------------------------------------

export type ClassFormatConfig<S> = [
  optionsTransformer: OptionsTransformer,
  epochNanoConverter: EpochNanoConverter<S>,
  strictCalendarChecks?: boolean,
  getForcedTimeZoneId?: (...slotsList: S[]) => string,
]

export type EpochNanoConverter<S> = (
  slots: S,
  resolvedOptions: Intl.ResolvedDateTimeFormatOptions,
) => BigNano

const emptyOptions: Intl.DateTimeFormatOptions = {} // constant reference for caching

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
      getForcedTimeZoneId ? getForcedTimeZoneId(...slotsList) : undefined,
      locales,
      options,
      transformOptions,
    )

    const resolvedOptions = subformat.resolvedOptions()
    return [subformat, ...toEpochMillis(config, resolvedOptions, ...slotsList)]
  }
}

export function createFormatForPrep(
  forcedTimeZoneId: string | undefined,
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
  slots0?: { timeZone: IdLike }, // actually needed
  slots1?: { timeZone: IdLike }, // optional!
): string {
  const timeZoneId = getId(slots0!.timeZone)
  if (slots1 && getId(slots1.timeZone) !== timeZoneId) {
    throw new RangeError(errorMessages.mismatchingTimeZones)
  }
  return timeZoneId
}

// Config Data
// -----------------------------------------------------------------------------
// Guaranteed to be the same across APIs

export const instantConfig: ClassFormatConfig<EpochSlots> = [
  transformInstantOptions,
  extractEpochNano,
]

export const zonedDateTimeConfig: ClassFormatConfig<EpochAndZoneSlots<IdLike>> =
  [transformZonedOptions, extractEpochNano, false, getForcedCommonTimeZone]

// General Epoch Conversion
// -----------------------------------------------------------------------------

function toEpochMillis<S>(
  config: ClassFormatConfig<S>,
  resolvedOptions: Intl.ResolvedDateTimeFormatOptions,
  ...slotsList: S[]
): number[] {
  const [, slotsToEpochNano, strictCalendarCheck] = config

  return slotsList.map((slots: S) => {
    if ((slots as any).calendar) {
      checkCalendarsCompatible(
        getId((slots as any).calendar),
        resolvedOptions.calendar,
        strictCalendarCheck,
      )
    }

    const epochNano = slotsToEpochNano(slots, resolvedOptions)
    return epochNanoToMilli(epochNano)
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
