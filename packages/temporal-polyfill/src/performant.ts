/* eslint-disable @typescript-eslint/no-redeclare */
/*
The "performant" API will attempt to use the native Temporal lib first,
and will fall back to the JS implementation.

SPECIAL NOTE:
Imports from non-top-level files are not allowed
*/
import * as TemporalImpl from './impl'
import { DateWithTemporal } from './impl'

const TemporalNative = globalThis.Temporal
const TemporalPerformant = TemporalNative || TemporalImpl

/*
SPECIAL NOTE:
Must keep in sync with the class/function exports from ./impl.ts
*/

export const PlainYearMonth = TemporalPerformant.PlainYearMonth
export const PlainMonthDay = TemporalPerformant.PlainMonthDay
export const PlainDate = TemporalPerformant.PlainDate
export const PlainTime = TemporalPerformant.PlainTime
export const PlainDateTime = TemporalPerformant.PlainDateTime
export const ZonedDateTime = TemporalPerformant.ZonedDateTime
export const Instant = TemporalPerformant.Instant
export const Calendar = TemporalPerformant.Calendar
export const TimeZone = TemporalPerformant.TimeZone
export const Duration = TemporalPerformant.Duration
export const Now = TemporalPerformant.Now

export const dateToTemporalInstant = TemporalNative
  ? (date: DateWithTemporal) => date.toTemporalInstant()
  : TemporalImpl.dateToTemporalInstant
