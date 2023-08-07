import { isoCalendarId } from './calendarConfig'
import { getInternals, getTemporalName } from './class'
import { Instant } from './instant'
import { IsoDateInternals, IsoDateTimeInternals, IsoTimeFields, isoTimeFieldDefaults } from './isoFields'
import { epochNanoToMilli, isoEpochOriginYear } from './isoMath'
import { LargeInt } from './largeInt'
import { PlainDate } from './plainDate'
import { PlainDateTime } from './plainDateTime'
import { PlainMonthDay } from './plainMonthDay'
import { PlainTime } from './plainTime'
import { PlainYearMonth } from './plainYearMonth'
import { queryTimeZoneImpl } from './timeZoneImpl'
import { getSingleInstantFor } from './timeZoneOps'
import { Classlike, createLazyGenerator, defineProps, excludePropsByName, hasAnyPropsByName, identityFunc } from './utils'
import { ZonedDateTime, ZonedInternals } from './zonedDateTime'

export type LocalesArg = string | string[]

type OrigFormattable = number | Date

export type Formattable =
  | Instant
  | PlainDate
  | PlainDateTime
  | ZonedDateTime
  | PlainYearMonth
  | PlainMonthDay
  | PlainTime
  | OrigFormattable

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
    options = whitelistOptions(resolvedOptions, options)

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

// toLocaleString
// -------------------------------------------------------------------------------------------------

export function toLocaleStringMethod(
  this: Formattable,
  internals: unknown,
  locales: LocalesArg,
  options: Intl.DateTimeFormatOptions,
) {
  const format = new DateTimeFormat(locales, options)
  return format.format(this)
}

export function zonedDateTimeToLocaleString(
  internals: ZonedInternals,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions, // reused
): string {
  const origFormat = new OrigDateTimeFormat(locales, options)

  // copy options
  const resolvedOptions = origFormat.resolvedOptions()
  const { locale } = resolvedOptions
  options = whitelistOptions(resolvedOptions, options!)

  if (options!.timeZone !== undefined) {
    throw new RangeError('Cannot specify timeZone')
  }
  options!.timeZone = internals.timeZone.id

  checkCalendarsCompatible(
    internals.calendar.id,
    resolvedOptions.calendar,
  )

  options = zonedOptionsTransformer(options!)
  const format = new OrigDateTimeFormat(locale, options)
  return format.format(epochNanoToMilli(internals.epochNanoseconds))
}

// Format-method Utils
// -------------------------------------------------------------------------------------------------

function resolveSingleFormattable(
  format: DateTimeFormat,
  arg: Formattable | undefined,
): [
  OrigFormattable | undefined,
  Intl.DateTimeFormat | undefined
] {
  if (arg !== undefined) {
    return resolveFormattable(arg, ...formatInternalsMap.get(format)!)
  }

  return [arg, format]
}

function resolveRangeFormattables(
  format: DateTimeFormat | Intl.DateTimeFormat, // reused
  arg0: Formattable,
  arg1: Formattable,
): [
  OrigFormattable,
  OrigFormattable,
  Intl.DateTimeFormat,
] {
  const formatInternals = formatInternalsMap.get(format)!
  const [formattable0, format0] = resolveFormattable(arg0, ...formatInternals)
  const [formattable1, format1] = resolveFormattable(arg1, ...formatInternals)

  if (format0 && format1) {
    // the returned DateTimeFormats are idempotent per Temporal type,
    // so testing inequality is a way to test mismatching Temporal types.
    if (format0 !== format1) {
      throw new TypeError('Accepts two Temporal values of same type')
    }
    format = format0
  }

  return [formattable0, formattable1, format]
}

function resolveFormattable(
  arg: Formattable,
  subformatFactory: SubformatFactory,
  resolvedOptions: Intl.ResolvedDateTimeFormatOptions,
): [
  OrigFormattable,
  Intl.DateTimeFormat | undefined
] {
  const temporalName = getTemporalName(arg)
  const format = temporalName && subformatFactory(temporalName)

  if (format) {
    const internalsToEpochNano = epochNanoConverters[temporalName] || dateInternalsToEpochNano
    const epochNano = internalsToEpochNano(getInternals(arg), resolvedOptions, temporalName)
    const epochMilli = epochNanoToMilli(epochNano)

    return [epochMilli, format]
  }

  return [arg as OrigFormattable] as unknown as
    [number, undefined]
}

// Format Option Massagers
// -------------------------------------------------------------------------------------------------

/*
For transformer: give specific instance if doing toLocaleString?
*/

type OptionsTransformer = (options: Intl.DateTimeFormatOptions) => Intl.DateTimeFormatOptions
type OptionNames = (keyof Intl.DateTimeFormatOptions)[]

const numericStr = 'numeric'
const monthDayFallbacks: Intl.DateTimeFormatOptions = { month: numericStr, day: numericStr }
const yearMonthFallbacks: Intl.DateTimeFormatOptions = { year: numericStr, month: numericStr }
const dateFallbacks: Intl.DateTimeFormatOptions = { ...yearMonthFallbacks, day: numericStr }
const timeFallbacks: Intl.DateTimeFormatOptions = { hour: numericStr, minute: numericStr, second: numericStr }
const dateTimeFallbacks: Intl.DateTimeFormatOptions = { ...dateFallbacks, ...timeFallbacks }
const zonedFallbacks: Intl.DateTimeFormatOptions = { ...dateTimeFallbacks, timeZoneName: 'short' }

const dateTimeExclusions: OptionNames = ['timeZoneName']

const monthDayValidNames = Object.keys(monthDayFallbacks) as OptionNames
const yearMonthValidNames = Object.keys(yearMonthFallbacks) as OptionNames
const dateValidNames: OptionNames = [...(Object.keys(dateFallbacks) as OptionNames), 'weekday', 'dateStyle']
const timeValidNames: OptionNames = [...(Object.keys(timeFallbacks) as OptionNames), 'dayPeriod', 'timeStyle']
const dateTimeValidNames: OptionNames = [...dateValidNames, ...timeValidNames]
const zonedValidNames: OptionNames = [...dateTimeValidNames, ...dateTimeExclusions]

const dateExclusions: OptionNames = [...dateTimeExclusions, ...timeValidNames]
const timeExclusions: OptionNames = [...dateTimeExclusions, ...dateValidNames]
const yearMonthExclusions: OptionNames = [
  ...dateTimeExclusions,
  'day',
  'weekday',
  'dateStyle',
  ...timeValidNames,
]
const monthDayExclusions: OptionNames = [
  ...dateTimeExclusions,
  'year',
  'weekday',
  'dateStyle',
  ...timeValidNames,
]

const optionsTransformers: Record<string, OptionsTransformer> = {
  PlainMonthDay: createTransformer(monthDayValidNames, monthDayFallbacks, monthDayExclusions),
  PlainYearMonth: createTransformer(yearMonthValidNames, yearMonthFallbacks, yearMonthExclusions),
  PlainDate: createTransformer(dateValidNames, dateFallbacks, dateExclusions),
  PlainDateTime: createTransformer(dateTimeValidNames, dateTimeFallbacks, dateTimeExclusions),
  PlainTime: createTransformer(timeValidNames, timeFallbacks, timeExclusions),
  Instant: createTransformer(dateTimeValidNames, dateTimeFallbacks, []),
  // Intl.DateTimeFormat can't be given a ZonedDateTime. for zonedDateTimeToLocaleString
  ZonedDateTime: () => { throw new TypeError('Cant do on ZonedDateTime') },
}

// for zonedDateTimeToLocaleString
const zonedOptionsTransformer = createTransformer(zonedValidNames, zonedFallbacks, [])

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

type EpochNanoConverter = (
  internals: any,
  resolvedOptions: Intl.ResolvedDateTimeFormatOptions,
  temporalName: string,
) => LargeInt

const epochNanoConverters: Record<string, EpochNanoConverter> = {
  Instant: identityFunc,
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
  temporalName: string,
): LargeInt {
  checkCalendarsCompatible(
    internals.calendar.id,
    resolvedOptions.calendar,
    strictCalendarCheck[temporalName],
  )

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
