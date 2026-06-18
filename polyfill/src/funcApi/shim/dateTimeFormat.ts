import {
  DateTimeFormatArgsProvider,
  DateTimeFormatShellInternals,
  createDateTimeFormatShell,
} from '../../internal/intlDateTimeFormatShell'
import { LocalesArg, RawDateTimeFormat } from '../../internal/intlFormatUtils'
import { DateTimeFormatLike } from '../commonTypes'

// Creates the DTF-like object exposed by each func API Temporal type. The
// caller-owned closure performs Temporal-specific slot extraction,
// compatibility checks, formatter caching, and epoch conversion; this helper
// only centralizes Intl option-copying plus the DateTimeFormat method shell.
export function createDateTimeFormatFactory<R>(
  createArgsProvider: (
    internals: DateTimeFormatShellInternals,
  ) => DateTimeFormatArgsProvider<R>,
  transformOptions?: (
    options: Intl.DateTimeFormatOptions,
  ) => Intl.DateTimeFormatOptions,
): (
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
) => DateTimeFormatLike<R> {
  const ShimDateTimeFormat = createDateTimeFormatShell<R>(
    createArgsProvider,
    transformOptions,
  )

  // Func API formatters do not replace the global constructor, so keep native
  // Intl.DateTimeFormat.prototype in the chain for `instanceof Intl.DateTimeFormat`.
  Object.setPrototypeOf(
    ShimDateTimeFormat.prototype,
    RawDateTimeFormat.prototype,
  )

  return (
    locales?: LocalesArg,
    options?: Intl.DateTimeFormatOptions,
  ): DateTimeFormatLike<R> =>
    new ShimDateTimeFormat(locales, options) as unknown as DateTimeFormatLike<R>
}
