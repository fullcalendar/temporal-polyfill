import { TimeBag, TimeFields } from '../internal/calendarFields'
import { ensureString, toInteger } from '../internal/cast'
import { mergePlainTimeBag, refinePlainTimeBag } from '../internal/convert'
import { diffPlainTimes } from '../internal/diff'
import { negateDurationInternals } from '../internal/durationFields'
import { PlainTimeBag } from '../internal/genericBag'
import { IsoTimeFields, constrainIsoTimeFields, isoTimeFieldNamesAlpha } from '../internal/isoFields'
import { formatPlainTimeIso } from '../internal/isoFormat'
import { checkIsoDateTimeInBounds, compareIsoTimeFields } from '../internal/isoMath'
import { parsePlainTime } from '../internal/isoParse'
import { moveTime } from '../internal/move'
import { DiffOptions, OverflowOptions, RoundingOptions, TimeDisplayOptions, refineTimeDisplayOptions } from '../internal/options'
import { Overflow } from '../internal/optionEnums'
import { roundPlainTime } from '../internal/round'
import { getSingleInstantFor } from '../internal/timeZoneMath'
import { TimeZoneGetOffsetNanosecondsForFunc, TimeZoneGetPossibleInstantsForFunc } from '../internal/timeZoneRecordTypes'
import { UnitName } from '../internal/units'
import { NumSign, pluckProps } from '../internal/utils'
import { DurationSlots, PlainDateSlots, PlainDateTimeSlots, PlainTimeSlots, ZonedDateTimeSlots } from './genericTypes'
import { DurationBranding, PlainDateTimeBranding, PlainTimeBranding, ZonedDateTimeBranding } from './branding'

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

export function add(
  slots: PlainTimeSlots,
  durationSlots: DurationSlots,
): PlainTimeSlots {
  return {
    ...moveTime(slots, durationSlots)[0],
    branding: PlainTimeBranding,
  }
}

export function subtract(
  slots: PlainTimeSlots,
  durationSlots: DurationSlots,
): PlainTimeSlots {
  return add(slots, negateDurationInternals(durationSlots) as unknown as DurationSlots) // !!!
}

export function until(
  plainTimeSlots0: PlainTimeSlots,
  plainTimeSlots1: PlainTimeSlots,
  options?: DiffOptions,
  invert?: boolean, // TODO: start using invertRoundingMode
): DurationSlots {
  return {
    ...diffPlainTimes(plainTimeSlots0, plainTimeSlots1, options, invert),
    branding: DurationBranding,
  }
}

export function since(
  plainTimeSlots0: PlainTimeSlots,
  plainTimeSlots1: PlainTimeSlots,
  options?: DiffOptions,
): DurationSlots {
  return until(plainTimeSlots1, plainTimeSlots0, options, true)
}

export function round(
  slots: PlainTimeSlots,
  options: RoundingOptions | UnitName,
): PlainTimeSlots {
  return {
    ...roundPlainTime(slots, options),
    branding: PlainTimeBranding,
  }
}

export function compare(
  plainTimeSlots0: PlainTimeSlots,
  plainTimeSlots1: PlainTimeSlots,
): NumSign {
  return compareIsoTimeFields(plainTimeSlots0, plainTimeSlots1) // just forwards
}

export function equals(
  plainTimeSlots0: PlainTimeSlots,
  plainTimeSlots1: PlainTimeSlots,
): boolean {
  return !compare(plainTimeSlots0, plainTimeSlots1)
}

export function toString(
  slots: PlainTimeSlots,
  options?: TimeDisplayOptions
): string {
  return formatPlainTimeIso(slots, ...refineTimeDisplayOptions(options))
}

export function toJSON(slots: PlainTimeSlots): string {
  return toString(slots)
}

export function toZonedDateTime<C, T>(
  getTimeZoneRecord: (timeZoneSlot: T) => {
    getOffsetNanosecondsFor: TimeZoneGetOffsetNanosecondsForFunc,
    getPossibleInstantsFor: TimeZoneGetPossibleInstantsForFunc,
  },
  slots: PlainTimeSlots,
  timeZoneSlot: T,
  plainDateSlots: PlainDateSlots<C>,
): ZonedDateTimeSlots<C, T> {
  return {
    epochNanoseconds: getSingleInstantFor(
      getTimeZoneRecord(timeZoneSlot),
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
