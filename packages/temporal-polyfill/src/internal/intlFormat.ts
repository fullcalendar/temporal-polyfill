import { isoCalendarId } from './calendarConfig'
import { DayTimeNano } from './dayTimeNano'
import { IsoDateFields, IsoDateTimeFields, IsoTimeFields, isoTimeFieldDefaults } from './isoFields'
import { epochNanoToMilli, isoEpochOriginYear } from './isoMath'
import { createLazyGenerator, excludePropsByName, hasAnyPropsByName } from './utils'
import { getSingleInstantFor } from './timeZoneMath'
import { getId } from './idLike'
import { createTypicalTimeZoneRecordIMPL } from '../genericApi/recordCreators' // weird

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

type OptionsTransformer = (options: Intl.DateTimeFormatOptions | undefined) => Intl.DateTimeFormatOptions

function createTransformer(
  validNames: OptionNames,
  fallbacks: Intl.DateTimeFormatOptions,
  excludedNames: OptionNames = [],
): OptionsTransformer {
  const excludedNameSet = new Set(excludedNames)

  return (options: Intl.DateTimeFormatOptions | undefined) => {
    options = excludePropsByName(options || {}, excludedNameSet)

    if (!hasAnyPropsByName(options, validNames)) {
      Object.assign(options, fallbacks)
    }

    return options
  }
}

const transformMonthDayOptions = createTransformer(monthDayValidNames, monthDayFallbacks, monthDayExclusions)
const transformYearMonthOptions = createTransformer(yearMonthValidNames, yearMonthFallbacks, yearMonthExclusions)
const transformDateOptions = createTransformer(dateValidNames, dateFallbacks, dateExclusions)
const transformDateTimeOptions = createTransformer(dateTimeValidNames, dateTimeFallbacks, timeZoneNameStrs)
const transformTimeOptions = createTransformer(timeValidNames, timeFallbacks, timeExclusions)
const transformEpochOptions = createTransformer(dateTimeValidNames, dateTimeFallbacks)
const transformZonedEpochOptions = createTransformer(zonedValidNames, zonedFallbacks)

// Specific Epoch Nano Converters
// -------------------------------------------------------------------------------------------------

function isoDateFieldsToEpochNano(
  isoFields: IsoDateTimeFields | IsoDateFields,
  resolvedOptions: Intl.ResolvedDateTimeFormatOptions,
): DayTimeNano {
  const timeZoneRecord = createTypicalTimeZoneRecordIMPL(resolvedOptions.timeZone)

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

function extractEpochNano(slots: { epochNanoseconds: DayTimeNano }): DayTimeNano {
  return slots.epochNanoseconds
}

// Configs
// -------------------------------------------------------------------------------------------------

export type ClassFormatConfig<S> = [
  OptionsTransformer,
  EpochNanoConverter<S>,
  boolean?, // strictCalendarChecks
]

type EpochNanoConverter<S> = (
  slots: S,
  resolvedOptions: Intl.ResolvedDateTimeFormatOptions,
) => DayTimeNano

const plainYearMonthConfig: ClassFormatConfig<IsoDateFields> = [transformYearMonthOptions, isoDateFieldsToEpochNano, true]
const plainMonthDayConfig: ClassFormatConfig<IsoDateFields> = [transformMonthDayOptions, isoDateFieldsToEpochNano, true]
const plainDateConfig: ClassFormatConfig<IsoDateFields> = [transformDateOptions, isoDateFieldsToEpochNano]
const plainDateTimeConfig: ClassFormatConfig<IsoDateTimeFields> = [transformDateTimeOptions, isoDateFieldsToEpochNano]
const plainTimeConfig: ClassFormatConfig<IsoTimeFields> = [transformTimeOptions, isoTimeFieldsToEpochNano]
const instantConfig: ClassFormatConfig<{ epochNanoseconds: DayTimeNano }> = [transformEpochOptions, extractEpochNano]
const zonedDateTimeConfig: ClassFormatConfig<{ epochNanoseconds: DayTimeNano }> = [transformZonedEpochOptions, extractEpochNano]

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

// toLocaleString/etc
// -------------------------------------------------------------------------------------------------

export type FormatPrepFunc<S> = (
  locales: LocalesArg | undefined,
  options: Intl.DateTimeFormatOptions | undefined,
  slots0: S,
  slots1?: S,
) => [Intl.DateTimeFormat, number, number?]

export function createFormatPrepFunc<S>(
  config: ClassFormatConfig<S>,
): FormatPrepFunc<S> {
  return (locales, options, slots0, slots1) => {
    const [transformOptions] = config
    const subformat = new OrigDateTimeFormat(locales, transformOptions(options))
    const resolvedOptions = subformat.resolvedOptions()
    return [subformat, ...toEpochMillis(config, resolvedOptions, slots0, slots1)]
  }
}

export const prepPlainYearMonthFormat = createFormatPrepFunc(plainYearMonthConfig)
export const prepPlainMonthDayFormat = createFormatPrepFunc(plainMonthDayConfig)
export const prepPlainDateFormat = createFormatPrepFunc(plainDateConfig)
export const prepPlainDateTimeFormat = createFormatPrepFunc(plainDateTimeConfig)
export const prepPlainTimeFormat = createFormatPrepFunc(plainTimeConfig)
export const prepInstantFormat = createFormatPrepFunc(instantConfig)
export const prepZonedDateTimeFormat = createFormatPrepFunc(zonedDateTimeConfig)

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
