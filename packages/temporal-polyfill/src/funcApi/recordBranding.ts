import {
  CalendarBranding,
  DurationBranding,
  InstantBranding,
  PlainDateBranding,
  PlainDateTimeBranding,
  PlainMonthDayBranding,
  PlainTimeBranding,
  PlainYearMonthBranding,
  ZonedDateTimeBranding,
} from '../apiHelpers/branding'

const recordPostfix = 'Record'

export const PlainYearMonthRecordBranding =
  `${PlainYearMonthBranding}${recordPostfix}` as const
export const PlainMonthDayRecordBranding =
  `${PlainMonthDayBranding}${recordPostfix}` as const
export const PlainDateRecordBranding =
  `${PlainDateBranding}${recordPostfix}` as const
export const PlainDateTimeRecordBranding =
  `${PlainDateTimeBranding}${recordPostfix}` as const
export const PlainTimeRecordBranding =
  `${PlainTimeBranding}${recordPostfix}` as const
export const ZonedDateTimeRecordBranding =
  `${ZonedDateTimeBranding}${recordPostfix}` as const
export const InstantRecordBranding =
  `${InstantBranding}${recordPostfix}` as const
export const DurationRecordBranding =
  `${DurationBranding}${recordPostfix}` as const
export const CalendarRecordBranding =
  `${CalendarBranding}${recordPostfix}` as const
