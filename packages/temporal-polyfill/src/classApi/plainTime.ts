import { TimeBag, TimeFields } from '../internal/calendarFields'
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
import { NumSign, isObjectlike } from '../internal/utils'
import { BrandingSlots, PlainDateTimeBranding, PlainDateTimeSlots, PlainTimeBranding, PlainTimeSlots, ZonedDateTimeBranding, ZonedDateTimeSlots, createPlainTimeSlots, removeBranding } from '../internal/slots'
import { createSlotClass, createViaSlots, getSlots, getSpecificSlots, rejectInvalidBag, setSlots } from './slotsForClasses'
import { PlainDateArg, toPlainDateSlots } from './plainDate'
import { PlainDateTime, createPlainDateTime } from './plainDateTime'
import { TimeZoneArg } from './timeZone'
import { ZonedDateTime, createZonedDateTime } from './zonedDateTime'
import { Duration, DurationArg, createDuration, toDurationSlots } from './duration'
import { neverValueOf, timeGetters } from './mixins'
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

export type PlainTime = any & TimeFields
export type PlainTimeArg = PlainTime | PlainTimeBag | string

export const PlainTime = createSlotClass(
  PlainTimeBranding,
  constructPlainTimeSlots,
  timeGetters,
  {
    with(slots: PlainTimeSlots, mod: TimeBag, options?: OverflowOptions): PlainTime {
      return createPlainTime(
        plainTimeWithFields(this, rejectInvalidBag(mod), options)
      )
    },
    add(slots: PlainTimeSlots, durationArg: DurationArg): PlainTime {
      return createPlainTime(
        movePlainTime(false, slots, toDurationSlots(durationArg))
      )
    },
    subtract(slots: PlainTimeSlots,  durationArg: DurationArg): PlainTime {
      return createPlainTime(
        movePlainTime(true, slots, toDurationSlots(durationArg))
      )
    },
    until(slots: PlainTimeSlots,  otherArg: PlainTimeArg, options?: DiffOptions): Duration {
      return createDuration(
        diffPlainTimes(slots, toPlainTimeSlots(otherArg), options)
      )
    },
    since(slots: PlainTimeSlots, otherArg: PlainTimeArg, options?: DiffOptions): Duration {
      return createDuration(
        diffPlainTimes(slots, toPlainTimeSlots(otherArg), options, true)
      )
    },
    round(slots: PlainTimeSlots, options: RoundingOptions | UnitName): PlainTime {
      return createPlainTime(
        roundPlainTime(slots, options)
      )
    },
    equals(slots: PlainTimeSlots, other: PlainTimeArg): boolean {
      return plainTimesEqual(slots, toPlainTimeSlots(other))
    },
    toString(slots: PlainTimeSlots, options?: TimeDisplayOptions): string {
      return formatPlainTimeIso(slots, options)
    },
    toJSON(slots: PlainTimeSlots): string {
      return formatPlainTimeIso(slots)
    },
    toLocaleString(slots: PlainTimeSlots, locales?: LocalesArg, options?: Intl.DateTimeFormatOptions): string {
      const [format, epochMilli] = prepPlainTimeFormat(locales, options, slots)
      return format.format(epochMilli)
    },
    toZonedDateTime(slots: PlainTimeSlots, options: { timeZone: TimeZoneArg, plainDate: PlainDateArg }): ZonedDateTime {
      return createZonedDateTime(
        plainTimeToZonedDateTime(refineTimeZoneSlot, toPlainDateSlots, createTimeZoneOps, slots, options)
      )
    },
    toPlainDateTime(slots: PlainTimeSlots, plainDateArg: PlainDateArg): PlainDateTime {
      return createPlainDateTime(
        plainTimeToPlainDateTime(slots, toPlainDateSlots(plainDateArg))
      )
    },
    getISOFields: removeBranding,
    valueOf: neverValueOf,
  },
  {
    from(arg: PlainTimeArg, options?: OverflowOptions): PlainTime {
      return createPlainTime(
        toPlainTimeSlots(arg, options)
      )
    },
    compare(arg0: PlainTimeArg, arg1: PlainTimeArg): NumSign {
      return compareIsoTimeFields(
        toPlainTimeSlots(arg0),
        toPlainTimeSlots(arg1),
      )
    }
  }
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
    const slots = (getSlots(arg) || {}) as Partial<BrandingSlots>

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
