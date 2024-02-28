import {
  FormatQuerier,
  OptionsTransformer,
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
import { LocalesArg } from '../internal/intlFormatUtils'
import { memoize } from '../internal/utils'

export const prepCachedPlainYearMonthFormat = createFormatPrepper(
  plainYearMonthConfig,
  /*@__PURE__*/ createFormatCache(),
)
export const prepCachedPlainMonthDayFormat = createFormatPrepper(
  plainMonthDayConfig,
  /*@__PURE__*/ createFormatCache(),
)
export const prepCachedPlainDateFormat = createFormatPrepper(
  plainDateConfig,
  /*@__PURE__*/ createFormatCache(),
)
export const prepCachedPlainDateTimeFormat = createFormatPrepper(
  plainDateTimeConfig,
  /*@__PURE__*/ createFormatCache(),
)
export const prepCachedPlainTimeFormat = createFormatPrepper(
  plainTimeConfig,
  /*@__PURE__*/ createFormatCache(),
)
export const prepCachedInstantFormat = createFormatPrepper(
  instantConfig,
  /*@__PURE__*/ createFormatCache(),
)
export const prepCachedZonedDateTimeFormat = createFormatPrepper(
  zonedDateTimeConfig,
  /*@__PURE__*/ createFormatCache(),
)

/*
Keyed by forcedTimeZoneId+locales+options
*/
function createFormatCache(): FormatQuerier {
  const queryFormatFactory = memoize((options: Intl.DateTimeFormatOptions) => {
    const map = new Map<string, Intl.DateTimeFormat>()

    return (
      forcedTimeZoneId: string | undefined,
      locales: LocalesArg | undefined,
      transformOptions: OptionsTransformer,
    ) => {
      const key = ([] as string[])
        .concat(forcedTimeZoneId || [], locales || [])
        .join()

      let format = map.get(key)
      if (!format) {
        format = createFormatForPrep(
          forcedTimeZoneId,
          locales,
          options,
          transformOptions,
        )
        map.set(key, format)
      }

      return format
    }
  }, WeakMap)

  return (forcedTimeZoneId, locales, options, transformOptions) => {
    return queryFormatFactory(options)(
      forcedTimeZoneId,
      locales,
      transformOptions,
    )
  }
}
