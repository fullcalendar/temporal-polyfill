import { TimeBag } from '../internal/calendarFields'
import { diffPlainTimes } from '../internal/diff'
import { DurationFieldsWithSign, negateDurationInternals } from '../internal/durationFields'
import { IsoTimeFields, pluckIsoTimeFields, refineIsoTimeFields } from '../internal/isoFields'
import { formatPlainTimeIso } from '../internal/isoFormat'
import { LocalesArg, formatTimeLocaleString } from '../internal/intlFormat'
import { checkIsoDateTimeInBounds, compareIsoTimeFields } from '../internal/isoMath'
import { parsePlainTime } from '../internal/isoParse'
import { moveTime } from '../internal/move'
import {
  DiffOptions,
  OverflowOptions,
  RoundingOptions,
  TimeDisplayOptions,
  refineOverflowOptions,
} from '../internal/options'
import { roundPlainTime } from '../internal/round'
import { UnitName } from '../internal/units'
import { NumSign, defineGetters, defineProps, defineStringTag, isObjectlike } from '../internal/utils'
import { ensureString } from '../internal/cast'
import { timeZoneImplGetOffsetNanosecondsFor, timeZoneImplGetPossibleInstantsFor } from '../internal/timeZoneRecordSimple'
import { mergePlainTimeBag, refinePlainTimeBag } from '../internal/convert'
import { getSingleInstantFor } from '../internal/timeZoneMath'
import { PlainTimeBag } from '../internal/genericBag'

// public
import { PlainDateTimeSlots, PlainTimeSlots, ZonedDateTimeSlots, createViaSlots, getSlots, getSpecificSlots, rejectInvalidBag, setSlots } from './slots'
import { DurationBranding, PlainDateTimeBranding, PlainTimeBranding, ZonedDateTimeBranding } from '../genericApi/branding'
import { zonedInternalsToIso } from './zonedInternalsToIso'
import { PlainDateArg, toPlainDateSlots } from './plainDate'
import { PlainDateTime, createPlainDateTime } from './plainDateTime'
import { TimeZoneArg } from './timeZone'
import { ZonedDateTime, createZonedDateTime } from './zonedDateTime'
import { Duration, DurationArg, createDuration, toDurationSlots } from './duration'
import { createTimeGetterMethods, neverValueOf } from './publicMixins'
import { refineTimeZoneSlot } from './timeZoneSlot'
import { createTimeZoneSlotRecord, timeZoneProtocolGetOffsetNanosecondsFor, timeZoneProtocolGetPossibleInstantsFor } from './timeZoneRecordComplex'

export type PlainTimeArg = PlainTime | PlainTimeBag | string

export class PlainTime {
  constructor(
    isoHour: number = 0,
    isoMinute: number = 0,
    isoSecond: number = 0,
    isoMillisecond: number = 0,
    isoMicrosecond: number = 0,
    isoNanosecond: number = 0,
  ) {
    setSlots(this, {
      branding: PlainTimeBranding,
      ...refineIsoTimeFields({
        isoHour,
        isoMinute,
        isoSecond,
        isoMillisecond,
        isoMicrosecond,
        isoNanosecond,
      })
    })
  }

  with(mod: TimeBag, options?: OverflowOptions): PlainTime {
    getPlainTimeSlots(this) // validate `this`
    return createPlainTime({
      ...mergePlainTimeBag(this, rejectInvalidBag(mod), options), // it's crazy we don't do prepareOptions
      branding: PlainTimeBranding,
    })
  }

  add(durationArg: DurationArg): PlainTime {
    return movePlainTime(getPlainTimeSlots(this), toDurationSlots(durationArg))
  }

  subtract(durationArg: DurationArg): PlainTime {
    return movePlainTime(getPlainTimeSlots(this), negateDurationInternals(toDurationSlots(durationArg)))
  }

  until(otherArg: PlainTimeArg, options?: DiffOptions): Duration {
    return createDuration({
      branding: DurationBranding,
      ...diffPlainTimes(getPlainTimeSlots(this), toPlainTimeSlots(otherArg), options)
    })
  }

  since(otherArg: PlainTimeArg, options?: DiffOptions): Duration {
    return createDuration({
      branding: DurationBranding,
      ...diffPlainTimes(getPlainTimeSlots(this), toPlainTimeSlots(otherArg), options, true)
    })
  }

  round(options: RoundingOptions | UnitName): PlainTime {
    return createPlainTime({
      ...roundPlainTime(getPlainTimeSlots(this), options),
      branding: PlainTimeBranding,
    })
  }

  equals(other: PlainTimeArg): boolean {
    return !compareIsoTimeFields(getPlainTimeSlots(this), toPlainTimeSlots(other))
  }

  toString(options?: TimeDisplayOptions): string {
    return formatPlainTimeIso(getPlainTimeSlots(this), options)
  }

  toJSON(): string {
    return formatPlainTimeIso(getPlainTimeSlots(this))
  }

  toLocaleString(locales?: LocalesArg, options?: Intl.DateTimeFormatOptions) {
    const slots = getPlainTimeSlots(this)
    return formatTimeLocaleString(slots, locales, options)
  }

  toZonedDateTime(options: { timeZone: TimeZoneArg, plainDate: PlainDateArg }): ZonedDateTime {
    const slots = getPlainTimeSlots(this)
    const plainDateSlots = toPlainDateSlots(options.plainDate)
    const timeZoneSlot = refineTimeZoneSlot(options.timeZone)

    const timeZoneRecord = createTimeZoneSlotRecord(timeZoneSlot, {
      getOffsetNanosecondsFor: timeZoneImplGetOffsetNanosecondsFor,
      getPossibleInstantsFor: timeZoneImplGetPossibleInstantsFor,
    }, {
      getOffsetNanosecondsFor: timeZoneProtocolGetOffsetNanosecondsFor,
      getPossibleInstantsFor: timeZoneProtocolGetPossibleInstantsFor,
    })

    return createZonedDateTime({
      epochNanoseconds: getSingleInstantFor(timeZoneRecord, { ...plainDateSlots, ...slots }),
      calendar: plainDateSlots.calendar,
      timeZone: timeZoneSlot,
      branding: ZonedDateTimeBranding,
    })
  }

  toPlainDateTime(plainDateArg: PlainDateArg): PlainDateTime {
    return createPlainDateTime({
      ...checkIsoDateTimeInBounds({
        ...getPlainTimeSlots(this),
        ...toPlainDateSlots(plainDateArg),
      }),
      branding: PlainDateTimeBranding,
    })
  }

  getISOFields(): IsoTimeFields {
    return pluckIsoTimeFields(getPlainTimeSlots(this))
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
    const slots = getSlots(arg)
    if (slots) {
      switch(slots.branding) {
        case PlainTimeBranding:
          refineOverflowOptions(options) // parse unused options
          return slots as PlainTimeSlots
        case PlainDateTimeBranding:
          refineOverflowOptions(options) // parse unused options
          return { ...pluckIsoTimeFields(slots as PlainDateTimeSlots), branding: PlainTimeBranding }
        case ZonedDateTimeBranding:
          refineOverflowOptions(options) // parse unused options
          return { ...pluckIsoTimeFields(zonedInternalsToIso(slots as ZonedDateTimeSlots)), branding: PlainTimeBranding }
      }
    }
    return { ...refinePlainTimeBag(arg as PlainTimeBag, options), branding: PlainTimeBranding }
  }
  refineOverflowOptions(options) // parse unused options
  return { ...parsePlainTime(ensureString(arg)), branding: PlainTimeBranding }
}

function movePlainTime(internals: IsoTimeFields, durationInternals: DurationFieldsWithSign): PlainTime {
  return createPlainTime({
    ...moveTime(internals, durationInternals)[0],
    branding: PlainTimeBranding,
  })
}
