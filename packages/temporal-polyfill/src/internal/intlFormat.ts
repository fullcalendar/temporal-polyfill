import { isoCalendarId } from './calendarConfig'
import { DayTimeNano } from './dayTimeNano'
import {
  IsoDateFields,
  IsoDateTimeFields,
  IsoTimeFields,
  isoTimeFieldDefaults,
} from './isoFields'
import { epochNanoToMilli, isoEpochOriginYear } from './isoMath'
import {
  excludePropsByName,
  hasAnyPropsByName,
} from './utils'
import { getSingleInstantFor } from './timeZoneMath'
import { IdLike, getId } from './idLike'
import { createTypicalTimeZoneRecordIMPL } from '../genericApi/recordCreators' // weird

export type LocalesArg = string | string[]
export const OrigDateTimeFormat = Intl.DateTimeFormat

// Option Transformers
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

type OptionsTransformer = (
  options: Intl.DateTimeFormatOptions,
  timeZoneIdLike?: IdLike,
) => Intl.DateTimeFormatOptions

const transformMonthDayOptions = createTransformer(monthDayValidNames, monthDayFallbacks, monthDayExclusions)
const transformYearMonthOptions = createTransformer(yearMonthValidNames, yearMonthFallbacks, yearMonthExclusions)
const transformDateOptions = createTransformer(dateValidNames, dateFallbacks, dateExclusions)
const transformDateTimeOptions = createTransformer(dateTimeValidNames, dateTimeFallbacks, timeZoneNameStrs)
const transformTimeOptions = createTransformer(timeValidNames, timeFallbacks, timeExclusions)
const transformEpochOptions = createTransformer(dateTimeValidNames, dateTimeFallbacks)
const _transformZonedEpochOptions = createTransformer(zonedValidNames, zonedFallbacks)

function transformZonedEpochOptions(
  options: Intl.DateTimeFormatOptions,
  timeZoneIdLike?: IdLike,
) {
  if (!timeZoneIdLike) {
    throw new TypeError('DateTimeFormat does not accept ZonedDateTime')
  }
  if (options.timeZone !== undefined) {
    throw new RangeError('Cannot specify timeZone') // for ZonedDateTime::toLocaleString
  }
  options.timeZone = getId(timeZoneIdLike)
  return _transformZonedEpochOptions(options)
}

function createTransformer(
  validNames: OptionNames,
  fallbacks: Intl.DateTimeFormatOptions,
  excludedNames: OptionNames = [],
): OptionsTransformer {
  const excludedNameSet = new Set(excludedNames)

  return (options: Intl.DateTimeFormatOptions) => {
    options = excludePropsByName(options, excludedNameSet)

    if (!hasAnyPropsByName(options, validNames)) {
      Object.assign(options, fallbacks)
    }

    return options
  }
}

// Converting Fields to Epoch Milliseconds
// -------------------------------------------------------------------------------------------------

type EpochNanoConverter = (
  fields: any,
  resolvedOptions: Intl.ResolvedDateTimeFormatOptions,
) => DayTimeNano

export function toEpochMilli(
  calendarIdLike: IdLike | undefined,
  fields: any,
  resolvedOptions: Intl.ResolvedDateTimeFormatOptions,
  fieldsToEpochNano: EpochNanoConverter = dateFieldsToEpochNano,
  strictCalendarCheck?: boolean,
) {
  if (calendarIdLike) {
    checkCalendarsCompatible(
      getId(calendarIdLike),
      resolvedOptions.calendar,
      strictCalendarCheck,
    )
  }

  const epochNano = fieldsToEpochNano(fields, resolvedOptions)
  return epochNanoToMilli(epochNano)
}

function timeFieldsToEpochNano(
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

function dateFieldsToEpochNano(
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

function extractEpochNano(slots: { epochNanoseconds: DayTimeNano }): DayTimeNano {
  return slots.epochNanoseconds
}

// Lookups for Intl.DateTimeFormat (move elsewhere?)
// -------------------------------------------------------------------------------------------------

export const optionsTransformers: Record<string, OptionsTransformer> = {
  PlainMonthDay: transformMonthDayOptions,
  PlainYearMonth: transformYearMonthOptions,
  PlainDate: transformDateOptions,
  PlainDateTime: transformDateTimeOptions,
  PlainTime: transformTimeOptions,
  Instant: transformEpochOptions,
  ZonedDateTime: transformZonedEpochOptions,
}

export const epochNanoConverters: Record<string, EpochNanoConverter> = {
  Instant: extractEpochNano,
  ZonedDateTime: extractEpochNano,
  PlainTime: timeFieldsToEpochNano,
  // otherwise, dateFieldsToEpochNano
}

export const strictCalendarChecks: Record<string, boolean> = {
  PlainYearMonth: true,
  PlainMonthDay: true,
  // otherwise, false
}

// toLocaleString
// -------------------------------------------------------------------------------------------------

export function formatMonthDayLocaleString(
  calendarIdLike: IdLike,
  fields: IsoDateFields,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  return formatLocaleString(transformMonthDayOptions, calendarIdLike, undefined, fields, locales, options, undefined, true)
}

export function formatYearMonthLocaleString(
  calendarIdLike: IdLike,
  fields: IsoDateFields,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  return formatLocaleString(transformYearMonthOptions, calendarIdLike, undefined, fields, locales, options, undefined, true)
}

export function formatDateLocaleString(
  calendarIdLike: IdLike,
  fields: IsoDateFields,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  return formatLocaleString(transformDateOptions, calendarIdLike, undefined, fields, locales, options)
}

export function formatDateTimeLocaleString(
  calendarIdLike: IdLike,
  fields: IsoDateTimeFields,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  return formatLocaleString(transformDateTimeOptions, calendarIdLike, undefined, fields, locales, options)
}

export function formatTimeLocaleString(
  fields: IsoTimeFields,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  return formatLocaleString(transformTimeOptions, undefined, undefined, fields, locales, options, timeFieldsToEpochNano)
}

export function formatInstantLocaleString(
  fields: { epochNanoseconds: DayTimeNano },
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  return formatLocaleString(transformEpochOptions, undefined, undefined, fields, locales, options, extractEpochNano)
}

export function formatZonedLocaleString(
  timeZoneIdLike: IdLike,
  calendarIdLike: IdLike,
  fields: { epochNanoseconds: DayTimeNano },
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  // Copy options so accessing doesn't cause side-effects
  // TODO: stop this from happening twice, in slotsToLocaleString too
  options = { ...options }

  // TODO: probably not necessary. already checked in optionsTransformers
  if ('timeZone' in options) {
    throw new TypeError('Cannot specify TimeZone')
  }

  return formatLocaleString(transformZonedEpochOptions, calendarIdLike, timeZoneIdLike, fields, locales, options, extractEpochNano)
}

export function formatLocaleString(
  transformOptions: OptionsTransformer,
  calendarIdLike: IdLike | undefined,
  timeZoneIdLike: IdLike | undefined,
  fields: any,
  locales?: LocalesArg,
  options: Intl.DateTimeFormatOptions = {},
  fieldsToEpochNano?: EpochNanoConverter,
  strictCalendarCheck?: boolean,
): string {
  options = { ...options } // copy options so accessing doesn't cause side-effects
  options = transformOptions(options, timeZoneIdLike)

  const subformat = new OrigDateTimeFormat(locales, options)
  const epochMilli = toEpochMilli(
    calendarIdLike,
    fields,
    subformat.resolvedOptions(),
    fieldsToEpochNano,
    strictCalendarCheck,
  )

  return subformat.format(epochMilli)
}

// Calendar Check
// -------------------------------------------------------------------------------------------------

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
