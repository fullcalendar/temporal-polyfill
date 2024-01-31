import { isoCalendarId } from './calendarConfig'
import { DayTimeNano } from './dayTimeNano'
import * as errorMessages from './errorMessages'
import { LocalesArg, OptionNames, OrigDateTimeFormat } from './intlFormatUtils'
import {
  IsoDateFields,
  IsoDateTimeFields,
  IsoTimeFields,
  isoTimeFieldDefaults,
} from './isoFields'
import { isoEpochOriginYear } from './isoMath'
import { IdLike, getId } from './slots'
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
// ---------

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

// Valid Names
// -----------
// TODO: rename to 'standard'. sounds like others are invalid

const monthDayValidNames = Object.keys(monthDayFallbacks) as OptionNames
const yearMonthValidNames = Object.keys(yearMonthFallbacks) as OptionNames
const dateFallbackNames = Object.keys(dateFallbacks) as OptionNames
const timeFallbackNames = Object.keys(timeFallbacks) as OptionNames

const dateValidNames: OptionNames = [
  ...dateFallbackNames,
  'weekday',
  'dateStyle',
]
const timeValidNames: OptionNames = [
  ...timeFallbackNames,
  'dayPeriod',
  'timeStyle',
]
const dateTimeValidNames: OptionNames = [...dateValidNames, ...timeValidNames]
const zonedValidNames: OptionNames = [
  ...dateTimeValidNames,
  ...timeZoneNameStrs,
]

// Exclusions
// ----------

const dateExclusions: OptionNames = [...timeZoneNameStrs, ...timeValidNames]
const timeExclusions: OptionNames = [...timeZoneNameStrs, ...dateValidNames]
const yearMonthExclusions: OptionNames = [
  ...timeZoneNameStrs,
  'day',
  'weekday',
  'dateStyle',
  ...timeValidNames,
]
const monthDayExclusions: OptionNames = [
  ...timeZoneNameStrs,
  'year',
  'weekday',
  'dateStyle',
  ...timeValidNames,
]

// Transformer Funcs
// -----------------

/*
slots0 is only provided if doing toLocaleString/etc
slots1 is only provided if doing toLocaleString/etc AND formatting a range
*/
export type OptionsTransformer<S> = (
  options: Intl.DateTimeFormatOptions,
  slots0?: S,
  slots1?: S,
) => Intl.DateTimeFormatOptions

function createOptionsTransformer<S>(
  validNames: OptionNames,
  fallbacks: Intl.DateTimeFormatOptions,
  excludedNames: OptionNames = [],
): OptionsTransformer<S> {
  const excludedNameSet = new Set(excludedNames)

  return (options: Intl.DateTimeFormatOptions) => {
    options = excludePropsByName(excludedNameSet, options)

    if (!hasAnyPropsByName(options, validNames)) {
      Object.assign(options, fallbacks)
    }

    return options
  }
}

const transformMonthDayOptions = createOptionsTransformer(
  monthDayValidNames,
  monthDayFallbacks,
  monthDayExclusions,
)
const transformYearMonthOptions = createOptionsTransformer(
  yearMonthValidNames,
  yearMonthFallbacks,
  yearMonthExclusions,
)
const transformDateOptions = createOptionsTransformer(
  dateValidNames,
  dateFallbacks,
  dateExclusions,
)
const transformDateTimeOptions = createOptionsTransformer(
  dateTimeValidNames,
  dateTimeFallbacks,
  timeZoneNameStrs,
)
const transformTimeOptions = createOptionsTransformer(
  timeValidNames,
  timeFallbacks,
  timeExclusions,
)
// TOOD: rename to 'instant'?
const transformEpochOptions = createOptionsTransformer(
  dateTimeValidNames,
  dateTimeFallbacks,
)
const transformZonedEpochOptionsBasic = createOptionsTransformer(
  zonedValidNames,
  zonedFallbacks,
)

// HACK: only ever called with toLocaleString/etc, so can assume slots0
function transformZonedEpochOptions(
  options: Intl.DateTimeFormatOptions,
  slots0?: { timeZone: IdLike },
  slots1?: { timeZone: IdLike },
): Intl.DateTimeFormatOptions {
  options = transformZonedEpochOptionsBasic(options)
  if (options.timeZone !== undefined) {
    throw new TypeError(errorMessages.forbiddenFormatTimeZone)
  }
  options.timeZone = getCommonTimeZoneId(slots0!, slots1)
  return options
}

// Specific Epoch Nano Converters
// -----------------------------------------------------------------------------

function isoDateFieldsToEpochNano(
  isoFields: IsoDateTimeFields | IsoDateFields,
  resolvedOptions: Intl.ResolvedDateTimeFormatOptions,
): DayTimeNano {
  const timeZoneNative = queryNativeTimeZone(resolvedOptions.timeZone)

  return getSingleInstantFor(timeZoneNative, {
    ...isoTimeFieldDefaults,
    isoHour: 12, // for whole-day dates, will not dst-shift into prev/next day
    ...isoFields,
  })
}

function isoTimeFieldsToEpochNano(
  internals: IsoTimeFields,
  resolvedOptions: Intl.ResolvedDateTimeFormatOptions,
): DayTimeNano {
  const timeZoneNative = queryNativeTimeZone(resolvedOptions.timeZone)

  return getSingleInstantFor(timeZoneNative, {
    isoYear: isoEpochOriginYear,
    isoMonth: 1,
    isoDay: 1,
    ...internals,
  })
}

function extractEpochNano(slots: BasicInstantSlots): DayTimeNano {
  return slots.epochNanoseconds
}

// Configs
// -----------------------------------------------------------------------------

export type ClassFormatConfig<S> = [
  OptionsTransformer<S>,
  EpochNanoConverter<S>,
  boolean?, // strictCalendarChecks
]

type EpochNanoConverter<S> = (
  slots: S,
  resolvedOptions: Intl.ResolvedDateTimeFormatOptions,
) => DayTimeNano

// TODO: weird
export type BasicInstantSlots = { epochNanoseconds: DayTimeNano }
export type BasicZonedDateTimeSlots = {
  timeZone: IdLike
  epochNanoseconds: DayTimeNano
}

export const plainYearMonthConfig: ClassFormatConfig<IsoDateFields> = [
  transformYearMonthOptions,
  isoDateFieldsToEpochNano,
  true,
]
export const plainMonthDayConfig: ClassFormatConfig<IsoDateFields> = [
  transformMonthDayOptions,
  isoDateFieldsToEpochNano,
  true,
]
export const plainDateConfig: ClassFormatConfig<IsoDateFields> = [
  transformDateOptions,
  isoDateFieldsToEpochNano,
]
export const plainDateTimeConfig: ClassFormatConfig<IsoDateTimeFields> = [
  transformDateTimeOptions,
  isoDateFieldsToEpochNano,
]
export const plainTimeConfig: ClassFormatConfig<IsoTimeFields> = [
  transformTimeOptions,
  isoTimeFieldsToEpochNano,
]
export const instantConfig: ClassFormatConfig<BasicInstantSlots> = [
  transformEpochOptions,
  extractEpochNano,
]
export const zonedDateTimeConfig: ClassFormatConfig<BasicZonedDateTimeSlots> = [
  transformZonedEpochOptions,
  extractEpochNano,
]

const emptyOptions: Intl.DateTimeFormatOptions = {} // constant reference for caching

export type FormatPrepper<S> = (
  locales: LocalesArg | undefined,
  options: Intl.DateTimeFormatOptions | undefined,
  slots0: S,
  slots1?: S,
) => [Intl.DateTimeFormat, number, number?]

export type FormatQuerier<S> = (
  locales: LocalesArg | undefined,
  options: Intl.DateTimeFormatOptions,
  transformOptions: OptionsTransformer<S>,
  slots0: S,
  slots1?: S,
) => Intl.DateTimeFormat

export function createFormatPrepper<S>(
  config: ClassFormatConfig<S>,
  queryFormat: FormatQuerier<S> = createFormatForPrep,
): FormatPrepper<S> {
  const [transformOptions] = config

  // biome-ignore lint/style/useDefaultParameterLast: by design
  return (locales, options = emptyOptions, slots0, slots1) => {
    const subformat = queryFormat(
      locales,
      options,
      transformOptions,
      slots0,
      slots1,
    )
    const resolvedOptions = subformat.resolvedOptions()
    return [
      subformat,
      ...toEpochMillis(config, resolvedOptions, slots0, slots1),
    ]
  }
}

export function createFormatForPrep<S>(
  locales: LocalesArg | undefined,
  options: Intl.DateTimeFormatOptions,
  transformOptions: OptionsTransformer<S>,
  slots0: S,
  slots1?: S,
): Intl.DateTimeFormat {
  return new OrigDateTimeFormat(
    locales,
    transformOptions(options, slots0, slots1),
  )
}

// General Epoch Conversion
// -----------------------------------------------------------------------------

export function toEpochMillis<S>(
  config: ClassFormatConfig<S>,
  resolvedOptions: Intl.ResolvedDateTimeFormatOptions,
  slots0: S,
  slots1?: S,
): [number, number?] {
  const epochMilli0 = toEpochMilli(config, resolvedOptions, slots0)
  const epochMilli1 =
    slots1 !== undefined
      ? toEpochMilli(config, resolvedOptions, slots1)
      : undefined

  return [epochMilli0, epochMilli1]
}

function toEpochMilli<S>(
  [, slotsToEpochNano, strictCalendarCheck]: ClassFormatConfig<S>,
  resolvedOptions: Intl.ResolvedDateTimeFormatOptions,
  slots: S,
): number {
  if ((slots as any).calendar) {
    checkCalendarsCompatible(
      getId((slots as any).calendar),
      resolvedOptions.calendar,
      strictCalendarCheck,
    )
  }

  const epochNano = slotsToEpochNano(slots, resolvedOptions)
  return epochNanoToMilli(epochNano)
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

// -----------------------------------------------------------------------------

// specifically for formatting... rename
export function getCommonTimeZoneId(
  slots0: { timeZone: IdLike },
  slots1?: { timeZone: IdLike }, // optional!
): string {
  const timeZoneId = getId(slots0!.timeZone)
  if (slots1 && getId(slots1.timeZone) !== timeZoneId) {
    throw new RangeError(errorMessages.mismatchingTimeZones)
  }
  return timeZoneId
}