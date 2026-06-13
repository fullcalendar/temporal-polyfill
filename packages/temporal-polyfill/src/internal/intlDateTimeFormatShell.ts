import { mixin } from '../apiHelpers/classStyle'
import * as errorMessages from './errorMessages'
import { LocalesArg, OptionNames, RawDateTimeFormat } from './intlFormatUtils'
import {
  createStringTagDescriptors,
  identity,
  pluckProps,
  throwTypeError,
} from './utils'

export type DateTimeFormatSingleArgs =
  | [format: Intl.DateTimeFormat]
  | [format: Intl.DateTimeFormat, epochMilli: number]
export type DateTimeFormatRangeArgs = [
  format: Intl.DateTimeFormat,
  epochMilli0: number,
  epochMilli1: number,
]
export type DateTimeFormatArgsProvider<R> = {
  getArgsForSingle(record: R | undefined): DateTimeFormatSingleArgs
  getArgsForRange(record0: R, record1: R): DateTimeFormatRangeArgs
}
export type DateTimeFormatShellInternals = {
  baseFormat: Intl.DateTimeFormat
  resolvedLocale: string
  copiedOptions: Intl.DateTimeFormatOptions
  transformedOptions: Intl.DateTimeFormatOptions
}

// Creates a DateTimeFormat-shaped shell whose methods ask a caller-owned
// provider for raw Intl dispatch tuples. All policy, including Temporal
// compatibility and non-Temporal fallback, stays in that provider.
export function createDateTimeFormatShell<R>(
  createArgsProvider: (
    internals: DateTimeFormatShellInternals,
  ) => DateTimeFormatArgsProvider<R>,
  transformOptions: (
    options: Intl.DateTimeFormatOptions,
  ) => Intl.DateTimeFormatOptions = identity,
) {
  type ShellInternals = {
    argsProvider: DateTimeFormatArgsProvider<R>
    baseFormat: Intl.DateTimeFormat
    boundFormat?: (record?: R) => string
  }
  const internalsMap = new WeakMap<object, ShellInternals>()

  function getInternals(format: object): ShellInternals {
    const internals = internalsMap.get(format)
    if (!internals) {
      throwTypeError(errorMessages.invalidCallingContext)
    }
    return internals
  }

  class ShimDateTimeFormat {
    constructor(
      locales?: LocalesArg,
      options: Intl.DateTimeFormatOptions = Object.create(null),
    ) {
      const transformedOptions = transformOptions(options)
      const baseFormat = new RawDateTimeFormat(locales, transformedOptions)
      const resolvedOptions = baseFormat.resolvedOptions()

      // Copy the caller's own option keys from native resolved data. Providers
      // may need to create inner DTFs later, and re-reading user options then
      // would make formatting observably access options more than once.
      const copiedOptions = pluckProps(
        Object.keys(options) as OptionNames,
        resolvedOptions as Intl.DateTimeFormatOptions,
      )

      internalsMap.set(this, {
        argsProvider: createArgsProvider({
          baseFormat,
          resolvedLocale: resolvedOptions.locale,
          copiedOptions,
          transformedOptions,
        }),
        baseFormat,
      })
    }

    get format(): (record?: R) => string {
      const internals = getInternals(this)
      return (internals.boundFormat ||= (record?: R) => {
        const [format, ...rest] =
          internals.argsProvider.getArgsForSingle(record)
        return format.format(...rest)
      })
    }

    formatToParts(this: object, record?: R): Intl.DateTimeFormatPart[] {
      const { argsProvider } = getInternals(this)
      const [format, ...rest] = argsProvider.getArgsForSingle(record)
      return format.formatToParts(...rest)
    }

    resolvedOptions(): Intl.ResolvedDateTimeFormatOptions {
      return getInternals(this).baseFormat.resolvedOptions()
    }
  }

  const { prototype } = ShimDateTimeFormat

  // Conditional methods follow the host Intl surface area. Older runtimes that
  // lack formatRange/formatRangeToParts do not get shim methods for features
  // their native DateTimeFormat never exposed.
  if (
    (RawDateTimeFormat.prototype as Partial<Intl.DateTimeFormat>).formatRange
  ) {
    mixin(
      prototype,
      class {
        formatRange(this: object, record0: R, record1: R): string {
          const { argsProvider } = getInternals(this)
          const [format, epochMilli0, epochMilli1] =
            argsProvider.getArgsForRange(record0, record1)
          return format.formatRange(epochMilli0, epochMilli1)
        }

        formatRangeToParts(
          this: object,
          record0: R,
          record1: R,
        ): ReturnType<Intl.DateTimeFormat['formatRangeToParts']> {
          const { argsProvider } = getInternals(this)
          const [format, epochMilli0, epochMilli1] =
            argsProvider.getArgsForRange(record0, record1)
          return format.formatRangeToParts(epochMilli0, epochMilli1)
        }
      },
    )
  }

  // Native Intl.DateTimeFormat is callable without `new`, but an ES class is
  // not (and `new` would also consult @@hasInstance — see
  // constructor-no-instanceof). Wrap the shell class in a function; descriptor
  // copying below restores the builtin name/length shape.
  function DateTimeFormat(
    this: any,
    locales?: LocalesArg,
    options?: Intl.DateTimeFormatOptions,
  ) {
    return new ShimDateTimeFormat(locales, options)
  }

  // Copy constructor descriptors wholesale (name, length, supportedLocalesOf,
  // etc.) and swap only the prototype value to point at the shell prototype.
  const rawStaticDescriptors: PropertyDescriptorMap =
    Object.getOwnPropertyDescriptors(RawDateTimeFormat)
  rawStaticDescriptors.prototype.value = prototype
  Object.defineProperties(DateTimeFormat, rawStaticDescriptors)
  prototype.constructor = DateTimeFormat

  Object.defineProperties(
    prototype,
    createStringTagDescriptors('Intl.DateTimeFormat'),
  )

  return DateTimeFormat as unknown as typeof ShimDateTimeFormat
}
