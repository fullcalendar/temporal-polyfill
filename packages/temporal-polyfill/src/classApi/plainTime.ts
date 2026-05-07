import { compareTimeFields, plainTimesEqual } from '../internal/compare'
import { constructPlainTimeSlots } from '../internal/construct'
import { zonedDateTimeToPlainTime } from '../internal/convert'
import { refinePlainTimeObjectLike } from '../internal/createFromFields'
import { diffPlainTimes } from '../internal/diff'
import { TimeFields } from '../internal/fieldTypes'
import { LocalesArg } from '../internal/intlFormatUtils'
import { formatPlainTimeIso } from '../internal/isoFormat'
import { parsePlainTime } from '../internal/isoParse'
import { mergePlainTimeFields } from '../internal/merge'
import { movePlainTime } from '../internal/move'
import { refineOverflowOptions } from '../internal/optionsFieldRefine'
import {
  DiffOptions,
  OverflowOptions,
  RoundingOptions,
} from '../internal/optionsModel'
import { roundPlainTime } from '../internal/round'
import {
  BrandingSlots,
  PlainDateTimeBranding,
  PlainDateTimeSlots,
  PlainTimeBranding,
  PlainTimeSlots,
  ZonedDateTimeBranding,
  ZonedDateTimeSlots,
  createPlainTimeSlots,
} from '../internal/slots'
import { TimeUnitName } from '../internal/units'
import { NumberSign, isObjectLike } from '../internal/utils'
import {
  Duration,
  DurationArg,
  createDuration,
  toDurationSlots,
} from './duration'
import { prepPlainTimeFormat } from './intlFormatConfig'
import { timeGetters } from './mixins'
import { createSlotClass, getSlots, rejectInvalidBag } from './slotClass'

export type PlainTime = any & TimeFields
export type PlainTimeArg = PlainTime | Partial<TimeFields> | string

export const [PlainTime, createPlainTime] = createSlotClass(
  PlainTimeBranding,
  constructPlainTimeSlots,
  formatPlainTimeIso,
  timeGetters,
  {
    with(
      _slots: PlainTimeSlots,
      mod: Partial<TimeFields>,
      options?: OverflowOptions,
    ): PlainTime {
      return createPlainTime(
        mergePlainTimeFields(this, rejectInvalidBag(mod), options),
      )
    },
    add(slots: PlainTimeSlots, durationArg: DurationArg): PlainTime {
      return createPlainTime(
        movePlainTime(false, slots, toDurationSlots(durationArg)),
      )
    },
    subtract(slots: PlainTimeSlots, durationArg: DurationArg): PlainTime {
      return createPlainTime(
        movePlainTime(true, slots, toDurationSlots(durationArg)),
      )
    },
    until(
      slots: PlainTimeSlots,
      otherArg: PlainTimeArg,
      options?: DiffOptions<TimeUnitName>,
    ): Duration {
      return createDuration(
        diffPlainTimes(false, slots, toPlainTimeSlots(otherArg), options),
      )
    },
    since(
      slots: PlainTimeSlots,
      otherArg: PlainTimeArg,
      options?: DiffOptions<TimeUnitName>,
    ): Duration {
      return createDuration(
        diffPlainTimes(true, slots, toPlainTimeSlots(otherArg), options),
      )
    },
    round(
      slots: PlainTimeSlots,
      options: TimeUnitName | RoundingOptions<TimeUnitName>,
    ): PlainTime {
      return createPlainTime(roundPlainTime(slots, options))
    },
    equals(slots: PlainTimeSlots, other: PlainTimeArg): boolean {
      return plainTimesEqual(slots, toPlainTimeSlots(other))
    },
    toLocaleString(
      slots: PlainTimeSlots,
      locales?: LocalesArg,
      options?: Intl.DateTimeFormatOptions,
    ): string {
      const [format, epochMilli] = prepPlainTimeFormat(locales, options, slots)
      return format.format(epochMilli)
    },
  },
  {
    from(arg: PlainTimeArg, options?: OverflowOptions): PlainTime {
      return createPlainTime(toPlainTimeSlots(arg, options))
    },
    compare(arg0: PlainTimeArg, arg1: PlainTimeArg): NumberSign {
      return compareTimeFields(toPlainTimeSlots(arg0), toPlainTimeSlots(arg1))
    },
  },
)

// Utils
// -----------------------------------------------------------------------------

export function toPlainTimeSlots(
  arg: PlainTimeArg,
  options?: OverflowOptions,
): PlainTimeSlots {
  if (isObjectLike(arg)) {
    const slots = (getSlots(arg) || {}) as Partial<BrandingSlots>

    switch (slots.branding) {
      case PlainTimeBranding:
        refineOverflowOptions(options) // parse unused options
        return slots as PlainTimeSlots

      case PlainDateTimeBranding:
        refineOverflowOptions(options) // parse unused options
        return createPlainTimeSlots(slots as PlainDateTimeSlots)

      case ZonedDateTimeBranding:
        refineOverflowOptions(options) // parse unused options
        return zonedDateTimeToPlainTime(slots as ZonedDateTimeSlots)
    }

    return refinePlainTimeObjectLike(arg as Partial<TimeFields>, options)
  }

  const timeSlots = parsePlainTime(arg)

  // parse unused options, but AFTER time-string parsing
  refineOverflowOptions(options)

  return timeSlots
}

export function optionalToPlainTimeFields(
  timeArg: PlainTimeArg | undefined,
): TimeFields | undefined {
  return timeArg === undefined ? undefined : toPlainTimeSlots(timeArg)
}
