import { DayTimeNano } from '../internal/dayTimeNano'
import { DurationFieldsWithSign } from '../internal/durationFields'
import { IsoDateFields, IsoDateTimeFields, IsoTimeFields } from '../internal/calendarIsoFields'
import { DurationBranding, InstantBranding, PlainDateBranding, PlainDateTimeBranding, PlainMonthDayBranding, PlainTimeBranding, PlainYearMonthBranding, ZonedDateTimeBranding } from './branding'

export type PlainDateSlots<C> = IsoDateFields & { calendar: C, branding: typeof PlainDateBranding }
export type PlainTimeSlots = IsoTimeFields & { branding: typeof PlainTimeBranding }
export type PlainDateTimeSlots<C> = IsoDateTimeFields & { calendar: C, branding: typeof PlainDateTimeBranding }
export type ZonedDateTimeSlots<C, T> = { epochNanoseconds: DayTimeNano, calendar: C, timeZone: T, branding: typeof ZonedDateTimeBranding }
export type PlainMonthDaySlots<C> = IsoDateFields & { calendar: C, branding: typeof PlainMonthDayBranding }
export type PlainYearMonthSlots<C> = IsoDateFields & { calendar: C, branding: typeof PlainYearMonthBranding }
export type DurationSlots = DurationFieldsWithSign & { branding: typeof DurationBranding }
export type InstantSlots = { epochNanoseconds: DayTimeNano, branding: typeof InstantBranding }
