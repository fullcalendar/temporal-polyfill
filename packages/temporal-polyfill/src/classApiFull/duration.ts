import {
  DurationBranding,
  PlainDateBranding,
  PlainDateTimeBranding,
  ZonedDateTimeBranding,
} from '../apiHelpers/branding'
import { durationFieldGetters } from '../apiHelpers/mixins'
import { createSlotClass, getBrandingAndSlots } from '../apiHelpers/slotClass'
import { compareDurations } from '../internal/compare'
import {
  refineDurationObjectLike,
  refineMaybeZonedDateTimeObjectLike,
} from '../internal/createFromFields'
import { DurationFields } from '../internal/durationFields'
import {
  absDuration,
  addDurations,
  negateDuration,
  roundDuration,
} from '../internal/durationMath'
import { InternalCalendar } from '../internal/externalCalendar'
import {
  CalendarDateFields,
  CalendarDateTimeFields,
  ZonedDateTimeLikeObject,
} from '../internal/fieldTypes'
import { LocalesArg } from '../internal/intlFormatUtils'
import { formatDurationIso } from '../internal/isoFormat'
import { parseDuration, parseRelativeToSlots } from '../internal/isoParse'
import { mergeDurationFields } from '../internal/merge'
import {
  DurationRoundingOptions,
  DurationTotalOptions,
  RelativeToOptions,
} from '../internal/optionsModel'
import { RelativeToSlots } from '../internal/relativeMath'
import { ZonedEpochNanoFields, createDateSlots } from '../internal/slots'
import { totalDuration } from '../internal/total'
import { UnitName } from '../internal/units'
import { NumberSign, isObjectLike } from '../internal/utils'
import { getCalendarFromBag, resolveFullCalendar } from './calendarArg'
import { constructDurationSlots } from './construct'
import { PlainDateArg } from './plainDate'
import { PlainDateTimeArg } from './plainDateTime'
import { refineTimeZoneArg } from './timeZoneArg'
import { ZonedDateTimeArg } from './zonedDateTime'

export type Duration = DurationFields // and other getters/methods
export type DurationArg = Duration | Partial<DurationFields> | string

export const [Duration, createDuration, getDurationSlots] = createSlotClass(
  DurationBranding,
  constructDurationSlots,
  formatDurationIso,
  {
    ...durationFieldGetters,
    sign(slots: DurationFields & { sign: NumberSign }) {
      return slots.sign
    },
    blank(slots: DurationFields & { sign: NumberSign }) {
      return !slots.sign
    },
  },
  {
    with(
      slots: DurationFields & { sign: NumberSign },
      mod: Partial<DurationFields>,
    ): Duration {
      return createDuration(mergeDurationFields(slots, mod))
    },
    negated(slots: DurationFields & { sign: NumberSign }): Duration {
      return createDuration(negateDuration(slots))
    },
    abs(slots: DurationFields & { sign: NumberSign }): Duration {
      return createDuration(absDuration(slots))
    },
    add(
      slots: DurationFields & { sign: NumberSign },
      otherArg: DurationArg,
      options?: RelativeToOptions<PlainDateArg | ZonedDateTimeArg>,
    ) {
      return createDuration(
        addDurations(
          refinePublicRelativeTo,
          false,
          slots,
          toDurationSlots(otherArg),
          options,
        ),
      )
    },
    subtract(
      slots: DurationFields & { sign: NumberSign },
      otherArg: DurationArg,
      options?: RelativeToOptions<PlainDateArg | ZonedDateTimeArg>,
    ) {
      return createDuration(
        addDurations(
          refinePublicRelativeTo,
          true,
          slots,
          toDurationSlots(otherArg),
          options,
        ),
      )
    },
    round(
      slots: DurationFields & { sign: NumberSign },
      options: DurationRoundingOptions<PlainDateArg | ZonedDateTimeArg>,
    ): Duration {
      return createDuration(
        roundDuration(refinePublicRelativeTo, slots, options),
      )
    },
    total(
      slots: DurationFields & { sign: NumberSign },
      options: UnitName | DurationTotalOptions<PlainDateArg | ZonedDateTimeArg>,
    ): number {
      return totalDuration(refinePublicRelativeTo, slots, options)
    },
    toLocaleString(
      this: Duration,
      slots: DurationFields & { sign: NumberSign },
      locales?: LocalesArg,
      options?: any,
    ): string {
      return (Intl as any).DurationFormat
        ? new (Intl as any).DurationFormat(locales, options).format(this)
        : formatDurationIso(slots)
    },
  },
  {
    from(arg: DurationArg): Duration {
      return createDuration(toDurationSlots(arg))
    },
    compare(
      durationArg0: DurationArg,
      durationArg1: DurationArg,
      options?: RelativeToOptions<PlainDateArg | ZonedDateTimeArg>,
    ): NumberSign {
      return compareDurations(
        refinePublicRelativeTo,
        toDurationSlots(durationArg0),
        toDurationSlots(durationArg1),
        options,
      )
    },
  },
)

// Utils
// -----------------------------------------------------------------------------

export function toDurationSlots(
  arg: DurationArg,
): DurationFields & { sign: NumberSign } {
  if (isObjectLike(arg)) {
    const brandingAndSlots = getBrandingAndSlots(arg)

    if (brandingAndSlots && brandingAndSlots[0] === DurationBranding) {
      const slots = brandingAndSlots[1]
      return slots as DurationFields & { sign: NumberSign }
    }

    return refineDurationObjectLike(arg as Partial<DurationFields>)
  }

  return parseDuration(arg)
}

function refinePublicRelativeTo(
  relativeTo: ZonedDateTimeArg | PlainDateTimeArg | PlainDateArg | undefined,
): RelativeToSlots | undefined {
  if (relativeTo !== undefined) {
    if (isObjectLike(relativeTo)) {
      const brandingAndSlots = getBrandingAndSlots(relativeTo)

      if (brandingAndSlots) {
        const [branding, slots] = brandingAndSlots
        switch (branding) {
          case ZonedDateTimeBranding:
          case PlainDateBranding:
            return slots as
              | (ZonedEpochNanoFields & { calendar: InternalCalendar })
              | (CalendarDateFields & { calendar: InternalCalendar })

          case PlainDateTimeBranding:
            return createDateSlots(
              slots as CalendarDateTimeFields & { calendar: InternalCalendar },
              (slots as CalendarDateTimeFields & { calendar: InternalCalendar })
                .calendar,
            )
        }
      }

      const calendar = getCalendarFromBag(relativeTo as any) // !!!
      const res = refineMaybeZonedDateTimeObjectLike(
        refineTimeZoneArg,
        calendar,
        relativeTo as unknown as ZonedDateTimeLikeObject, // !!!
      )

      return res
    }

    return parseRelativeToSlots(relativeTo, resolveFullCalendar)
  }
}
