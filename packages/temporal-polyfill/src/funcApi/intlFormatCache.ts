import {
  BasicZonedDateTimeSlots,
  FormatQuerier,
  OptionsTransformer,
  createFormatForPrep,
  createFormatPrepper,
  getCommonTimeZoneId,
  instantConfig,
  plainDateConfig,
  plainDateTimeConfig,
  plainMonthDayConfig,
  plainTimeConfig,
  plainYearMonthConfig,
  zonedDateTimeConfig,
} from '../internal/intlFormatPrep'
import { LocalesArg } from '../internal/intlFormatUtils'
import { createLazyGenerator } from '../internal/utils'

function createFormatCache<S>(
  hashSlots?: (slots0: S, slots1?: S) => string,
): FormatQuerier<S> {
  const queryFormatFactory = createLazyGenerator(
    (options: Intl.DateTimeFormatOptions) => {
      const map = new Map<string, Intl.DateTimeFormat>()

      return (
        locales: LocalesArg | undefined,
        transformOptions: OptionsTransformer<S>,
        slots0: S,
        slots1?: S,
      ) => {
        const key = ([] as string[])
          .concat(hashSlots ? [hashSlots(slots0, slots1)] : [], locales || [])
          .join()

        let format = map.get(key)
        if (!format) {
          format = createFormatForPrep(
            locales,
            options,
            transformOptions,
            slots0,
            slots1,
          )
          map.set(key, format)
        }

        return format
      }
    },
    WeakMap,
  )

  return (locales, options, transformOptions, slots0, slots1) => {
    return queryFormatFactory(options)(
      locales,
      transformOptions,
      slots0,
      slots1,
    )
  }
}

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
  /*@__PURE__*/ createFormatCache<BasicZonedDateTimeSlots>(getCommonTimeZoneId),
)
