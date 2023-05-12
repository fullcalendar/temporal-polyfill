import { queryCalendarOps } from './calendarOps'
import { toIntegerThrowOnInfinity, toIntegerWithoutRounding, toPositiveInteger } from './cast'
import { pluckProps } from './obj'

export const isoDateSlotRefiners = {
  // sorted alphabetically
  calendar: queryCalendarOps, // prolly kill this!!!
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
export const isoDateFieldNames = isoDateSlotNames.slice(1)
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

export function generatePublicIsoDateFields(internals) {
  const publicFields = pluckIsoDateSlots(internals)
  publicFields.calendar = publicFields.calendar.id // correct?
  return publicFields
}

export function generatePublicIsoDateTimeFields(internals) {
  const publicFields = pluckIsoDateTimeSlots(internals)
  publicFields.calendar = publicFields.calendar.id // correct?
  return publicFields
}

export function pluckIsoDateTimeSlots(isoFields) {
  return pluckProps(isoFields, isoDateTimeSlotNames)
}

export function pluckIsoDateSlots(isoFields) {
  return pluckProps(isoFields, isoDateSlotNames)
}

export function pluckIsoDateFields(isoFields) {
  return pluckProps(isoFields, isoDateFieldNames)
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

export function constrainIsoDateTimeFields(isoDateTimeFields, overflow = 'reject') {
  // ahhhh! calendar gets passed in here!!!
}

export function constrainIsoDateFields(isoDateFields, overflow = 'reject') {
  // ahhhh! calendar gets passed in here!!!
}

export function constrainIsoTimeFields(isoTimeFields, overflow = 'reject') {
}

export function addDaysToIsoFields() {

}

export function isValidIsoFields() {

}
