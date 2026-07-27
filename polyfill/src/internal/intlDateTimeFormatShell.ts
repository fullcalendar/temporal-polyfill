import * as errorMessages from './errorMessages'
import { LocalesArg, OptionNames, RawDateTimeFormat } from './intlFormatUtils'
import {
  createPropDescriptors,
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
      const observedOptionNames: OptionNames = []

      // Hand native Intl a stand-in that forwards each option read to the
      // caller and records which ones it asked for. Caller proxies and
      // inherited accessors then see exactly native's Get operations, with no
      // second enumeration pass.
      //
      // The Proxy target must be a fresh empty object, NOT the caller's
      // options. Proxy invariant checks consult the target's own property
      // descriptors, so targeting a user-supplied object makes a nested user
      // proxy observe getOwnPropertyDescriptor calls native never performs. An
      // empty, extensible, property-less target constrains nothing, leaving the
      // `get` trap free to answer for any name -- including options a future
      // ECMA-402 adds, which a hardcoded name list would silently drop.
      const trackedOptions = new Proxy(Object.create(null), {
        get(_target: object, name: OptionNames[number]): unknown {
          const value = transformedOptions[name]
          if (value !== undefined) {
            observedOptionNames.push(name)
          }
          return value
        },
      })

      const baseFormat = new RawDateTimeFormat(locales, trackedOptions)
      const resolvedOptions = baseFormat.resolvedOptions()

      // Copy the options that native Intl actually observed from native
      // resolved data. Providers may need to create inner DTFs later, and
      // re-reading user options then would make formatting observably access
      // options more than once.
      const copiedOptions = pluckProps(
        observedOptionNames,
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
    Object.defineProperties(
      prototype,
      createPropDescriptors({
        formatRange(this: object, record0: R, record1: R): string {
          const { argsProvider } = getInternals(this)
          const [format, epochMilli0, epochMilli1] =
            argsProvider.getArgsForRange(record0, record1)
          return format.formatRange(epochMilli0, epochMilli1)
        },
        formatRangeToParts(
          this: object,
          record0: R,
          record1: R,
        ): ReturnType<Intl.DateTimeFormat['formatRangeToParts']> {
          const { argsProvider } = getInternals(this)
          const [format, epochMilli0, epochMilli1] =
            argsProvider.getArgsForRange(record0, record1)
          return format.formatRangeToParts(epochMilli0, epochMilli1)
        },
      }),
    )
  }

  // Native Intl.DateTimeFormat is callable without `new`, but an ES class is
  // not (and `new` would also consult @@hasInstance — see
  // constructor-no-instanceof). Wrap the shell class in a function; descriptor
  // copying below restores the builtin name/length shape.
  function DateTimeFormat(
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
