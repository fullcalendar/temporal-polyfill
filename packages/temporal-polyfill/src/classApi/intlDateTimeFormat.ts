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
    new DateTimeFormatInternals(locales, options),
  )
}

function createFormatMethod(methodName: string) {
  return function (this: DateTimeFormat, ...formattables: Formattable[]) {
    const internals = internalsMap.get(this)!
    const [format, ...rawFormattables] = internals.prepFormat(...formattables)
    return (format as any)[methodName](...rawFormattables)
  }
}

function createProxiedMethod(methodName: string) {
  return function (this: DateTimeFormat, ...args: any[]) {
    const internals = internalsMap.get(this)!
    return (internals.coreFormat as any)[methodName](...args)
  }
}

// Descriptors
// -----------------------------------------------------------------------------

const members = RawDateTimeFormat.prototype
const memberDescriptors = Object.getOwnPropertyDescriptors(members)
const classDescriptors = Object.getOwnPropertyDescriptors(RawDateTimeFormat)

for (const memberName in memberDescriptors) {
  const memberDescriptor = memberDescriptors[memberName]

  if (memberName.startsWith('format')) {
    const formatMethod = createFormatMethod(memberName)

    // .format() is always bound to the instance. It's a getter
    // https://tc39.es/ecma402/#sec-intl.datetimeformat.prototype.format
    if (memberDescriptor.get) {
      memberDescriptor.get = function (this: DateTimeFormat) {
        return formatMethod.bind(this)
      }
    } else {
      memberDescriptor.value = formatMethod
    }
  } else if (memberName === 'constructor') {
    memberDescriptor.value = DateTimeFormat
  } else if (typeof memberDescriptor.value === 'function') {
    memberDescriptor.value = createProxiedMethod(memberName)
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

class DateTimeFormatInternals {
  coreFormat: Intl.DateTimeFormat
  coreLocale: string
  coreOptions: Intl.DateTimeFormatOptions

  queryFormatPrepperForBranding = createLazyGenerator(
    createFormatPrepperForBranding,
  )

  constructor(locales?: LocalesArg, options: Intl.DateTimeFormatOptions = {}) {
    this.coreFormat = new RawDateTimeFormat(locales, options)
    const resolveOptions = this.coreFormat.resolvedOptions()
    this.coreLocale = resolveOptions.locale

    // Copy options so accessing doesn't cause side-effects
    // Must store recursively flattened options because given `options` could mutate in future
    // Algorithm: whitelist against resolved options
    this.coreOptions = pluckProps(
      Object.keys(options) as OptionNames,
      resolveOptions as Intl.DateTimeFormatOptions,
    )
  }

  prepFormat(
    ...formattables: Formattable[]
  ): [Intl.DateTimeFormat, ...RawFormattable[]] {
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
      return this.queryFormatPrepperForBranding(branding)(
        this.coreLocale,
        this.coreOptions,
        ...(slotsList as BrandingSlots[]),
      )
    }

    return [this.coreFormat, ...formattables]
  }
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
