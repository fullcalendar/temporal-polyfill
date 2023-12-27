import { TimeBag, TimeFields } from '../internal/calendarFields'
import { ensureString, toInteger } from '../internal/cast'
import { diffPlainTimes } from '../internal/diff'
import { IsoTimeFields, constrainIsoTimeFields, isoTimeFieldNamesAlpha } from '../internal/calendarIsoFields'
import { formatPlainTimeIso } from '../internal/formatIso'
import { checkIsoDateTimeInBounds, compareIsoTimeFields } from '../internal/epochAndTime'
import { parsePlainTime } from '../internal/parseIso'
import { movePlainTime, moveTime } from '../internal/move'
import { Overflow } from '../internal/options'
import { roundPlainTime } from '../internal/round'
import { TimeZoneOps, getSingleInstantFor } from '../internal/timeZoneOps'
import { pluckProps } from '../internal/utils'
import { DiffOptions, OverflowOptions } from '../internal/optionsRefine'
import { DurationSlots, PlainDateSlots, PlainDateTimeBranding, PlainDateTimeSlots, PlainTimeBranding, PlainTimeSlots, ZonedDateTimeBranding, ZonedDateTimeSlots } from '../internal/slots'
import { DurationFields } from '../internal/durationFields'
import { negateDuration } from '../internal/durationMath'
import { PlainTimeBag, mergePlainTimeBag, refinePlainTimeBag } from '../internal/bag'
import { plainTimesEqual } from '../internal/compare'

export function create(
  isoHour: number = 0,
  isoMinute: number = 0,
  isoSecond: number = 0,
  isoMillisecond: number = 0,
  isoMicrosecond: number = 0,
  isoNanosecond: number = 0,
): PlainTimeSlots {
  return {
    ...constrainIsoTimeFields(
      {
        isoHour: toInteger(isoHour),
        isoMinute: toInteger(isoMinute),
        isoSecond: toInteger(isoSecond),
        isoMillisecond: toInteger(isoMillisecond),
        isoMicrosecond: toInteger(isoMicrosecond),
        isoNanosecond: toInteger(isoNanosecond),
      },
      Overflow.Reject,
    ),
    branding: PlainTimeBranding,
  }
}

export function fromFields(
  fields: PlainTimeBag,
  options?: OverflowOptions,
) {
  return {
    ...refinePlainTimeBag(fields, options),
    branding: PlainTimeBranding,
  }
}

export function fromString(s: string): PlainTimeSlots {
  return {
    ...parsePlainTime(ensureString(s)),
    branding: PlainTimeBranding,
  }
}

export function getISOFields(slots: PlainTimeSlots): IsoTimeFields {
  return pluckProps(isoTimeFieldNamesAlpha, slots)
}

export function withFields(
  initialFields: TimeFields, // NOTE: does not accept PlainTimeFields!
  mod: TimeBag,
  options?: OverflowOptions,
): PlainTimeSlots {
  return {
    ...mergePlainTimeBag(initialFields, mod, options),
    branding: PlainTimeBranding,
  }
}

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

export function toZonedDateTime<C, TA, T, PA>(
  refineTimeZoneArg: (timeZoneArg: TA) => T,
  refinePlainDateArg: (plainDateArg: PA) => PlainDateSlots<C>,
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  slots: PlainTimeSlots,
  options: { timeZone: TA, plainDate: PA },
): ZonedDateTimeSlots<C, T> {
  const plainDateSlots = refinePlainDateArg(options.plainDate)
  const timeZoneSlot = refineTimeZoneArg(options.timeZone)
  const timeZoneOps = getTimeZoneOps(timeZoneSlot)

  return {
    epochNanoseconds: getSingleInstantFor(
      timeZoneOps,
      { ...plainDateSlots, ...slots },
    ),
    calendar: plainDateSlots.calendar,
    timeZone: timeZoneSlot,
    branding: ZonedDateTimeBranding,
  }
}

export function toPlainDateTime<C>(
  plainTimeSlots0: PlainTimeSlots,
  plainDateSlots1: PlainDateSlots<C>,
): PlainDateTimeSlots<C> {
  return {
    ...checkIsoDateTimeInBounds({
      ...plainTimeSlots0,
      ...plainDateSlots1,
    }),
    branding: PlainDateTimeBranding,
  }
}
