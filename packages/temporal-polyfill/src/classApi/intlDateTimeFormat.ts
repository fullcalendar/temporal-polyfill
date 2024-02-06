import * as errorMessages from '../internal/errorMessages'
import {
  ClassFormatConfig,
  FormatPrepper,
  createFormatForPrep,
  createFormatPrepper,
  instantConfig,
  plainDateConfig,
  plainDateTimeConfig,
  plainMonthDayConfig,
  plainTimeConfig,
  plainYearMonthConfig,
  zonedDateTimeConfig,
} from '../internal/intlFormatPrep'
import {
  LocalesArg,
  OptionNames,
  RawDateTimeFormat,
  RawFormattable,
} from '../internal/intlFormatUtils'
import { BrandingSlots } from '../internal/slots'
import { Classlike, createLazyGenerator, pluckProps } from '../internal/utils'
import { Instant } from './instant'
import { PlainDate } from './plainDate'
import { PlainDateTime } from './plainDateTime'
import { PlainMonthDay } from './plainMonthDay'
import { PlainTime } from './plainTime'
import { PlainYearMonth } from './plainYearMonth'
import { getSlots } from './slotClass'
import { ZonedDateTime } from './zonedDateTime'

type TemporalFormattable =
  | Instant
  | PlainDate
  | PlainDateTime
  | ZonedDateTime
  | PlainYearMonth
  | PlainMonthDay
  | PlainTime

export type Formattable = TemporalFormattable | RawFormattable

const internalsMap = new WeakMap<DateTimeFormat, DateTimeFormatInternals>()

// Intl.DateTimeFormat
// -----------------------------------------------------------------------------

export interface DateTimeFormat extends Intl.DateTimeFormat {}

export function DateTimeFormat(
  this: any,
  locales: LocalesArg | undefined,
  options: Intl.DateTimeFormatOptions = {},
): DateTimeFormat | undefined {
  if (!(this instanceof DateTimeFormat)) {
    return new (DateTimeFormat as Classlike)(locales, options)
  }
  internalsMap.set(
    this as DateTimeFormat,
    createDateTimeFormatInternals(locales, options),
  )
}

function createFormatMethod(methodName: string) {
  return function (this: DateTimeFormat, ...formattables: Formattable[]) {
    const prepFormat = internalsMap.get(this)!
    const [format, ...rawFormattables] = prepFormat(...formattables)
    return (format as any)[methodName](...rawFormattables)
  }
}

function createProxiedMethod(methodName: string) {
  return function (this: DateTimeFormat, ...args: any[]) {
    const prepFormat = internalsMap.get(this)!
    return (prepFormat.rawFormat as any)[methodName](...args)
  }
}

// Descriptors
// -----------------------------------------------------------------------------

const members = RawDateTimeFormat.prototype
const memberDescriptors = Object.getOwnPropertyDescriptors(members)
const classDescriptors = Object.getOwnPropertyDescriptors(RawDateTimeFormat)

for (const memberName in memberDescriptors) {
  const memberDescriptor = memberDescriptors[memberName]
  const formatLikeMethod =
    memberName.startsWith('format') && createFormatMethod(memberName)

  if (typeof memberDescriptor.value === 'function') {
    memberDescriptor.value =
      memberName === 'constructor'
        ? DateTimeFormat
        : formatLikeMethod || createProxiedMethod(memberName)
  } else if (formatLikeMethod) {
    // .format() is always bound to the instance. It's a getter
    // https://tc39.es/ecma402/#sec-intl.datetimeformat.prototype.format
    memberDescriptor.get = function (this: DateTimeFormat) {
      return formatLikeMethod.bind(this)
    }
  }
}

classDescriptors.prototype.value = Object.create(members, memberDescriptors)
Object.defineProperties(DateTimeFormat, classDescriptors)

// Config
// -----------------------------------------------------------------------------

const classFormatConfigs: Record<string, ClassFormatConfig<any>> = {
  PlainYearMonth: plainYearMonthConfig,
  PlainMonthDay: plainMonthDayConfig,
  PlainDate: plainDateConfig,
  PlainDateTime: plainDateTimeConfig,
  PlainTime: plainTimeConfig,
  Instant: instantConfig,
  // ZonedDateTime not allowed to be formatted by Intl.DateTimeFormat
}

// Internals
// -----------------------------------------------------------------------------

type DateTimeFormatInternalPrepper = (
  ...formattables: Formattable[]
) => [Intl.DateTimeFormat, ...RawFormattable[]]

type DateTimeFormatInternals = DateTimeFormatInternalPrepper & {
  rawFormat: Intl.DateTimeFormat
}

function createDateTimeFormatInternals(
  locales?: LocalesArg,
  options: Intl.DateTimeFormatOptions = {},
): DateTimeFormatInternals {
  const rawFormat = new RawDateTimeFormat(locales, options)
  const resolveOptions = rawFormat.resolvedOptions()
  const resolvedLocale = resolveOptions.locale
  const copiedOptions = pluckProps(
    Object.keys(options) as OptionNames,
    resolveOptions as Intl.DateTimeFormatOptions,
  )
  const queryFormatPrepperForBranding = createLazyGenerator(
    createFormatPrepperForBranding,
  )

  const prepFormat: DateTimeFormatInternalPrepper = (
    ...formattables: Formattable[]
  ) => {
    let branding: string | undefined

    const slotsList = formattables.map((formattable, i) => {
      const slots = getSlots(formattable)
      const slotsBranding = (slots || {}).branding

      if (i && branding && branding !== slotsBranding) {
        throw new TypeError(errorMessages.mismatchingFormatTypes)
      }

      branding = slotsBranding
      return slots
    })

    if (branding) {
      return queryFormatPrepperForBranding(branding)(
        resolvedLocale,
        copiedOptions,
        ...(slotsList as BrandingSlots[]),
      )
    }

    return [rawFormat, ...formattables]
  }
  ;(prepFormat as DateTimeFormatInternals).rawFormat = rawFormat
  return prepFormat as DateTimeFormatInternals
}

function createFormatPrepperForBranding<S extends BrandingSlots>(
  branding: S['branding'],
): FormatPrepper<S> {
  const config = classFormatConfigs[branding]
  if (!config) {
    throw new TypeError(errorMessages.invalidFormatType(branding))
  }

  return createFormatPrepper(
    config,
    // a generator that conveniently caches by the first arg: forcedTimeZoneId
    createLazyGenerator(createFormatForPrep),
  )
}

// Format Prepping for each class' toLocaleString
// (best place for this?)
// -----------------------------------------------------------------------------

export const prepPlainYearMonthFormat =
  createFormatPrepper(plainYearMonthConfig)
export const prepPlainMonthDayFormat = createFormatPrepper(plainMonthDayConfig)
export const prepPlainDateFormat = createFormatPrepper(plainDateConfig)
export const prepPlainDateTimeFormat = createFormatPrepper(plainDateTimeConfig)
export const prepPlainTimeFormat = createFormatPrepper(plainTimeConfig)
export const prepInstantFormat = createFormatPrepper(instantConfig)
export const prepZonedDateTimeFormat = createFormatPrepper(zonedDateTimeConfig)
