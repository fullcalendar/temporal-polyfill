import { isoCalendarId } from './calendarConfig'
import { CalendarOps } from './calendarOps'
import { getInternals, getTemporalName } from './class'
import { Instant } from './instant'
import {
  IsoDateInternals,
  IsoDateTimeInternals,
  IsoTimeFields,
  isoTimeFieldDefaults,
} from './isoFields'
import { epochNanoToMilli, isoEpochOriginYear } from './isoMath'
import { LargeInt } from './largeInt'
import { PlainDate } from './plainDate'
import { PlainDateTime } from './plainDateTime'
import { PlainMonthDay } from './plainMonthDay'
import { PlainTime } from './plainTime'
import { PlainYearMonth } from './plainYearMonth'
import { queryTimeZoneImpl } from './timeZoneImpl'
import { getSingleInstantFor } from './timeZoneOps'
import {
  Classlike,
  createLazyGenerator,
  defineProps,
  excludePropsByName,
  hasAnyPropsByName,
  identityFunc,
  pluckProps,
} from './utils'
import { ZonedDateTime, ZonedInternals } from './zonedDateTime'

export type LocalesArg = string | string[]

type OrigFormattable = number | Date
type TemporalFormattable =
  | Instant
  | PlainDate
  | PlainDateTime
  | ZonedDateTime
  | PlainYearMonth
  | PlainMonthDay
  | PlainTime

export type Formattable = TemporalFormattable | OrigFormattable

// toLocaleString
// -------------------------------------------------------------------------------------------------

export function toLocaleStringMethod(
  this: TemporalFormattable,
  internals: unknown,
  locales: LocalesArg,
  options: Intl.DateTimeFormatOptions,
) {
  const temporalName = getTemporalName(this)!
  const origFormat = new OrigDateTimeFormat(locales, options)

  // copy options
  const resolvedOptions = origFormat.resolvedOptions()
  const { locale } = resolvedOptions
  options = pluckProps(
    Object.keys(options) as OptionNames,
    resolvedOptions as Intl.DateTimeFormatOptions
  )

  options = optionsTransformers[temporalName](options, internals)
  const subformat = new OrigDateTimeFormat(locale, options)
  const epochMilli = toEpochMilli(temporalName, internals, resolvedOptions)

  return subformat.format(epochMilli)
}

// Temporal-aware Intl.DateTimeFormat
// -------------------------------------------------------------------------------------------------

type DateTimeFormatInternals = [
  SubformatFactory,
  Intl.ResolvedDateTimeFormatOptions,
]

type SubformatFactory = (temporalName: string) => Intl.DateTimeFormat | undefined

const formatInternalsMap = new WeakMap<Intl.DateTimeFormat, DateTimeFormatInternals>()

export const OrigDateTimeFormat = Intl.DateTimeFormat

export class DateTimeFormat extends OrigDateTimeFormat {
  constructor(locales: LocalesArg, options: Intl.DateTimeFormatOptions = {}) {
    super(locales, options)

    // copy options
    const resolvedOptions = this.resolvedOptions()
    const { locale } = resolvedOptions
    options = pluckProps(
      Object.keys(options) as OptionNames,
      resolvedOptions as Intl.DateTimeFormatOptions
    )

    const subformatFactory = createLazyGenerator((temporalName: string) => {
      if (optionsTransformers[temporalName]) {
        return new OrigDateTimeFormat(locale, optionsTransformers[temporalName](options))
      }
    })

    formatInternalsMap.set(this, [
      subformatFactory,
      resolvedOptions,
    ])
  }

  format(arg?: Formattable): string {
    const [formattable, format] = resolveSingleFormattable(this, arg)

    return format
      ? format.format(formattable)
      : super.format(formattable)
      // can't use the origMethd.call trick because .format() is always bound
      // https://tc39.es/ecma402/#sec-intl.datetimeformat.prototype.format
  }

  formatToParts(arg?: Formattable): Intl.DateTimeFormatPart[] {
    const [formattable, format] = resolveSingleFormattable(this, arg)

    return format
      ? format.formatToParts(formattable)
      : super.formatToParts(formattable)
  }
}

export interface DateTimeFormat {
  formatRange(arg0: Formattable, arg1: Formattable): string
  formatRangeToParts(arg0: Formattable, arg1: Formattable): Intl.DateTimeFormatPart[]
}

['formatRange', 'formatRangeToParts'].forEach((methodName) => {
  const origMethod = (OrigDateTimeFormat as Classlike).prototype[methodName]

  if (origMethod) {
    defineProps(DateTimeFormat.prototype, {
      [methodName]: function(
        this: Intl.DateTimeFormat,
        arg0: Formattable,
        arg1: Formattable,
      ) {
        const [formattable0, formattable1, format] = resolveRangeFormattables(this, arg0, arg1)
        return origMethod.call(format, formattable0, formattable1)
      }
    })
  }
})

// Intl.DateTimeFormat Arg-normalization Utils
// -------------------------------------------------------------------------------------------------

function resolveSingleFormattable(
  format: DateTimeFormat,
  arg: Formattable | undefined,
): [
  OrigFormattable | undefined,
  Intl.DateTimeFormat | undefined // undefined if should use orig method
] {
  if (arg !== undefined) {
    return resolveFormattable(arg, ...formatInternalsMap.get(format)!)
  }

  // arg was not specified (current datetime)
  return [arg] as unknown as
    [OrigFormattable | undefined, undefined]
}

function resolveRangeFormattables(
  format: DateTimeFormat | Intl.DateTimeFormat, // reused
  arg0: Formattable,
  arg1: Formattable,
): [
  OrigFormattable,
  OrigFormattable,
  Intl.DateTimeFormat, // always defined
] {
  const formatInternals = formatInternalsMap.get(format)!
  const [formattable0, format0] = resolveFormattable(arg0, ...formatInternals)
  const [formattable1, format1] = resolveFormattable(arg1, ...formatInternals)

  if (format0 || format1) {
    // the returned DateTimeFormats are idempotent per Temporal type,
    // so testing inequality is a way to test mismatching Temporal types.
    if (format0 !== format1) {
      throw new TypeError('Accepts two Temporal values of same type')
    }
    format = format0! // guaranteed to be truthy and equal
  }

  return [formattable0, formattable1, format]
}

function resolveFormattable(
  arg: Formattable,
  subformatFactory: SubformatFactory,
  resolvedOptions: Intl.ResolvedDateTimeFormatOptions,
): [
  OrigFormattable,
  Intl.DateTimeFormat | undefined // undefined if should use orig method
] {
  const temporalName = getTemporalName(arg)
  const format = temporalName && subformatFactory(temporalName)

  if (format) {
    const epochMilli = toEpochMilli(temporalName, getInternals(arg)!, resolvedOptions)
    return [epochMilli, format]
  }

  // arg is an OrigFormattable
  return [arg] as unknown as
    [OrigFormattable, undefined]
}

// Option Transformers
// -------------------------------------------------------------------------------------------------

type OptionNames = (keyof Intl.DateTimeFormatOptions)[]

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

// Options Transformer Config
// --------------------------

type OptionsTransformer = (
  options: Intl.DateTimeFormatOptions,
  subjectInternals?: any, // `this` object for toLocaleString
) => Intl.DateTimeFormatOptions

const zonedOptionsTransformer = createTransformer(zonedValidNames, zonedFallbacks, [])

const optionsTransformers: Record<string, OptionsTransformer> = {
  PlainMonthDay: createTransformer(monthDayValidNames, monthDayFallbacks, monthDayExclusions),
  PlainYearMonth: createTransformer(yearMonthValidNames, yearMonthFallbacks, yearMonthExclusions),
  PlainDate: createTransformer(dateValidNames, dateFallbacks, dateExclusions),
  PlainDateTime: createTransformer(dateTimeValidNames, dateTimeFallbacks, timeZoneNameStrs),
  PlainTime: createTransformer(timeValidNames, timeFallbacks, timeExclusions),
  Instant: createTransformer(dateTimeValidNames, dateTimeFallbacks, []),

  ZonedDateTime(options: Intl.DateTimeFormatOptions, subjectInternals?: ZonedInternals) {
    if (!subjectInternals) {
      throw new TypeError('Cant do on ZonedDateTime')
    }
    if (options.timeZone !== undefined) {
      throw new RangeError('Cannot specify timeZone')
    }
    options.timeZone = subjectInternals.timeZone.id
    return zonedOptionsTransformer(options)
  }
}

function createTransformer(
  validNames: OptionNames,
  fallbacks: Intl.DateTimeFormatOptions,
  excludedNames: OptionNames,
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

// Epoch Conversions
// -------------------------------------------------------------------------------------------------

type MaybeWithCalendar = { calendar?: CalendarOps }

function toEpochMilli(
  temporalName: string,
  internals: unknown | MaybeWithCalendar,
  resolvedOptions: Intl.ResolvedDateTimeFormatOptions,
) {
  if ((internals as MaybeWithCalendar).calendar) {
    checkCalendarsCompatible(
      (internals as MaybeWithCalendar).calendar!.id,
      resolvedOptions.calendar,
      strictCalendarCheck[temporalName],
    )
  }

  const internalsToEpochNano = epochNanoConverters[temporalName] || dateInternalsToEpochNano
  const epochNano = internalsToEpochNano(internals, resolvedOptions)
  return epochNanoToMilli(epochNano)
}

type EpochNanoConverter = (
  internals: any,
  resolvedOptions: Intl.ResolvedDateTimeFormatOptions,
) => LargeInt

const epochNanoConverters: Record<string, EpochNanoConverter> = {
  Instant: identityFunc,
  ZonedDateTime: (internals: ZonedInternals) => internals.epochNanoseconds,
  PlainTime: timeFieldsToEpochNano,
  // otherwise, use dateInternalsToEpochNano
}

function timeFieldsToEpochNano(
  internals: IsoTimeFields,
  resolvedOptions: Intl.ResolvedDateTimeFormatOptions,
): LargeInt {
  return getSingleInstantFor(
    queryTimeZoneImpl(resolvedOptions.timeZone),
    {
      isoYear: isoEpochOriginYear,
      isoMonth: 1,
      isoDay: 1,
      ...internals,
    },
  )
}

function dateInternalsToEpochNano(
  internals: IsoDateTimeInternals | IsoDateInternals,
  resolvedOptions: Intl.ResolvedDateTimeFormatOptions,
): LargeInt {
  return getSingleInstantFor(
    queryTimeZoneImpl(resolvedOptions.timeZone),
    {
      ...isoTimeFieldDefaults,
      isoHour: 12, // for whole-day dates, will not dst-shift into prev/next day
      ...internals,
    },
  )
}

// Calendar Check
// -------------------------------------------------------------------------------------------------

const strictCalendarCheck: Record<string, boolean> = {
  PlainYearMonth: true,
  PlainMonthDay: true,
}

function checkCalendarsCompatible(
  internalCalendarId: string,
  resolveCalendarId: string,
  strict?: boolean,
): void {
  if (
    (!strict || internalCalendarId !== isoCalendarId) &&
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
