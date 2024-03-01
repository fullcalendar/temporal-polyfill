import {
  ClassFormatConfig,
  createFormatPrepper,
  instantConfig,
  plainDateConfig,
  plainDateTimeConfig,
  plainMonthDayConfig,
  plainTimeConfig,
  plainYearMonthConfig,
  zonedDateTimeConfig,
} from '../internal/intlFormatPrep'

// For Intl.DateTimeFormat
// -----------------------------------------------------------------------------

export const classFormatConfigs: Record<string, ClassFormatConfig<any>> = {
  PlainYearMonth: plainYearMonthConfig,
  PlainMonthDay: plainMonthDayConfig,
  PlainDate: plainDateConfig,
  PlainDateTime: plainDateTimeConfig,
  PlainTime: plainTimeConfig,
  Instant: instantConfig,
  // ZonedDateTime not allowed to be formatted by Intl.DateTimeFormat
}

// For toLocaleString
// -----------------------------------------------------------------------------

export const prepPlainYearMonthFormat =
  createFormatPrepper(plainYearMonthConfig)
export const prepPlainMonthDayFormat = createFormatPrepper(plainMonthDayConfig)
export const prepPlainDateFormat = createFormatPrepper(plainDateConfig)
export const prepPlainDateTimeFormat = createFormatPrepper(plainDateTimeConfig)
export const prepPlainTimeFormat = createFormatPrepper(plainTimeConfig)
export const prepInstantFormat = createFormatPrepper(instantConfig)
export const prepZonedDateTimeFormat = createFormatPrepper(zonedDateTimeConfig)
