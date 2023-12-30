import { TimeBag } from '../internal/calendarFields'
import { IsoTimeFields } from '../internal/calendarIsoFields'
import { LocalesArg } from '../internal/formatIntl'
import {
  DiffOptions,
  OverflowOptions,
  RoundingOptions,
  TimeDisplayOptions,
  refineOverflowOptions,
} from '../internal/optionsRefine'
import { UnitName } from '../internal/units'
import { NumSign, defineGetters, defineProps, defineStringTag, isObjectlike, pluckProps } from '../internal/utils'
import { zonedInternalsToIso } from '../internal/timeZoneOps'
import { PlainDateTimeBranding, PlainDateTimeSlots, PlainTimeBranding, PlainTimeSlots, ZonedDateTimeBranding, ZonedDateTimeSlots, createPlainTimeSlots, removeBranding } from '../internal/slots'
import { createViaSlots, getSlots, getSpecificSlots, rejectInvalidBag, setSlots } from './slotsForClasses'
import { PlainDateArg, toPlainDateSlots } from './plainDate'
import { PlainDateTime, createPlainDateTime } from './plainDateTime'
import { TimeZoneArg } from './timeZone'
import { ZonedDateTime, createZonedDateTime } from './zonedDateTime'
import { Duration, DurationArg, createDuration, toDurationSlots } from './duration'
import { createTimeGetterMethods, neverValueOf } from './mixins'
import { TimeZoneSlot, refineTimeZoneSlot } from './slotsForClasses'
import { CalendarSlot } from './slotsForClasses'
import { createSimpleTimeZoneOps, createTimeZoneOps } from './timeZoneOpsQuery'
import { PlainTimeBag, plainTimeWithFields, refinePlainTimeBag } from '../internal/bag'
import { constructPlainTimeSlots } from '../internal/construct'
import { movePlainTime } from '../internal/move'
import { diffPlainTimes } from '../internal/diff'
import { roundPlainTime } from '../internal/round'
import { plainTimesEqual, compareIsoTimeFields } from '../internal/compare'
import { formatPlainTimeIso } from '../internal/formatIso'
import { plainTimeToPlainDateTime, plainTimeToZonedDateTime, zonedDateTimeToPlainTime } from '../internal/convert'
import { parsePlainTime } from '../internal/parseIso'
import { prepPlainTimeFormat } from './dateTimeFormat'

export type PlainTimeArg = PlainTime | PlainTimeBag | string

export class PlainTime {
  constructor(
    isoHour?: number,
    isoMinute?: number,
    isoSecond?: number,
    isoMillisecond?: number,
    isoMicrosecond?: number,
    isoNanosecond?: number,
  ) {
    setSlots(
      this,
      constructPlainTimeSlots(isoHour, isoMinute, isoSecond, isoMillisecond, isoMicrosecond, isoNanosecond),
    )
  }

  with(mod: TimeBag, options?: OverflowOptions): PlainTime {
    getPlainTimeSlots(this) // validate this
    return createPlainTime(
      plainTimeWithFields(this as any, rejectInvalidBag(mod), options) // any!!!
    )
  }

  add(durationArg: DurationArg): PlainTime {
    return createPlainTime(
      movePlainTime(false, getPlainTimeSlots(this), toDurationSlots(durationArg))
    )
  }

  subtract(durationArg: DurationArg): PlainTime {
    return createPlainTime(
      movePlainTime(true, getPlainTimeSlots(this), toDurationSlots(durationArg))
    )
  }

  until(otherArg: PlainTimeArg, options?: DiffOptions): Duration {
    return createDuration(
      diffPlainTimes(getPlainTimeSlots(this), toPlainTimeSlots(otherArg), options)
    )
  }

  since(otherArg: PlainTimeArg, options?: DiffOptions): Duration {
    return createDuration(
      diffPlainTimes(getPlainTimeSlots(this), toPlainTimeSlots(otherArg), options, true)
    )
  }

  round(options: RoundingOptions | UnitName): PlainTime {
    return createPlainTime(
      roundPlainTime(getPlainTimeSlots(this), options)
    )
  }

  equals(other: PlainTimeArg): boolean {
    return plainTimesEqual(getPlainTimeSlots(this), toPlainTimeSlots(other))
  }

  toString(options?: TimeDisplayOptions): string {
    return formatPlainTimeIso(getPlainTimeSlots(this), options)
  }

  toJSON(): string {
    return formatPlainTimeIso(getPlainTimeSlots(this))
  }

  toLocaleString(locales?: LocalesArg, options?: Intl.DateTimeFormatOptions): string {
    const [format, epochMilli] = prepPlainTimeFormat(locales, options, getPlainTimeSlots(this))
    return format.format(epochMilli)
  }

  toZonedDateTime(options: { timeZone: TimeZoneArg, plainDate: PlainDateArg }): ZonedDateTime {
    return createZonedDateTime(
      plainTimeToZonedDateTime(
        refineTimeZoneSlot,
        toPlainDateSlots,
        createTimeZoneOps,
        getPlainTimeSlots(this),
        options,
      )
    )
  }

  toPlainDateTime(plainDateArg: PlainDateArg): PlainDateTime {
    return createPlainDateTime(
      plainTimeToPlainDateTime(getPlainTimeSlots(this), toPlainDateSlots(plainDateArg))
    )
  }

  getISOFields(): IsoTimeFields {
    return removeBranding(getPlainTimeSlots(this))
  }

  static from(arg: PlainTimeArg, options?: OverflowOptions): PlainTime {
    return createPlainTime(toPlainTimeSlots(arg, options))
  }

  static compare(arg0: PlainTimeArg, arg1: PlainTimeArg): NumSign {
    return compareIsoTimeFields(
      toPlainTimeSlots(arg0),
      toPlainTimeSlots(arg1),
    )
  }
}

defineStringTag(PlainTime.prototype, PlainTimeBranding)

defineProps(PlainTime.prototype, {
  valueOf: neverValueOf,
})

defineGetters(
  PlainTime.prototype,
  createTimeGetterMethods(PlainTimeBranding),
)

// Utils
// -------------------------------------------------------------------------------------------------

export function createPlainTime(slots: PlainTimeSlots): PlainTime {
  return createViaSlots(PlainTime, slots)
}

export function getPlainTimeSlots(plainTime: PlainTime): PlainTimeSlots {
  return getSpecificSlots(PlainTimeBranding, plainTime) as PlainTimeSlots
}

export function toPlainTimeSlots(arg: PlainTimeArg, options?: OverflowOptions): PlainTimeSlots {
  if (isObjectlike(arg)) {
    const slots = (getSlots(arg) || {}) as { branding?: string }

    switch (slots.branding) {
      case PlainTimeBranding:
        refineOverflowOptions(options) // parse unused options
        return slots as PlainTimeSlots

      case PlainDateTimeBranding:
        refineOverflowOptions(options) // parse unused options
        return createPlainTimeSlots(slots as PlainDateTimeSlots<CalendarSlot>)

      case ZonedDateTimeBranding:
        refineOverflowOptions(options) // parse unused options
        return zonedDateTimeToPlainTime(
          createSimpleTimeZoneOps,
          slots as ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>,
        )
    }

    return refinePlainTimeBag(arg as PlainTimeBag, options)
  }

  refineOverflowOptions(options) // parse unused options
  return parsePlainTime(arg)
}
