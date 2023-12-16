import { Classlike, defineProps, pluckProps } from '../internal/utils'
import { OrigDateTimeFormat, LocalesArg, OptionNames, createBoundFormatPrepFunc, BoundFormatPrepFunc } from '../internal/formatIntl'

// public
import { ZonedDateTime } from './zonedDateTime'
import { PlainDate } from './plainDate'
import { PlainTime } from './plainTime'
import { PlainDateTime } from './plainDateTime'
import { PlainMonthDay } from './plainMonthDay'
import { PlainYearMonth } from './plainYearMonth'
import { Instant } from './instant'
import { getSlots } from './slotsForClasses'

type OrigFormattable = number | Date
type TemporalFormattable = Instant |
  PlainDate |
  PlainDateTime |
  ZonedDateTime |
  PlainYearMonth |
  PlainMonthDay |
  PlainTime

export type Formattable = TemporalFormattable | OrigFormattable

const prepSubformatMap = new WeakMap<DateTimeFormat, BoundFormatPrepFunc>()

// Intl.DateTimeFormat
// -------------------------------------------------------------------------------------------------

export class DateTimeFormat extends OrigDateTimeFormat {
  constructor(locales: LocalesArg, options: Intl.DateTimeFormatOptions = {}) {
    super(locales, options)

    // Copy options so accessing doesn't cause side-effects
    // Must store recursively flattened options because given `options` could mutate in future
    // Algorithm: whitelist against resolved options
    const resolvedOptions = this.resolvedOptions()
    const origOptions = pluckProps(
      Object.keys(options) as OptionNames,
      resolvedOptions as Intl.DateTimeFormatOptions
    )

    prepSubformatMap.set(this, createBoundFormatPrepFunc(origOptions, resolvedOptions))
  }

  format(arg?: Formattable): string {
    const prepSubformat = prepSubformatMap.get(this)!
    const [format, epochMilli] = prepSubformat(getSlots(arg))

    // can't use the origMethod.call() trick because .format() is always bound
    // https://tc39.es/ecma402/#sec-intl.datetimeformat.prototype.format
    return format
      ? format.format(epochMilli)
      : super.format(arg as OrigFormattable)
  }

  formatToParts(arg?: Formattable): Intl.DateTimeFormatPart[] {
    const prepSubformat = prepSubformatMap.get(this)!
    const [format, epochMilli] = prepSubformat(getSlots(arg))

    return format
      ? format.formatToParts(epochMilli)
      : super.formatToParts(arg as OrigFormattable)
  }
}

export interface DateTimeFormat {
  formatRange(arg0: Formattable, arg1: Formattable): string
  formatRangeToParts(arg0: Formattable, arg1: Formattable): Intl.DateTimeFormatPart[]
}

;['formatRange', 'formatRangeToParts'].forEach((methodName) => {
  const origMethod = (OrigDateTimeFormat as Classlike).prototype[methodName]

  if (origMethod) {
    defineProps(DateTimeFormat.prototype, {
      [methodName]: function (this: DateTimeFormat, arg0: Formattable, arg1: Formattable) {
        const prepSubformat = prepSubformatMap.get(this)!
        const [format, epochMilli0, epochMilli1] = prepSubformat(getSlots(arg0), getSlots(arg1))

        return format
          ? origMethod.call(format, epochMilli0, epochMilli1)
          : origMethod.call(this, arg0, arg1)
      }
    })
  }
})
