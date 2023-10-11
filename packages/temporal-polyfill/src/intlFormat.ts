import { isoCalendarId } from './calendarConfig'
import { DayTimeNano } from './dayTimeNano'
import {
  IsoTimeFields,
  isoTimeFieldDefaults,
} from './isoFields'
import { epochNanoToMilli, isoEpochOriginYear } from './isoMath'
import {
  Classlike,
  createLazyGenerator,
  defineProps,
  excludePropsByName,
  hasAnyPropsByName,
  pluckProps,
} from './utils'
import { IsoDateSlots, IsoDateTimeSlots, ZonedEpochSlots, getSlots, getSpecificSlots } from './slots'

// public
import type { ZonedDateTime } from './zonedDateTime'
import type { PlainDate } from './plainDate'
import type { PlainTime } from './plainTime'
import type { PlainDateTime } from './plainDateTime'
import type { PlainMonthDay } from './plainMonthDay'
import type { PlainYearMonth } from './plainYearMonth'
import type { Instant } from './instant'
import { CalendarSlot, getCalendarSlotId } from './calendarSlot'
import { getSingleInstantFor, getTimeZoneSlotId } from './timeZoneSlot'

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

export function createToLocaleStringMethods(branding: string) {
  return {
    toLocaleString(locales: LocalesArg, options: Intl.DateTimeFormatOptions = {}) {
      return slotsToLocaleString(getSpecificSlots(branding, this), locales, options)
    }
  }
}

export function slotsToLocaleString(slots: any, locales: LocalesArg, options: Intl.DateTimeFormatOptions = {}) {
  const { branding } = slots

  // Copy options so accessing doesn't cause side-effects
  options = { ...options }

  options = optionsTransformers[branding](options, slots)
  const subformat = new OrigDateTimeFormat(locales, options)
  const epochMilli = toEpochMilli(branding, slots, subformat.resolvedOptions())

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

    // Copy options so accessing doesn't cause side-effects
    // Must store recursively flattened options because given `options` could mutate in future
    // Algorithm: whitelist against resolved options
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
  const slots = getSlots(arg)
  const { branding } = slots || {}
  const format = branding && subformatFactory(branding)

  if (format) {
    const epochMilli = toEpochMilli(branding, slots!, resolvedOptions)
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
  subjectInternals?: any, // `this` object during toLocaleString
) => Intl.DateTimeFormatOptions

const zonedOptionsTransformer = createTransformer(zonedValidNames, zonedFallbacks, [])

const optionsTransformers: Record<string, OptionsTransformer> = {
  PlainMonthDay: createTransformer(monthDayValidNames, monthDayFallbacks, monthDayExclusions),
  PlainYearMonth: createTransformer(yearMonthValidNames, yearMonthFallbacks, yearMonthExclusions),
  PlainDate: createTransformer(dateValidNames, dateFallbacks, dateExclusions),
  PlainDateTime: createTransformer(dateTimeValidNames, dateTimeFallbacks, timeZoneNameStrs),
  PlainTime: createTransformer(timeValidNames, timeFallbacks, timeExclusions),
  Instant: createTransformer(dateTimeValidNames, dateTimeFallbacks, []),

  ZonedDateTime(options: Intl.DateTimeFormatOptions, subjectInternals?: ZonedEpochSlots) {
    if (!subjectInternals) {
      throw new TypeError('DateTimeFormat does not accept ZonedDateTime')
    }
    if (options.timeZone !== undefined) {
      throw new RangeError('Cannot specify timeZone') // for ZonedDateTime::toLocaleString
    }
    options.timeZone = getTimeZoneSlotId(subjectInternals.timeZone)
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

type MaybeWithCalendar = { calendar?: CalendarSlot }

function toEpochMilli(
  temporalName: string,
  internals: unknown | MaybeWithCalendar,
  resolvedOptions: Intl.ResolvedDateTimeFormatOptions,
) {
  if ((internals as MaybeWithCalendar).calendar) {
    checkCalendarsCompatible(
      temporalName,
      getCalendarSlotId((internals as MaybeWithCalendar).calendar!),
      resolvedOptions.calendar,
    )
  }

  const internalsToEpochNano = epochNanoConverters[temporalName] || dateInternalsToEpochNano
  const epochNano = internalsToEpochNano(internals, resolvedOptions)
  return epochNanoToMilli(epochNano)
}

type EpochNanoConverter = (
  internals: any,
  resolvedOptions: Intl.ResolvedDateTimeFormatOptions,
) => DayTimeNano

const epochNanoConverters: Record<string, EpochNanoConverter> = {
  Instant: (internals: ZonedEpochSlots) => internals.epochNanoseconds,
  ZonedDateTime: (internals: ZonedEpochSlots) => internals.epochNanoseconds,
  PlainTime: timeFieldsToEpochNano,
  // otherwise, use dateInternalsToEpochNano
}

function timeFieldsToEpochNano(
  internals: IsoTimeFields,
  resolvedOptions: Intl.ResolvedDateTimeFormatOptions,
): DayTimeNano {
  return getSingleInstantFor(
    resolvedOptions.timeZone,
    {
      calendar: isoCalendarId,
      isoYear: isoEpochOriginYear,
      isoMonth: 1,
      isoDay: 1,
      ...internals,
    },
  )
}

function dateInternalsToEpochNano(
  internals: IsoDateTimeSlots | IsoDateSlots,
  resolvedOptions: Intl.ResolvedDateTimeFormatOptions,
): DayTimeNano {
  return getSingleInstantFor(
    resolvedOptions.timeZone,
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
  temporalName: string,
  internalCalendarId: string,
  resolveCalendarId: string,
): void {
  if (
    (strictCalendarCheck[temporalName] || internalCalendarId !== isoCalendarId) &&
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
