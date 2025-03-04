import {
  FormatQuerier,
  OptionsTransformer,
  createFormatForPrep,
} from '../internal/intlFormatPrep'
import { LocalesArg } from '../internal/intlFormatUtils'
import { memoize } from '../internal/utils'

/*
Keyed by forcedTimeZoneId+locales+options
*/
export function createFormatCache(): FormatQuerier {
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
          /* strictOptions = */ false,
        )
        map.set(key, format!)
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
