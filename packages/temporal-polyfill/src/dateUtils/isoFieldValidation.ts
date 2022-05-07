import { checkEpochNanoBuggy } from '../calendarImpl/bugs'
import { isoFieldsToEpochNano, throwOutOfRange } from './epoch'
import { ISODateFields, ISODateTimeFields } from './isoFields'
import { nanoInDay, nanoInDayBI } from './units'

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

const zeroBI = BigInt(0)
const almostDayBI = BigInt(nanoInDay - 1) // one nanosecond shy of day
const maxInstantBI = nanoInDayBI * BigInt(100000000) // 100,000,000 days
const minInstantBI = -maxInstantBI
const maxPlainBI = maxInstantBI + almostDayBI
const minPlainBI = minInstantBI - almostDayBI

export function validateYearMonth(isoFields: ISODateFields, calendarID: string): void {
  // might throw an error
  // moves between days in month
  const epochNano = isoFieldsToEpochNano(isoFields)

  checkEpochNanoBuggy(epochNano, calendarID)
}

export function validateDate(isoFields: ISODateFields, calendarID: string): void {
  const epochNano = isoFieldsToEpochNano(isoFields)

  validatePlain(
    // if potentially very negative, measure last nanosecond of day
    // to increase chances it's in-bounds
    epochNano + (epochNano < zeroBI ? almostDayBI : zeroBI),
  )
  checkEpochNanoBuggy(epochNano, calendarID)
}

export function validateDateTime(isoFields: ISODateTimeFields, calendarID: string): void {
  const epochNano = isoFieldsToEpochNano(isoFields)

  validatePlain(epochNano)
  checkEpochNanoBuggy(epochNano, calendarID)
}

export function validateInstant(epochNano: bigint): void {
  if (
    epochNano < minInstantBI ||
    epochNano > maxInstantBI
  ) {
    throwOutOfRange()
  }
}

export function validatePlain(epochNano: bigint): void {
  // like validateInstant's bounds, but expanded 24:59:59.999999999
  if (
    epochNano < minPlainBI ||
    epochNano > maxPlainBI
  ) {
    throwOutOfRange()
  }
}
