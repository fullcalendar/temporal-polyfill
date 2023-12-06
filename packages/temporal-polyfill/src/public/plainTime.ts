import { TimeBag } from '../internal/calendarFields'
import { IsoTimeFields, isoTimeFieldNamesDesc } from '../internal/isoFields'
import { LocalesArg, prepPlainTimeFormat } from '../internal/intlFormat'
import {
  DiffOptions,
  OverflowOptions,
  RoundingOptions,
  TimeDisplayOptions,
  refineOverflowOptions,
} from '../genericApi/options'
import { UnitName } from '../internal/units'
import { NumSign, defineGetters, defineProps, defineStringTag, isObjectlike, pluckProps } from '../internal/utils'
import { zonedInternalsToIso } from '../internal/timeZoneMath'
import { PlainTimeBag } from '../genericApi/genericBag'
import { DurationBranding, PlainDateTimeBranding, PlainTimeBranding, ZonedDateTimeBranding } from '../genericApi/branding'
import { PlainDateTimeSlots, PlainTimeSlots, ZonedDateTimeSlots } from '../genericApi/genericTypes'
import * as PlainTimeFuncs from '../genericApi/plainTime'

// public
import { createViaSlots, getSlots, getSpecificSlots, rejectInvalidBag, setSlots } from './slots'
import { PlainDateArg, toPlainDateSlots } from './plainDate'
import { PlainDateTime, createPlainDateTime } from './plainDateTime'
import { TimeZoneArg } from './timeZone'
import { ZonedDateTime, createZonedDateTime } from './zonedDateTime'
import { Duration, DurationArg, createDuration, toDurationSlots } from './duration'
import { createTimeGetterMethods, neverValueOf } from './publicMixins'
import { TimeZoneSlot, refineTimeZoneSlot } from './timeZoneSlot'
import { createSimpleTimeZoneRecord, createTypicalTimeZoneRecord } from './recordCreators'
import { CalendarSlot } from './calendarSlot'

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
      PlainTimeFuncs.create(isoHour, isoMinute, isoSecond, isoMillisecond, isoMicrosecond, isoNanosecond),
    )
  }

  with(mod: TimeBag, options?: OverflowOptions): PlainTime {
    getPlainTimeSlots(this) // validate this
    return createPlainTime(
      // it's crazy we don't do prepareOptions
      PlainTimeFuncs.withFields(this as any, rejectInvalidBag(mod), options) // any!!!
    )
  }

  add(durationArg: DurationArg): PlainTime {
    return createPlainTime(
      PlainTimeFuncs.add(getPlainTimeSlots(this), toDurationSlots(durationArg))
    )
  }

  subtract(durationArg: DurationArg): PlainTime {
    return createPlainTime(
      PlainTimeFuncs.subtract(getPlainTimeSlots(this), toDurationSlots(durationArg))
    )
  }

  until(otherArg: PlainTimeArg, options?: DiffOptions): Duration {
    return createDuration(
      PlainTimeFuncs.until(getPlainTimeSlots(this), toPlainTimeSlots(otherArg), options)
    )
  }

  since(otherArg: PlainTimeArg, options?: DiffOptions): Duration {
    return createDuration({
      branding: DurationBranding, // weird
      ...PlainTimeFuncs.since(getPlainTimeSlots(this), toPlainTimeSlots(otherArg), options)
    })
  }

  round(options: RoundingOptions | UnitName): PlainTime {
    return createPlainTime(
      PlainTimeFuncs.round(getPlainTimeSlots(this), options)
    )
  }

  equals(other: PlainTimeArg): boolean {
    return PlainTimeFuncs.equals(getPlainTimeSlots(this), toPlainTimeSlots(other))
  }

  toString(options?: TimeDisplayOptions): string {
    return PlainTimeFuncs.toString(getPlainTimeSlots(this), options)
  }

  toJSON(): string {
    return PlainTimeFuncs.toJSON(getPlainTimeSlots(this))
  }

  toLocaleString(locales?: LocalesArg, options?: Intl.DateTimeFormatOptions): string {
    const [format, epochMilli] = prepPlainTimeFormat(locales, options, getPlainTimeSlots(this))
    return format.format(epochMilli)
  }

  // TODO: ensure options isn't undefined before accessing
  toZonedDateTime(options: { timeZone: TimeZoneArg, plainDate: PlainDateArg }): ZonedDateTime {
    return createZonedDateTime(
      PlainTimeFuncs.toZonedDateTime(
        createTypicalTimeZoneRecord,
        getPlainTimeSlots(this),
        refineTimeZoneSlot(options.timeZone),
        toPlainDateSlots(options.plainDate),
      )
    )
  }

  toPlainDateTime(plainDateArg: PlainDateArg): PlainDateTime {
    return createPlainDateTime(
      PlainTimeFuncs.toPlainDateTime(getPlainTimeSlots(this), toPlainDateSlots(plainDateArg))
    )
  }

  getISOFields(): IsoTimeFields {
    return PlainTimeFuncs.getISOFields(getPlainTimeSlots(this))
  }

  static from(arg: PlainTimeArg, options?: OverflowOptions): PlainTime {
    return createPlainTime(toPlainTimeSlots(arg, options))
  }

  static compare(arg0: PlainTimeArg, arg1: PlainTimeArg): NumSign {
    return PlainTimeFuncs.compare(
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
        return {
          ...pluckProps(isoTimeFieldNamesDesc, slots as PlainDateTimeSlots<CalendarSlot>),
          branding: PlainTimeBranding,
        }

      case ZonedDateTimeBranding:
        refineOverflowOptions(options) // parse unused options
        return {
          ...pluckProps(
            isoTimeFieldNamesDesc,
            zonedInternalsToIso(
              slots as ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>,
              createSimpleTimeZoneRecord((slots as ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>).timeZone)
            ),
          ),
          branding: PlainTimeBranding,
        }
    }

    return PlainTimeFuncs.fromFields(arg as PlainTimeBag, options)
  }

  refineOverflowOptions(options) // parse unused options
  return PlainTimeFuncs.fromString(arg)
}
