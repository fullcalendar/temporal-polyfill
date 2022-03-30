import { checkEpochNanoBuggy } from '../calendarImpl/bugs'
import { isoFieldsToEpochNano, throwOutOfRange } from './isoMath'
import { DateISOEssentials, DateTimeISOEssentials } from './types-private'

/*
Extreme valid inputs
  Legacy Date
    Date.UTC(-271821, 4 - 1, 20,  0, 0, 0, 0)
    Date.UTC(275760, 9 - 1, 13,  0, 0, 0, 0)
  Instant
    Temporal.Instant.fromEpochMilliseconds(Date.UTC(-271821, 4 - 1, 20,  0, 0, 0, 0))
    Temporal.Instant.fromEpochMilliseconds(Date.UTC(275760, 9 - 1, 13,  0, 0, 0, 0))
  PlainDateTime
    new Temporal.PlainDateTime(-271821, 4, 19,  0, 0, 0, 0, 0, 1).toString()
    new Temporal.PlainDateTime(275760, 9, 13,  23, 59, 59, 999, 999, 999).toString()
  PlainDate
    new Temporal.PlainDate(-271821, 4, 19).toString()
    new Temporal.PlainDate(275760, 9, 13).toString()
  PlainYearMonth
    new Temporal.PlainYearMonth(-271821, 4).toString()
    new Temporal.PlainYearMonth(275760, 9).toString()
*/

export function validateYearMonth(isoFields: DateISOEssentials, calendarID: string): void {
  // might throw an error
  // moves between days in month
  const epochNano = isoFieldsToEpochNano(isoFields)

  checkEpochNanoBuggy(epochNano, calendarID)
}

export function validateDate(isoFields: DateISOEssentials, calendarID: string): void {
  const epochNano = isoFieldsToEpochNano(isoFields)

  validatePlain(
    // if potentially very negative, measure last nanosecond of day
    // to increase changes it's in-bounds
    epochNano + (epochNano < 0n ? 86399999999999n : 0n),
  )
  checkEpochNanoBuggy(epochNano, calendarID)
}

export function validateDateTime(isoFields: DateTimeISOEssentials, calendarID: string): void {
  const epochNano = isoFieldsToEpochNano(isoFields)

  validatePlain(epochNano)
  checkEpochNanoBuggy(epochNano, calendarID)
}

export function validateInstant(epochNano: bigint): void {
  if (
    epochNano < -8640000000000000000000n ||
    epochNano > 8640000000000000000000n
  ) {
    throwOutOfRange()
  }
}

export function validatePlain(epochNano: bigint): void {
  // like validateInstant's bounds, but expanded 24:59:59.999999999
  if (
    epochNano < -8640000086399999999999n ||
    epochNano > 8640000086399999999999n
  ) {
    throwOutOfRange()
  }
}
