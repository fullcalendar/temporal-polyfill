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
  PlainYearMonth: yearMonthConfig,
  PlainMonthDay: monthDayConfig,
  PlainDate: dateConfig,
  PlainDateTime: dateTimeConfig,
  PlainTime: timeConfig,
  Instant: instantConfig,
  // ZonedDateTime not allowed to be formatted by Intl.DateTimeFormat
}

// For toLocaleString
// -----------------------------------------------------------------------------

export const prepPlainYearMonthFormat = createFormatPrepper(yearMonthConfig)
export const prepPlainMonthDayFormat = createFormatPrepper(monthDayConfig)
export const prepPlainDateFormat = createFormatPrepper(dateConfig)
export const prepPlainDateTimeFormat = createFormatPrepper(dateTimeConfig)
export const prepPlainTimeFormat = createFormatPrepper(timeConfig)
export const prepInstantFormat = createFormatPrepper(instantConfig)
export const prepZonedDateTimeFormat = createFormatPrepper(zonedConfig)
