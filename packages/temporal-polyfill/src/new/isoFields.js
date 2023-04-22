import { toCalendarSlot } from './calendarAdapter'
import { toIntegerThrowOnInfinity, toIntegerWithoutRounding, toPositiveInteger } from './cast'
import { pluckProps } from './obj'

export const isoDateSlotRefiners = {
  // sorted alphabetically
  calendar: toCalendarSlot,
  isoDay: toPositiveInteger,
  isoMonth: toPositiveInteger,
  isoYear: toIntegerWithoutRounding,
}

export const isoTimeFieldRefiners = {
  // sorted alphabetically
  isoHour: toIntegerThrowOnInfinity,
  isoMicrosecond: toIntegerThrowOnInfinity,
  isoMillisecond: toIntegerThrowOnInfinity,
  isoMinute: toIntegerThrowOnInfinity,
  isoNanosecond: toPositiveInteger, // why different?
  isoSecond: toPositiveInteger, // why different?
}

export const isoDateTimeSlotRefiners = {
  // keys must be resorted
  ...isoDateSlotRefiners,
  ...isoTimeFieldRefiners,
}

export const isoDateSlotNames = Object.keys(isoDateSlotRefiners)
export const isoTimeFieldNames = Object.keys(isoTimeFieldRefiners) // no calendar
export const isoDateTimeSlotNames = Object.keys(isoDateTimeSlotRefiners).sort()

export const isoTimeFieldDefaults = {
  isoHour: 0,
  isoMicrosecond: 0,
  isoMillisecond: 0,
  isoMinute: 0,
  isoNanosecond: 0,
  isoSecond: 0,
}

export function pluckIsoDateTimeSlots(isoFields) {
  return pluckProps(isoFields, isoDateTimeSlotNames)
}

export function pluckIsoDateSlots(isoFields) {
  return pluckProps(isoFields, isoDateSlotNames)
}

export function pluckIsoTimeFields(isoFields) {
  return pluckProps(isoFields, isoTimeFieldNames)
}

export function compareIsoFields() {
  // uses Date.UTC
}

export function compareIsoTimeFields() {
  // uses conversion to milliseconds
}

// TODO: make distinction between "regulate" (which considers overflow) and "reject" (throws error)

export function regulateIsoDateTimeFields() {

}

export function regulateIsoDateFields() {

}

export function regulateIsoTimeFields() {

}

export function addDaysToIsoFields() {

}

export function isValidIsoFields() {

}
