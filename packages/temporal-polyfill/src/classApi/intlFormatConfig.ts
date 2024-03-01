import {
  ClassFormatConfig,
  createFormatPrepper,
  instantConfig,
  isoDateFieldsToEpochNano,
  isoTimeFieldsToEpochNano,
  transformDateOptions,
  transformDateTimeOptions,
  transformMonthDayOptions,
  transformTimeOptions,
  transformYearMonthOptions,
  zonedDateTimeConfig,
} from '../internal/intlFormatPrep'
import {
  IsoDateFields,
  IsoDateTimeFields,
  IsoTimeFields,
} from '../internal/isoFields'

const plainYearMonthConfig: ClassFormatConfig<IsoDateFields> = [
  transformYearMonthOptions,
  isoDateFieldsToEpochNano,
  true, // strictCalendarChecks
]

const plainMonthDayConfig: ClassFormatConfig<IsoDateFields> = [
  transformMonthDayOptions,
  isoDateFieldsToEpochNano,
  true, // strictCalendarChecks
]

const plainDateConfig: ClassFormatConfig<IsoDateFields> = [
  transformDateOptions,
  isoDateFieldsToEpochNano,
]

const plainDateTimeConfig: ClassFormatConfig<IsoDateTimeFields> = [
  transformDateTimeOptions,
  isoDateFieldsToEpochNano,
]

const plainTimeConfig: ClassFormatConfig<IsoTimeFields> = [
  transformTimeOptions,
  isoTimeFieldsToEpochNano,
]

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
