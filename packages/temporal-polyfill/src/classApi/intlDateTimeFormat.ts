import * as errorMessages from '../internal/errorMessages'
import {
  FormatPrepper,
  createFormatForPrep,
  createFormatPrepper,
  fixResolvedOptionsCalendar,
} from '../internal/intlFormatPrep'
import {
  LocalesArg,
  OptionNames,
  RawDateTimeFormat,
  RawFormattable,
} from '../internal/intlFormatUtils'
import { BrandingSlots } from '../internal/slots'
import {
  Classlike,
  createNameDescriptors,
  memoize,
  pluckProps,
} from '../internal/utils'
import { Instant } from './instant'
import { classFormatConfigs } from './intlFormatConfig'
import { PlainDate } from './plainDate'
import { PlainDateTime } from './plainDateTime'
import { PlainMonthDay } from './plainMonthDay'
import { PlainTime } from './plainTime'
import { PlainYearMonth } from './plainYearMonth'
import { getSlots } from './slotClass'
import { ZonedDateTime } from './zonedDateTime'

export type TemporalFormattable =
  | Instant
  | PlainDate
  | PlainDateTime
  | ZonedDateTime
  | PlainYearMonth
  | PlainMonthDay
  | PlainTime

export type Formattable = TemporalFormattable | RawFormattable

// Intl.DateTimeFormat
// -----------------------------------------------------------------------------

export type DateTimeFormat = Intl.DateTimeFormat
export const DateTimeFormat = createDateTimeFormatClass()

const internalsMap = new WeakMap<Intl.DateTimeFormat, DateTimeFormatInternals>()

function createDateTimeFormatClass(): typeof Intl.DateTimeFormat {
  // The Intl.DateTimeFormat object
  // More versatile because accommodates
  // `new Intl.DateTimeFormat()` and `Intl.DateTimeFormat()`
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#return_value
  const DateTimeFormatFunc = function (
    this: any,
    locales?: LocalesArg,
    options?: Intl.DateTimeFormatOptions,
  ) {
    return new (DateTimeFormatNew as Classlike)(locales, options)
  }

  // All calls to `new Intl.DateTimeFormat()` and `Intl.DateTimeFormat()` return
  // an instance of this class.
  const DateTimeFormatNew = function (
    this: any,
    locales: LocalesArg | undefined,
    options: Intl.DateTimeFormatOptions = {},
  ) {
    internalsMap.set(
      this as DateTimeFormat,
      createDateTimeFormatInternals(locales, options),
    )
  }

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
          ? DateTimeFormatFunc // expose more versatile
          : formatLikeMethod || createProxiedMethod(memberName)
    } else if (formatLikeMethod) {
      // .format() is always bound to the instance. It's a getter
      // https://tc39.es/ecma402/#sec-intl.datetimeformat.prototype.format
      memberDescriptor.get = function (this: DateTimeFormat) {
        /*
        Protects against querying .format on non-DateTimeFormats AND
        fake DateTimeFormats via `Object.create(Intl.DateTimeFormat.prototype)`
        */
        if (!internalsMap.has(this)) {
          throw new TypeError('BAD!')
        }

        // don't do Function::bind, because gives weird .name
        return (...args: any[]) => formatLikeMethod.apply(this, args)
      }

      Object.defineProperties(
        memberDescriptor.get,
        createNameDescriptors(`get ${memberName}`),
      )
    }
  }

  // Both share prototype so they're both `instanceof` eachother
  classDescriptors.prototype.value = // eventually for DateTimeFormatFunc
    DateTimeFormatNew.prototype = Object.create({}, memberDescriptors)

  // Define static methods on the eventual Intl.DateTimeFormat
  Object.defineProperties(DateTimeFormatFunc, classDescriptors)

  return DateTimeFormatFunc as Classlike
}

function createFormatMethod(methodName: string) {
  const func = function (this: DateTimeFormat, ...formattables: Formattable[]) {
    const prepFormat = internalsMap.get(this)!
    const [format, ...rawFormattables] = prepFormat(
      methodName.includes('Range'), // HACK for deterining if range method
      ...formattables,
    )
    return (format as any)[methodName](...rawFormattables)
  }

  return Object.defineProperties(func, createNameDescriptors(methodName))
}

function createProxiedMethod(methodName: string) {
  const func = function (this: DateTimeFormat, ...args: any[]) {
    const prepFormat = internalsMap.get(this)!
    return (prepFormat.rawFormat as any)[methodName](...args)
  }

  return Object.defineProperties(func, createNameDescriptors(methodName))
}

// Internals
// -----------------------------------------------------------------------------

type DateTimeFormatInternalPrepper = (
  isRange: boolean,
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

  // Copy original options in an unobservable way, using resolveOptions' data
  // Necessary because options will be reaccessed later when making brand-specific
  // formatters, and prop access can't be observable
  // NOTE: pluckProps protects against prototype pollution (only function that does!)
  const copiedOptions = pluckProps(
    Object.keys(options) as OptionNames,
    resolveOptions as Intl.DateTimeFormatOptions,
  )
  fixResolvedOptionsCalendar(copiedOptions as any, options, locales)

  const queryFormatPrepperForBranding = memoize(createFormatPrepperForBranding)

  /*
  TODO: this is overarchitected. done to accommodate format() and formatRange()
  */
  const prepFormat: DateTimeFormatInternalPrepper = (
    isRange: boolean, // HACK
    ...formattables: Formattable[]
  ) => {
    if (isRange) {
      if (formattables.length !== 2) {
        throw new TypeError('BAD!')
      }
      // check for any undefined arguments first
      for (const formattable of formattables) {
        if (formattable === undefined) {
          throw new TypeError('BAD!')
        }
      }
    }

    // HACK for .format(undefined), which should be same as .format()
    if (!isRange && formattables[0] === undefined) {
      formattables = []
    }

    const formattableEssences = formattables.map((formattable) => {
      return getSlots(formattable) || Number(formattable)
    })

    let overallBranding: string | undefined
    let i = 0

    for (const formattableEssence of formattableEssences) {
      const slotsBranding =
        typeof formattableEssence === 'object'
          ? formattableEssence.branding
          : undefined

      if (i++ && slotsBranding !== overallBranding) {
        throw new TypeError(errorMessages.mismatchingFormatTypes)
      }

      overallBranding = slotsBranding
    }

    if (overallBranding) {
      return queryFormatPrepperForBranding(overallBranding)(
        resolvedLocale,
        copiedOptions,
        ...(formattableEssences as BrandingSlots[]),
      )
    }

    return [rawFormat, ...(formattableEssences as number[])]
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
    memoize(createFormatForPrep),
    /* strictOptions = */ true,
  )
}
