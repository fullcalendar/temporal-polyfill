import * as errorMessages from './errorMessages'
import { LocalesArg, OptionNames, RawDateTimeFormat } from './intlFormatUtils'
import { createNameDescriptors, pluckProps } from './utils'

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
  format: Intl.DateTimeFormat
  resolvedLocale: string
  copiedOptions: Intl.DateTimeFormatOptions
  transformedOptions: Intl.DateTimeFormatOptions
}
type DateTimeFormatShellConfig<R> = {
  superClass: { prototype: object }
  transformOptions?(
    options: Intl.DateTimeFormatOptions,
  ): Intl.DateTimeFormatOptions
  createArgsProvider(
    internals: DateTimeFormatShellInternals,
  ): DateTimeFormatArgsProvider<R>
}

type RawDateTimeFormatClass = new (
  _locales?: LocalesArg,
  _options?: Intl.DateTimeFormatOptions,
) => any

const RawDateTimeFormatClass =
  RawDateTimeFormat as unknown as RawDateTimeFormatClass

// The public methods below overload DateTimeFormat methods to accept Temporal
// records, but the final dispatch must pass epoch milliseconds to a real DTF.
// Save the raw Intl entry points so fixed-zone formatters can target the outer
// subclass instance, while ZonedDateTime can target cached inner DTFs without
// re-entering these Temporal-record overloads. `format` is an accessor, so save
// its getter rather than reading a bound formatter from one instance.
const rawFormat = Object.getOwnPropertyDescriptor(
  RawDateTimeFormat.prototype,
  'format',
)!.get!
const rawFormatToParts = RawDateTimeFormat.prototype.formatToParts
const rawFormatRange = RawDateTimeFormat.prototype.formatRange
const rawFormatRangeToParts = RawDateTimeFormat.prototype.formatRangeToParts
const rawResolvedOptions = RawDateTimeFormat.prototype.resolvedOptions

// Creates an Intl.DateTimeFormat subclass whose methods ask a caller-owned
// provider for raw Intl dispatch tuples. All policy, including Temporal
// compatibility and non-Temporal fallback, stays in that provider.
export function createDateTimeFormatShell<R>({
  superClass,
  transformOptions = (options) => options,
  createArgsProvider,
}: DateTimeFormatShellConfig<R>) {
  const argsProviderMap = new WeakMap<object, DateTimeFormatArgsProvider<R>>()

  function getArgsProvider(format: object): DateTimeFormatArgsProvider<R> {
    const argsProvider = argsProviderMap.get(format)
    if (!argsProvider) {
      throw new TypeError(errorMessages.invalidCallingContext)
    }
    return argsProvider
  }

  class ShimDateTimeFormat extends RawDateTimeFormatClass {
    constructor(
      locales?: LocalesArg,
      options: Intl.DateTimeFormatOptions = Object.create(null),
    ) {
      const transformedOptions = transformOptions(options)
      super(locales, transformedOptions)

      const format = this as unknown as Intl.DateTimeFormat
      const resolvedOptions = rawResolvedOptions.call(format)

      // Copy the caller's own option keys from native resolved data. Providers
      // may need to create inner DTFs later, and re-reading user options then
      // would make formatting observably access options more than once.
      const copiedOptions = pluckProps(
        Object.keys(options) as OptionNames,
        resolvedOptions as Intl.DateTimeFormatOptions,
      )

      argsProviderMap.set(
        this,
        createArgsProvider({
          format,
          resolvedLocale: resolvedOptions.locale,
          copiedOptions,
          transformedOptions,
        }),
      )
    }

    get format(): (record?: R) => string {
      const argsProvider = getArgsProvider(this)
      return (record?: R) => {
        const [format, ...rest] = argsProvider.getArgsForSingle(record)
        return rawFormat.call(format)(...rest)
      }
    }

    formatToParts(record?: R): Intl.DateTimeFormatPart[] {
      const argsProvider = getArgsProvider(this)
      const [format, ...rest] = argsProvider.getArgsForSingle(record)
      return rawFormatToParts.call(format, ...rest)
    }

    formatRange(record0: R, record1: R): string {
      const argsProvider = getArgsProvider(this)
      const [format, epochMilli0, epochMilli1] = argsProvider.getArgsForRange(
        record0,
        record1,
      )
      return rawFormatRange.call(format, epochMilli0, epochMilli1)
    }

    formatRangeToParts(
      record0: R,
      record1: R,
    ): ReturnType<Intl.DateTimeFormat['formatRangeToParts']> {
      const argsProvider = getArgsProvider(this)
      const [format, epochMilli0, epochMilli1] = argsProvider.getArgsForRange(
        record0,
        record1,
      )
      return rawFormatRangeToParts.call(format, epochMilli0, epochMilli1)
    }

    // Output is identical to native (the instance is a real DTF), so this only
    // exists to make `resolvedOptions` an OWN property of the prototype like the
    // sibling methods. Otherwise it'd be merely inherited through the `extends`
    // chain and resolvedOptions/prop-desc's own-property check would fail.
    resolvedOptions(): Intl.ResolvedDateTimeFormatOptions {
      return rawResolvedOptions.call(this)
    }
  }

  // Callers own this prototype ancestry because the class/global API needs the
  // builtin `Intl.DateTimeFormat.prototype -> Object.prototype` shape, while
  // the func API keeps the captured native prototype in the chain for
  // `instanceof Intl.DateTimeFormat` without replacing the global constructor.
  Object.setPrototypeOf(ShimDateTimeFormat.prototype, superClass.prototype)

  // Native Intl.DateTimeFormat is callable without `new`, but an ES class is
  // not (and `new` would also consult @@hasInstance — see
  // constructor-no-instanceof). Wrap the subclass in a zero-argument
  // `DateTimeFormat` function whose name/length match the builtin; all instance
  // behavior stays on the subclass above.
  function DateTimeFormat(
    this: any,
    ...args: [locales?: LocalesArg, options?: Intl.DateTimeFormatOptions]
  ) {
    return new ShimDateTimeFormat(args[0], args[1])
  }

  // Mirror the builtin's own-property descriptors so the test262 descriptor
  // checks pass: a non-writable `prototype` (other attributes are inherited
  // from the function's existing descriptor), plus `supportedLocalesOf`,
  // `constructor`, and @@toStringTag copied verbatim from the native objects.
  const { prototype } = ShimDateTimeFormat
  Object.defineProperties(
    DateTimeFormat,
    createNameDescriptors('DateTimeFormat'),
  )
  Object.defineProperty(DateTimeFormat, 'prototype', {
    value: prototype,
    writable: false,
  })
  Object.defineProperty(
    DateTimeFormat,
    'supportedLocalesOf',
    Object.getOwnPropertyDescriptor(RawDateTimeFormat, 'supportedLocalesOf')!,
  )
  Object.defineProperties(prototype, {
    constructor: { configurable: true, writable: true, value: DateTimeFormat },
    [Symbol.toStringTag]: Object.getOwnPropertyDescriptor(
      RawDateTimeFormat.prototype,
      Symbol.toStringTag,
    )!,
  })

  return DateTimeFormat as unknown as typeof ShimDateTimeFormat
}
