import {
  ClassFormatConfig,
  createFormatPrepper,
  dateConfig,
  dateTimeConfig,
  instantConfig,
  monthDayConfig,
  timeConfig,
  yearMonthConfig,
  zonedConfig,
} from '../internal/intlFormatPrep'

// For Intl.DateTimeFormat
// -----------------------------------------------------------------------------

export const classFormatConfigs: Record<string, ClassFormatConfig<any>> = {
  Instant: instantConfig,
  // ZonedDateTime not allowed to be formatted by Intl.DateTimeFormat
  PlainDateTime: dateTimeConfig,
  PlainDate: dateConfig,
  PlainTime: timeConfig,
  PlainYearMonth: yearMonthConfig,
  PlainMonthDay: monthDayConfig,
}

// For toLocaleString
// -----------------------------------------------------------------------------

export const prepInstantFormat = createFormatPrepper(instantConfig)
export const prepZonedDateTimeFormat = createFormatPrepper(zonedConfig)
export const prepPlainDateTimeFormat = createFormatPrepper(dateTimeConfig)
export const prepPlainDateFormat = createFormatPrepper(dateConfig)
export const prepPlainTimeFormat = createFormatPrepper(timeConfig)
export const prepPlainYearMonthFormat = createFormatPrepper(yearMonthConfig)
export const prepPlainMonthDayFormat = createFormatPrepper(monthDayConfig)
