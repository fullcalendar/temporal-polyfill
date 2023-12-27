import { TimeBag, TimeFields } from '../internal/calendarFields'
import { ensureString, toInteger } from '../internal/cast'
import { diffPlainTimes } from '../internal/diff'
import { IsoTimeFields, constrainIsoTimeFields, isoTimeFieldNamesAlpha } from '../internal/calendarIsoFields'
import { formatPlainTimeIso } from '../internal/formatIso'
import { compareIsoTimeFields } from '../internal/epochAndTime'
import { parsePlainTime } from '../internal/parseIso'
import { movePlainTime } from '../internal/move'
import { Overflow } from '../internal/options'
import { roundPlainTime } from '../internal/round'
import { pluckProps } from '../internal/utils'
import { DiffOptions, OverflowOptions } from '../internal/optionsRefine'
import { DurationSlots, PlainTimeBranding, PlainTimeSlots } from '../internal/slots'
import { DurationFields } from '../internal/durationFields'
import { negateDuration } from '../internal/durationMath'
import { PlainTimeBag, mergePlainTimeBag, plainTimeWithFields, refinePlainTimeBag } from '../internal/bag'
import { plainTimesEqual } from '../internal/compare'
import { plainTimeToPlainDateTime, plainTimeToZonedDateTime } from '../internal/convert'
import { createPlainTimeSlots } from '../internal/slotsCreate'

export const create = createPlainTimeSlots

export const fromFields = refinePlainTimeBag

export const fromString = parsePlainTime

export function getISOFields(slots: PlainTimeSlots): IsoTimeFields {
  return pluckProps(isoTimeFieldNamesAlpha, slots)
}

export const withFields = plainTimeWithFields

export const add = movePlainTime

export function subtract(
  slots: PlainTimeSlots,
  durationSlots: DurationFields,
): PlainTimeSlots {
  return add(slots, negateDuration(durationSlots))
}

export function until(
  plainTimeSlots0: PlainTimeSlots,
  plainTimeSlots1: PlainTimeSlots,
  options?: DiffOptions,
): DurationSlots {
  return diffPlainTimes(plainTimeSlots0, plainTimeSlots1, options)
}

export function since(
  plainTimeSlots0: PlainTimeSlots,
  plainTimeSlots1: PlainTimeSlots,
  options?: DiffOptions,
): DurationFields {
  return diffPlainTimes(plainTimeSlots0, plainTimeSlots1, options, true)
}

export const round = roundPlainTime

export const compare = compareIsoTimeFields

export const equals = plainTimesEqual

export const toString = formatPlainTimeIso

export function toJSON(slots: PlainTimeSlots): string {
  return toString(slots)
}

export const toZonedDateTime = plainTimeToZonedDateTime

export const toPlainDateTime = plainTimeToPlainDateTime
