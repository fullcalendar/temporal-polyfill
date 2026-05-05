import * as errorMessages from '../internal/errorMessages'
import {
  FormatPrepper,
  createFormatForPrep,
  createFormatPrepper,
  resolveDateTimeFormatResolvedOptions,
} from '../internal/intlFormatPrep'
import {
  LocalesArg,
  OptionNames,
  RawDateTimeFormat,
  RawFormattable,
} from '../internal/intlFormatUtils'
import { BrandingSlots } from '../internal/slots'
import { refineTimeZoneId } from '../internal/timeZoneId'
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
  function DateTimeFormatFunc(
    this: any,
    locales?: LocalesArg,
    options?: Intl.DateTimeFormatOptions,
  ) {
    return new (DateTimeFormatNew as Classlike)(locales, options)
  }

  // All calls to `new Intl.DateTimeFormat()` and `Intl.DateTimeFormat()` return
  // an instance of this class.
  function DateTimeFormatNew(
    this: any,
    locales: LocalesArg | undefined,
    options: Intl.DateTimeFormatOptions = Object.create(null), // protect against prototype pollution,
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
    const proxiedMethod =
      memberName === 'resolvedOptions'
        ? createResolvedOptionsMethod()
        : createProxiedMethod(memberName)

    if (typeof memberDescriptor.value === 'function') {
      memberDescriptor.value =
        memberName === 'constructor'
          ? DateTimeFormatFunc // expose more versatile
          : formatLikeMethod || proxiedMethod
    } else if (formatLikeMethod) {
      // .format() is always bound to the instance. It's a getter
      // https://tc39.es/ecma402/#sec-intl.datetimeformat.prototype.format
      memberDescriptor.get = function (this: DateTimeFormat) {
        /*
        Protects against querying .format on non-DateTimeFormats AND
        fake DateTimeFormats via `Object.create(Intl.DateTimeFormat.prototype)`
        */
        if (!internalsMap.has(this)) {
          throw new TypeError(errorMessages.invalidCallingContext)
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
  const isRange = methodName.includes('Range')
  const func = function (this: DateTimeFormat, ...formattables: Formattable[]) {
    const [format, ...rawFormattables] = prepDateTimeFormatCall(
      getDateTimeFormatInternals(this),
      isRange,
      formattables,
    )
    return (format as any)[methodName](...rawFormattables)
  }

  return Object.defineProperties(func, createNameDescriptors(methodName))
}

function createProxiedMethod(methodName: string) {
  const func = function (this: DateTimeFormat, ...args: any[]) {
    return (getDateTimeFormatInternals(this).rawFormat as any)[methodName](
      ...args,
    )
  }

  return Object.defineProperties(func, createNameDescriptors(methodName))
}

function createResolvedOptionsMethod() {
  const func = function (this: DateTimeFormat) {
    const internals = getDateTimeFormatInternals(this)
    const resolvedOptions = resolveDateTimeFormatResolvedOptions(
      internals.rawFormat,
    )
    const timeZone = internals.timeZone || resolvedOptions.timeZone

    return timeZone === resolvedOptions.timeZone
      ? resolvedOptions
      : { ...resolvedOptions, timeZone }
  }

  return Object.defineProperties(func, createNameDescriptors('resolvedOptions'))
}

// Internals
// -----------------------------------------------------------------------------

type DateTimeFormatInternals = {
  rawFormat: Intl.DateTimeFormat
  resolvedLocale: string
  copiedOptions: Intl.DateTimeFormatOptions
  queryFormatPrepperForBranding: <S extends BrandingSlots>(
    branding: S['branding'],
  ) => FormatPrepper<S>

  // Only set for public Intl.DateTimeFormat wrapper instances that received a
  // timeZone option. Internal time-zone probes use RawDateTimeFormat directly,
  // because they need the host's canonical target for offset calculations.
  timeZone?: string
}

function getDateTimeFormatInternals(
  format: DateTimeFormat,
): DateTimeFormatInternals {
  const internals = internalsMap.get(format)
  if (!internals) {
    throw new TypeError(errorMessages.invalidCallingContext)
  }
  return internals
}

function createDateTimeFormatInternals(
  locales: LocalesArg | undefined,
  options: Intl.DateTimeFormatOptions,
): DateTimeFormatInternals {
  const rawFormat = new RawDateTimeFormat(locales, options)
  const resolvedOptions = resolveDateTimeFormatResolvedOptions(rawFormat)
  const timeZone = readOwnDataTimeZoneOption(options)

  // Copy original options in an unobservable way, using resolveOptions' data
  // Necessary because options will be reaccessed later when making brand-specific
  // formatters, and prop access can't be observable
  // NOTE: pluckProps protects against prototype pollution (only function that does!)
  // view Object.create(null)
  const copiedOptions = pluckProps(
    Object.keys(options) as OptionNames,
    resolvedOptions as Intl.DateTimeFormatOptions,
  )

  return {
    rawFormat,
    resolvedLocale: resolvedOptions.locale,
    copiedOptions,
    queryFormatPrepperForBranding: memoize(createFormatPrepperForBranding),
    timeZone,
  }
}

function prepDateTimeFormatCall(
  internals: DateTimeFormatInternals,
  isRange: boolean,
  formattables: Formattable[],
): [Intl.DateTimeFormat, ...RawFormattable[]] {
  const formattableCnt = isRange ? 2 : 1

  if (isRange) {
    if (formattables[0] === undefined || formattables[1] === undefined) {
      // ECMA-402 requires both range endpoints before it can check type
      // compatibility. Use the same error as mixed Temporal/non-Temporal input.
      throw new TypeError(errorMessages.mismatchingFormatTypes)
    }
  } else if (formattables[0] === undefined) {
    // .format(undefined) and .formatToParts(undefined) match native Intl and
    // format the current time, so there is no Temporal adaptation to perform.
    return [internals.rawFormat]
  }

  let branding: string | undefined
  let hasMismatchingBranding = false
  let hasTemporalFormattable = false
  let hasRawFormattable = false
  const rawFormattables: RawFormattable[] = []
  const slotsList: BrandingSlots[] = []

  for (let i = 0; i < formattableCnt; i++) {
    const slots = getSlots(formattables[i])

    if (slots) {
      if (branding !== undefined && slots.branding !== branding) {
        hasMismatchingBranding = true
      }
      branding = slots.branding
      hasTemporalFormattable = true
      slotsList[i] = slots
    } else {
      hasRawFormattable = true
      rawFormattables[i] = Number(formattables[i])
    }
  }

  if (hasMismatchingBranding || (hasTemporalFormattable && hasRawFormattable)) {
    // ToDateTimeFormattable first converts all non-Temporal values. Only after
    // that can range formatting reject mixed or mismatched Temporal types.
    throw new TypeError(errorMessages.mismatchingFormatTypes)
  }

  if (branding !== undefined) {
    return internals.queryFormatPrepperForBranding(branding)(
      internals.resolvedLocale,
      internals.copiedOptions,
      ...slotsList,
    )
  }

  return [internals.rawFormat, ...rawFormattables]
}

function readOwnDataTimeZoneOption(
  options: Intl.DateTimeFormatOptions,
): string | undefined {
  const descriptor = Object.getOwnPropertyDescriptor(options, 'timeZone')

  if (
    !descriptor ||
    !('value' in descriptor) ||
    descriptor.value === undefined
  ) {
    return undefined
  }

  // Native Intl has already performed the observable GetOption sequence. Reuse
  // only an own data-property value here; accessor options must not be invoked a
  // second time just so older engines can preserve the caller's exact zone ID in
  // resolvedOptions().
  return refineTimeZoneId(descriptor.value)
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
