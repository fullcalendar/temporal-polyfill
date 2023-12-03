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

/*
RULES:
DateTimeFormat always determines calendar and timeZone. If given date object conflicts, throw error.
However, for ZonedDateTimeFormat::toLocaleString, timeZone is forced by obj and can't be provided.
*/

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

type OptionsTransformer = (options: Intl.DateTimeFormatOptions | undefined) => Intl.DateTimeFormatOptions

const transformMonthDayOptions = createTransformer(monthDayValidNames, monthDayFallbacks, monthDayExclusions)
const transformYearMonthOptions = createTransformer(yearMonthValidNames, yearMonthFallbacks, yearMonthExclusions)
const transformDateOptions = createTransformer(dateValidNames, dateFallbacks, dateExclusions)
const transformDateTimeOptions = createTransformer(dateTimeValidNames, dateTimeFallbacks, timeZoneNameStrs)
const transformTimeOptions = createTransformer(timeValidNames, timeFallbacks, timeExclusions)
const transformEpochOptions = createTransformer(dateTimeValidNames, dateTimeFallbacks)
const transformZonedEpochOptions = createTransformer(zonedValidNames, zonedFallbacks)

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

// Converting Fields to Epoch Milliseconds
// -------------------------------------------------------------------------------------------------

type EpochNanoConverter<S extends { calendar?: IdLike }> = (
  slots: S,
  resolvedOptions: Intl.ResolvedDateTimeFormatOptions,
) => DayTimeNano

export function toEpochMilli<S extends { calendar?: IdLike }>(
  slots: S,
  resolvedOptions: Intl.ResolvedDateTimeFormatOptions,
  slotsToEpochNano: EpochNanoConverter<S> = dateFieldsToEpochNano as any,
  strictCalendarCheck?: boolean,
) {
  if (slots.calendar) {
    checkCalendarsCompatible(
      getId(slots.calendar),
      resolvedOptions.calendar,
      strictCalendarCheck,
    )
  }

  const epochNano = slotsToEpochNano(slots, resolvedOptions)
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

export const epochNanoConverters: Record<string, EpochNanoConverter<any>> = {
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
  slots: IsoDateFields & { calendar: IdLike },
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  return formatLocaleString(slots, locales, transformMonthDayOptions(options), undefined, true)
}

export function formatYearMonthLocaleString(
  slots: IsoDateFields & { calendar: IdLike },
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  return formatLocaleString(slots, locales, transformYearMonthOptions(options), undefined, true)
}

export function formatDateLocaleString(
  slots: IsoDateFields & { calendar: IdLike },
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  return formatLocaleString(slots, locales, transformDateOptions(options))
}

export function formatDateTimeLocaleString(
  slots: IsoDateTimeFields & { calendar: IdLike },
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  return formatLocaleString(slots, locales, transformDateTimeOptions(options))
}

export function formatTimeLocaleString(
  slots: IsoTimeFields & { calendar?: IdLike },
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  return formatLocaleString(slots, locales, transformTimeOptions(options), timeFieldsToEpochNano)
}

export function formatInstantLocaleString(
  slots: { epochNanoseconds: DayTimeNano, calendar?: IdLike },
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  return formatLocaleString(slots, locales, transformEpochOptions(options), extractEpochNano)
}

export function formatZonedLocaleString(
  slots: { epochNanoseconds: DayTimeNano, calendar: IdLike, timeZone: IdLike },
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  options = transformZonedEpochOptions(options)

  if ('timeZone' in options) {
    throw new TypeError('Cannot specify TimeZone')
  }

  options.timeZone = getId(slots.timeZone)

  return formatLocaleString(slots, locales, options, extractEpochNano)
}

function formatLocaleString<S extends { calendar?: IdLike }>(
  slots: S,
  locales: LocalesArg | undefined,
  options: Intl.DateTimeFormatOptions,
  slotsToEpochNano?: EpochNanoConverter<S>,
  strictCalendarCheck?: boolean,
): string {
  const subformat = new OrigDateTimeFormat(locales, options)
  const epochMilli = toEpochMilli(
    slots,
    subformat.resolvedOptions(),
    slotsToEpochNano,
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
