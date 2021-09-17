/* eslint-disable @typescript-eslint/no-redeclare */
//
// SPECIAL NOTE:
// Imports from non-top-level files are not allowed
//
import * as TemporalImpl from './impl'
import { DateTimeFormatArg, DateTimeFormatWithTemporal, DateWithTemporal } from './impl'

const TemporalNative = globalThis.Temporal

function getBest<T>(name: string, fallback: T): T {
  return TemporalNative ? (TemporalNative as any)[name] : fallback
}

export const PlainMonthDay = getBest('PlainMonthDay', TemporalImpl.PlainMonthDay)
export const PlainDate = getBest('PlainDate', TemporalImpl.PlainDate)
export const PlainTime = getBest('PlainTime', TemporalImpl.PlainTime)
export const PlainDateTime = getBest('PlainDateTime', TemporalImpl.PlainDateTime)
export const ZonedDateTime = getBest('ZonedDateTime', TemporalImpl.ZonedDateTime)
export const Instant = getBest('Instant', TemporalImpl.Instant)
export const Calendar = getBest('Calendar', TemporalImpl.Calendar)
export const TimeZone = getBest('TimeZone', TemporalImpl.TimeZone)
export const Duration = getBest('Duration', TemporalImpl.Duration)
export const Now = getBest('Now', TemporalImpl.Now)

// Export types. Can't use ./public/args, need to use other top-level files
export * from './impl'

// Necessary so that classes don't merely appear as consts
// The produced definition is really messy. As part of the build process,
// the types from index-type.ts are used instead.
export interface PlainYearMonth extends TemporalImpl.PlainYearMonth {}
export interface PlainMonthDay extends TemporalImpl.PlainMonthDay {}
export interface PlainDate extends TemporalImpl.PlainDate {}
export interface PlainTime extends TemporalImpl.PlainTime {}
export interface PlainDateTime extends TemporalImpl.PlainDateTime {}
export interface ZonedDateTime extends TemporalImpl.ZonedDateTime {}
export interface Instant extends TemporalImpl.Instant {}
export interface Calendar extends TemporalImpl.Calendar {}
export interface TimeZone extends TemporalImpl.TimeZone {}
export interface Duration extends TemporalImpl.Duration {}

export const dateToTemporalInstant = TemporalNative
  ? (date: DateWithTemporal) => date.toTemporalInstant()
  : TemporalImpl.dateToTemporalInstant

export const intlFormat = TemporalNative
  ? (dtf: DateTimeFormatWithTemporal, dateArg?: DateTimeFormatArg) => dtf.format(dateArg)
  : TemporalImpl.intlFormat

export const intlFormatToParts = TemporalNative
  ? (dtf: DateTimeFormatWithTemporal, dateArg?: DateTimeFormatArg) => dtf.formatToParts(dateArg)
  : TemporalImpl.intlFormatToParts

export const intlFormatRange = TemporalNative
  ? (
      dtf: DateTimeFormatWithTemporal,
      startArg: DateTimeFormatArg,
      endArg: DateTimeFormatArg,
    ) => dtf.formatRange(startArg, endArg)
  : TemporalImpl.intlFormatRange

export const intlFormatRangeToParts = TemporalNative
  ? (
      dtf: DateTimeFormatWithTemporal,
      startArg: DateTimeFormatArg,
      endArg: DateTimeFormatArg,
    ) => dtf.formatRangeToParts(startArg, endArg)
  : TemporalImpl.intlFormatRangeToParts
