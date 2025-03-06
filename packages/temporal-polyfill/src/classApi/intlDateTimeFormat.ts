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
import { Classlike, memoize, pluckProps } from '../internal/utils'
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
  // public-facing
  // Intl.DateTimeFormat can be called without `new`
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#return_value
  const DateTimeFormatFunc = function (
    this: any,
    locales?: LocalesArg,
    options?: Intl.DateTimeFormatOptions,
  ) {
    return new (DateTimeFormatNew as Classlike)(locales, options)
  }

  // internal constructor
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
          ? DateTimeFormatFunc // expose public-facing
          : formatLikeMethod || createProxiedMethod(memberName)
    } else if (formatLikeMethod) {
      // .format() is always bound to the instance. It's a getter
      // https://tc39.es/ecma402/#sec-intl.datetimeformat.prototype.format
      memberDescriptor.get = function (this: DateTimeFormat) {
        return formatLikeMethod.bind(this)
      }
    }
  }

  // Prototype madness so that:
  //   new Intl.DateTimeFormat() instanceof Intl.DateTimeFormat
  //   Intl.DateTimeFormat() instanceof Intl.DateTimeFormat
  //
  // give methods to superclass (DateTimeFormatNew)
  const superclassProto = (DateTimeFormatNew.prototype = Object.create(
    members,
    memberDescriptors,
  ))
  // prepare DateTimeFormatFunc to be a subclass of DateTimeFormatNew
  classDescriptors.prototype.value = superclassProto
  // attach public-facing class-functions to subclass (DateTimeFormatFunc)
  Object.defineProperties(DateTimeFormatFunc, classDescriptors)

  // expose only public-facing subclass
  return DateTimeFormatFunc as Classlike
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

  // I forget, why the copying?
  const copiedOptions = pluckProps(
    Object.keys(options) as OptionNames,
    resolveOptions as Intl.DateTimeFormatOptions,
  )
  fixResolvedOptionsCalendar(copiedOptions as any, options, locales)

  const queryFormatPrepperForBranding = memoize(createFormatPrepperForBranding)

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
    memoize(createFormatForPrep),
    /* strictOptions = */ true,
  )
}
