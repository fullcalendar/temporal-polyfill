import {
  DateTimeFormatArgsProvider,
  DateTimeFormatShellInternals,
  createDateTimeFormatShell,
} from '../../internal/intlDateTimeFormatShell'
import { LocalesArg } from '../../internal/intlFormatUtils'
import { DateTimeFormatLike } from '../commonTypes'

type DateTimeFormatFactoryConfig<R> = {
  transformOptions(
    options: Intl.DateTimeFormatOptions,
  ): Intl.DateTimeFormatOptions
  createArgsProvider(
    internals: DateTimeFormatShellInternals,
  ): DateTimeFormatArgsProvider<R>
}

// Creates the DTF-like object exposed by each func API Temporal type. The
// caller-owned closure performs Temporal-specific slot extraction,
// compatibility checks, formatter caching, and epoch conversion; this helper
// only centralizes Intl option-copying plus the DateTimeFormat method shell.
export function createDateTimeFormatFactory<R>({
  transformOptions,
  createArgsProvider,
}: DateTimeFormatFactoryConfig<R>): (
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
) => DateTimeFormatLike<R> {
  const ShimDateTimeFormat = createDateTimeFormatShell<R>({
    transformOptions,
    createArgsProvider,
  })

  return (
    locales?: LocalesArg,
    options?: Intl.DateTimeFormatOptions,
  ): DateTimeFormatLike<R> =>
    new ShimDateTimeFormat(locales, options) as unknown as DateTimeFormatLike<R>
}
