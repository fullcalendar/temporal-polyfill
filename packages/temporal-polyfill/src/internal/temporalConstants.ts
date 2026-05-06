import { milliInDay } from './units'

// These range constants are shared by epoch conversion, bounds checking, and
// Intl formatting. Keeping them here avoids making those modules depend on each
// other just to read Temporal's fixed supported range.

/*
NOTES on limits:

Date
  min = Date.UTC(-271821, 4 - 1, 20) // -8640000000000000
  max = Date.UTC(275760, 9 - 1, 13) // 8640000000000000
Instant
  min = Temporal.Instant.fromEpochMilliseconds(-8640000000000000)
  max = Temporal.Instant.fromEpochMilliseconds(8640000000000000)
ZonedDateTime
  min.toZonedDateTimeISO('<hypothetical-min-timezone>') // -271821-04-20 - 59:59.999999999
  max.toZonedDateTimeISO('<hypothetical-max-timezone>') // 275760-09-13 + 59:59.999999999
PlainDateTime
  min = new Temporal.PlainDateTime(-271821, 4, 19, 0, 0, 0, 0, 0, 1)
  max = new Temporal.PlainDateTime(275760, 9, 13, 23, 59, 59, 999, 999, 999)
PlainDate
  min = new Temporal.PlainDate(-271821, 4, 19)
  max = new Temporal.PlainDate(275760, 9, 13)
PlainYearMonth
  min = new Temporal.PlainYearMonth(-271821, 4)
  max = new Temporal.PlainYearMonth(275760, 9)
*/

export const epochNanoDayMax = 100000000
export const maxMilli = epochNanoDayMax * milliInDay
export const isoYearMax = 275760 // optimization. isoYear at epochNanoMax
export const isoYearMin = -271821 // optimization. isoYear at epochNanoMin
