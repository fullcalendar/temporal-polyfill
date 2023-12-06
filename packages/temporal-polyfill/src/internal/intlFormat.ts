import { isoCalendarId } from './calendarConfig'
import { DayTimeNano } from './dayTimeNano'
import { IsoDateFields, IsoDateTimeFields, IsoTimeFields, isoTimeFieldDefaults } from './isoFields'
import { epochNanoToMilli, isoEpochOriginYear } from './isoMath'
import { createLazyGenerator, excludePropsByName, hasAnyPropsByName } from './utils'
import { getSingleInstantFor } from './timeZoneMath'
import { IdLike, getId } from './idLike'

// generic API - BAD
import { createTypicalTimeZoneRecordIMPL } from '../genericApi/recordCreators'

export type LocalesArg = string | string[]
export const OrigDateTimeFormat = Intl.DateTimeFormat

/*
RULES:
DateTimeFormat always determines calendar and timeZone. If given date object conflicts, throw error.
However, for ZonedDateTimeFormat::toLocaleString, timeZone is forced by obj and can't be provided.
*/

// Options Transformers
// -------------------------------------------------------------------------------------------------

export type OptionNames = (keyof Intl.DateTimeFormatOptions)[]

const numericStr = 'numeric'
const timeZoneNameStrs: OptionNames = ['timeZoneName']

// Fallbacks
// ---------

const monthDayFallbacks: Intl.DateTimeFormatOptions = { month: numericStr, day: numericStr }
const yearMonthFallbacks: Intl.DateTimeFormatOptions = { year: numericStr, month: numericStr }
const dateFallbacks: Intl.DateTimeFormatOptions = { ...yearMonthFallbacks, day: numericStr }
const timeFallbacks: Intl.DateTimeFormatOptions = {
  hour: numericStr,
  minute: numericStr,
  second: numericStr,
}
const dateTimeFallbacks: Intl.DateTimeFormatOptions = { ...dateFallbacks, ...timeFallbacks }
const zonedFallbacks: Intl.DateTimeFormatOptions = { ...dateTimeFallbacks, timeZoneName: 'short' }

// Valid Names
// -----------
// TODO: rename to 'standard'. sounds like others are invalid

const monthDayValidNames = Object.keys(monthDayFallbacks) as OptionNames
const yearMonthValidNames = Object.keys(yearMonthFallbacks) as OptionNames
const dateValidNames: OptionNames = [
  ...(Object.keys(dateFallbacks) as OptionNames),
  'weekday',
  'dateStyle',
]
const timeValidNames: OptionNames = [
  ...(Object.keys(timeFallbacks) as OptionNames),
  'dayPeriod',
  'timeStyle',
]
const dateTimeValidNames: OptionNames = [...dateValidNames, ...timeValidNames]
const zonedValidNames: OptionNames = [...dateTimeValidNames, ...timeZoneNameStrs]

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
type OptionsTransformer<S> = (
  options: Intl.DateTimeFormatOptions,
  slots0?: S,
  slots1?: S
) => Intl.DateTimeFormatOptions

function createOptionsTransformer<S>(
  validNames: OptionNames,
  fallbacks: Intl.DateTimeFormatOptions,
  excludedNames: OptionNames = [],
): OptionsTransformer<S> {
  const excludedNameSet = new Set(excludedNames)

  return (options: Intl.DateTimeFormatOptions) => {
    options = excludePropsByName(options, excludedNameSet)

    if (!hasAnyPropsByName(options, validNames)) {
      Object.assign(options, fallbacks)
    }

    return options
  }
}

const transformMonthDayOptions = createOptionsTransformer(monthDayValidNames, monthDayFallbacks, monthDayExclusions)
const transformYearMonthOptions = createOptionsTransformer(yearMonthValidNames, yearMonthFallbacks, yearMonthExclusions)
const transformDateOptions = createOptionsTransformer(dateValidNames, dateFallbacks, dateExclusions)
const transformDateTimeOptions = createOptionsTransformer(dateTimeValidNames, dateTimeFallbacks, timeZoneNameStrs)
const transformTimeOptions = createOptionsTransformer(timeValidNames, timeFallbacks, timeExclusions)
const transformEpochOptions = createOptionsTransformer(dateTimeValidNames, dateTimeFallbacks) // TOOD: rename to 'instant'?
const transformZonedEpochOptionsBasic = createOptionsTransformer(zonedValidNames, zonedFallbacks)

// HACK: only ever called with toLocaleString/etc, so can assume slots0
function transformZonedEpochOptions(
  options: Intl.DateTimeFormatOptions,
  slots0?: { timeZone: IdLike },
  slots1?: { timeZone: IdLike },
): Intl.DateTimeFormatOptions {
  options = transformZonedEpochOptionsBasic(options)
  if (options.timeZone) {
    throw new RangeError('Cannot specify timeZone in Intl.DateTimeFormat options')
  }
  options.timeZone = getCommonTimeZoneId(slots0!, slots1)
  return options
}

// Specific Epoch Nano Converters
// -------------------------------------------------------------------------------------------------

function isoDateFieldsToEpochNano(
  isoFields: IsoDateTimeFields | IsoDateFields,
  resolvedOptions: Intl.ResolvedDateTimeFormatOptions,
): DayTimeNano {
  const timeZoneRecord = createTypicalTimeZoneRecordIMPL(resolvedOptions.timeZone) // BAD

  return getSingleInstantFor(timeZoneRecord, {
    ...isoTimeFieldDefaults,
    isoHour: 12, // for whole-day dates, will not dst-shift into prev/next day
    ...isoFields,
  })
}

function isoTimeFieldsToEpochNano(
  internals: IsoTimeFields,
  resolvedOptions: Intl.ResolvedDateTimeFormatOptions,
): DayTimeNano {
  const timeZoneRecord = createTypicalTimeZoneRecordIMPL(resolvedOptions.timeZone)

  return getSingleInstantFor(timeZoneRecord, {
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
// -------------------------------------------------------------------------------------------------

export type ClassFormatConfig<S> = [
  OptionsTransformer<S>,
  EpochNanoConverter<S>,
  boolean?, // strictCalendarChecks
]

type EpochNanoConverter<S> = (
  slots: S,
  resolvedOptions: Intl.ResolvedDateTimeFormatOptions,
) => DayTimeNano

// TODO: move elsewhere
type BasicInstantSlots = { epochNanoseconds: DayTimeNano }
type BasicZonedDateTimeSlots = { timeZone: IdLike, epochNanoseconds: DayTimeNano }

const plainYearMonthConfig: ClassFormatConfig<IsoDateFields> = [transformYearMonthOptions, isoDateFieldsToEpochNano, true]
const plainMonthDayConfig: ClassFormatConfig<IsoDateFields> = [transformMonthDayOptions, isoDateFieldsToEpochNano, true]
const plainDateConfig: ClassFormatConfig<IsoDateFields> = [transformDateOptions, isoDateFieldsToEpochNano]
const plainDateTimeConfig: ClassFormatConfig<IsoDateTimeFields> = [transformDateTimeOptions, isoDateFieldsToEpochNano]
const plainTimeConfig: ClassFormatConfig<IsoTimeFields> = [transformTimeOptions, isoTimeFieldsToEpochNano]
const instantConfig: ClassFormatConfig<BasicInstantSlots> = [transformEpochOptions, extractEpochNano]
const zonedDateTimeConfig: ClassFormatConfig<BasicZonedDateTimeSlots> = [transformZonedEpochOptions, extractEpochNano]

/*
For Intl.DateTimeFormat
*/
export const classFormatConfigs: Record<string, ClassFormatConfig<any>> = {
  PlainYearMonth: plainYearMonthConfig,
  PlainMonthDay: plainMonthDayConfig,
  PlainDate: plainDateConfig,
  PlainDateTime: plainDateTimeConfig,
  PlainTime: plainTimeConfig,
  Instant: instantConfig,
  // ZonedDateTime not allowed to be formatted by Intl.DateTimeFormat
}

// For Class::toLocaleString/etc
// -------------------------------------------------------------------------------------------------

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
  queryFormat: FormatQuerier<S> = createFormat,
): FormatPrepper<S> {
  const [transformOptions] = config
  return (locales, options = emptyOptions, slots0, slots1) => {
    const subformat = queryFormat(locales, options, transformOptions, slots0, slots1)
    const resolvedOptions = subformat.resolvedOptions()
    return [subformat, ...toEpochMillis(config, resolvedOptions, slots0, slots1)]
  }
}

function createFormat<S>(
  locales: LocalesArg | undefined,
  options: Intl.DateTimeFormatOptions,
  transformOptions: OptionsTransformer<S>,
  slots0: S,
  slots1?: S,
): Intl.DateTimeFormat {
  return new OrigDateTimeFormat(locales, transformOptions(options, slots0, slots1))
}

export const prepPlainYearMonthFormat = createFormatPrepper(plainYearMonthConfig)
export const prepPlainMonthDayFormat = createFormatPrepper(plainMonthDayConfig)
export const prepPlainDateFormat = createFormatPrepper(plainDateConfig)
export const prepPlainDateTimeFormat = createFormatPrepper(plainDateTimeConfig)
export const prepPlainTimeFormat = createFormatPrepper(plainTimeConfig)
export const prepInstantFormat = createFormatPrepper(instantConfig)
export const prepZonedDateTimeFormat = createFormatPrepper(zonedDateTimeConfig)

// For fns-api toLocaleString/etc (with caching)
// -------------------------------------------------------------------------------------------------

export function createFormatCache<S>(
  hashSlots?: (slots0: S, slots1?: S) => string,
): FormatQuerier<S> {
  const queryFormatFactory = createLazyGenerator((options: Intl.DateTimeFormatOptions) => {
    const map = new Map<string, Intl.DateTimeFormat>()

    return (
      locales: LocalesArg | undefined,
      transformOptions: OptionsTransformer<S>,
      slots0: S,
      slots1?: S,
    ) => {
      const key = ([] as string[]).concat(
        hashSlots ? [hashSlots(slots0, slots1)] : [],
        locales || [],
      ).join()

      let format = map.get(key)
      if (!format) {
        format = createFormat(locales, options, transformOptions, slots0, slots1)
        map.set(key, format)
      }

      return format
    }
  })

  return (locales, options, transformOptions, slots0, slots1) => {
    return queryFormatFactory(options)(locales, transformOptions, slots0, slots1)
  }
}

export const prepCachedPlainYearMonthFormat = createFormatPrepper(plainYearMonthConfig, createFormatCache())
export const prepCachedPlainMonthDayFormat = createFormatPrepper(plainMonthDayConfig, createFormatCache())
export const prepCachedPlainDateFormat = createFormatPrepper(plainDateConfig, createFormatCache())
export const prepCachedPlainDateTimeFormat = createFormatPrepper(plainDateTimeConfig, createFormatCache())
export const prepCachedPlainTimeFormat = createFormatPrepper(plainTimeConfig, createFormatCache())
export const prepCachedInstantFormat = createFormatPrepper(instantConfig, createFormatCache())
export const prepCachedZonedDateTimeFormat = createFormatPrepper(zonedDateTimeConfig, createFormatCache<BasicZonedDateTimeSlots>(getCommonTimeZoneId))

// Intl.DateTimeFormat
// -------------------------------------------------------------------------------------------------
// TODO: move to public dir?

export type BoundFormatPrepFunc = ( // already bound to locale/options
  slots0: { branding: string} | undefined, // TODO: how to make BrandingSlots available?
  slots1?: { branding: string} | undefined, //
) => BoundFormatPrepFuncRes

export type BoundFormatPrepFuncRes = [
  Intl.DateTimeFormat | undefined,
  number | undefined,
  number | undefined,
]

export function createBoundFormatPrepFunc(
  origOptions: Intl.DateTimeFormatOptions,
  resolvedOptions: Intl.ResolvedDateTimeFormatOptions,
): BoundFormatPrepFunc {
  const resolvedLocale = resolvedOptions.locale

  const queryFormat = createLazyGenerator((branding: string) => {
    const [transformOptions] = classFormatConfigs[branding]
    const transformedOptions = transformOptions(origOptions)
    return new OrigDateTimeFormat(resolvedLocale, transformedOptions)
  })

  return (slots0, slots1) => {
    const { branding } = slots0 || {}

    if (branding) {
      if (slots1 && slots1.branding && slots1.branding !== branding) {
        throw new RangeError('Mismatching branding')
      }

      const config = classFormatConfigs[branding]
      if (!config) {
        throw new TypeError('Cannot format ' + branding)
      }

      return [
        queryFormat(branding)!,
        ...toEpochMillis(config, resolvedOptions, slots0, slots1),
      ] as BoundFormatPrepFuncRes
    }

    return [] as unknown as BoundFormatPrepFuncRes
  }
}

// General Epoch Conversion
// -------------------------------------------------------------------------------------------------

export function toEpochMillis<S>(
  config: ClassFormatConfig<S>,
  resolvedOptions: Intl.ResolvedDateTimeFormatOptions,
  slots0: S,
  slots1?: S,
): [number, number?] {
  const epochMilli0 = toEpochMilli(config, resolvedOptions, slots0)
  const epochMilli1 = slots1 !== undefined
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
  resolveCalendarId: string,
  strictCalendarCheck: boolean | undefined,
): void {
  if (
    (strictCalendarCheck || internalCalendarId !== isoCalendarId) &&
    (internalCalendarId !== resolveCalendarId)
  ) {
    throw new RangeError('Mismatching calendars')
  }
}

// Utils
// -------------------------------------------------------------------------------------------------

export const standardLocaleId = 'en-GB' // gives 24-hour clock

export function hashIntlFormatParts(
  intlFormat: Intl.DateTimeFormat,
  epochMilliseconds: number,
): Record<string, string> {
  const parts = intlFormat.formatToParts(epochMilliseconds)
  const hash = {} as Record<string, string>

  for (const part of parts) {
    hash[part.type] = part.value
  }

  return hash
}

function getCommonTimeZoneId(
  slots0: { timeZone: IdLike },
  slots1?: { timeZone: IdLike },
): string {
  const timeZoneId = getId(slots0!.timeZone)
  if (slots1 && getId(slots1.timeZone) !== timeZoneId) {
    throw new RangeError('Mismatching timeZones')
  }
  return timeZoneId
}
