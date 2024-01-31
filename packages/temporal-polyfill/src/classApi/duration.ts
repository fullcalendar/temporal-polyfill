import {
  ZonedDateTimeBag,
  durationWithFields,
  refineDurationBag,
  refineMaybeZonedDateTimeBag,
} from '../internal/bagRefine'
import { compareDurations } from '../internal/compare'
import { constructDurationSlots } from '../internal/construct'
import { DurationFields } from '../internal/durationFields'
import {
  MarkerSlots,
  absDuration,
  addDurations,
  negateDuration,
  queryDurationBlank,
  queryDurationSign,
  roundDuration,
} from '../internal/durationMath'
import { DurationBag } from '../internal/fields'
import { LocalesArg } from '../internal/intlFormatUtils'
import { formatDurationIso } from '../internal/isoFormat'
import { parseDuration, parseZonedOrPlainDateTime } from '../internal/isoParse'
import {
  DurationRoundOptions,
  RelativeToOptions,
  TotalUnitOptionsWithRel,
} from '../internal/optionsRefine'
import {
  BrandingSlots,
  DurationBranding,
  DurationSlots,
  PlainDateBranding,
  PlainDateSlots,
  PlainDateTimeBranding,
  PlainDateTimeSlots,
  ZonedDateTimeBranding,
  ZonedDateTimeSlots,
  createPlainDateSlots,
} from '../internal/slots'
import { totalDuration } from '../internal/total'
import { UnitName } from '../internal/units'
import { NumberSign, isObjectLike } from '../internal/utils'
import { CalendarArg, CalendarSlot, getCalendarSlotFromBag } from './calendar'
import { createDateRefineOps, createDiffOps } from './calendarOpsQuery'
import { durationGetters, neverValueOf } from './mixins'
import { PlainDateArg } from './plainDate'
import { createSlotClass, getSlots } from './slotClass'
import { TimeZoneArg, TimeZoneSlot, refineTimeZoneSlot } from './timeZone'
import { createTimeZoneOps } from './timeZoneOpsQuery'
import { ZonedDateTimeArg } from './zonedDateTime'

export type Duration = any & DurationFields
export type DurationArg = Duration | DurationBag | string

export const [Duration, createDuration, getDurationSlots] = createSlotClass(
  DurationBranding,
  constructDurationSlots,
  {
    ...durationGetters,
    blank(slots: DurationSlots): boolean {
      return queryDurationBlank(slots)
    },
    sign(slots: DurationSlots): NumberSign {
      return queryDurationSign(slots)
    },
  },
  {
    with(slots: DurationSlots, mod: DurationBag): Duration {
      return createDuration(durationWithFields(slots, mod))
    },
    add(
      slots: DurationSlots,
      otherArg: DurationArg,
      options?: RelativeToOptions<PlainDateArg | ZonedDateTimeArg>,
    ) {
      return createDuration(
        addDurations(
          refinePublicRelativeTo,
          createDiffOps,
          createTimeZoneOps,
          false,
          slots,
          toDurationSlots(otherArg),
          options,
        ),
      )
    },
    subtract(
      slots: DurationSlots,
      otherArg: DurationArg,
      options?: RelativeToOptions<PlainDateArg | ZonedDateTimeArg>,
    ) {
      return createDuration(
        addDurations(
          refinePublicRelativeTo,
          createDiffOps,
          createTimeZoneOps,
          true,
          slots,
          toDurationSlots(otherArg),
          options,
        ),
      )
    },
    negated(slots: DurationSlots): Duration {
      return createDuration(negateDuration(slots))
    },
    abs(slots: DurationSlots): Duration {
      return createDuration(absDuration(slots))
    },
    round(
      slots: DurationSlots,
      options: DurationRoundOptions<PlainDateArg | ZonedDateTimeArg>,
    ): Duration {
      return createDuration(
        roundDuration(
          refinePublicRelativeTo,
          createDiffOps,
          createTimeZoneOps,
          slots,
          options,
        ),
      )
    },
    total(
      slots: DurationSlots,
      options:
        | TotalUnitOptionsWithRel<PlainDateArg | ZonedDateTimeArg>
        | UnitName,
    ): number {
      return totalDuration(
        refinePublicRelativeTo,
        createDiffOps,
        createTimeZoneOps,
        slots,
        options,
      )
    },
    toString: formatDurationIso,
    toLocaleString(
      _slots: DurationSlots,
      locales?: LocalesArg,
      options?: any,
    ): string {
      return new (Intl as any).DurationFormat(locales, options).format(this)
    },
    toJSON(slots: DurationSlots): string {
      return formatDurationIso(slots)
    },
    valueOf: neverValueOf,
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
        createDiffOps,
        createTimeZoneOps,
        toDurationSlots(durationArg0),
        toDurationSlots(durationArg1),
        options,
      )
    },
  },
)

// Utils
// -----------------------------------------------------------------------------

export function toDurationSlots(arg: DurationArg): DurationSlots {
  if (isObjectLike(arg)) {
    const slots = getSlots(arg)

    if (slots && slots.branding === DurationBranding) {
      return slots as DurationSlots
    }

    return refineDurationBag(arg as DurationBag)
  }

  return parseDuration(arg)
}

function refinePublicRelativeTo(
  relativeTo: ZonedDateTimeArg | PlainDateArg | undefined,
): MarkerSlots<CalendarSlot, TimeZoneSlot> | undefined {
  if (relativeTo !== undefined) {
    if (isObjectLike(relativeTo)) {
      const slots = (getSlots(relativeTo) || {}) as Partial<BrandingSlots>

      switch (slots.branding) {
        case ZonedDateTimeBranding:
        case PlainDateBranding:
          return slots as
            | ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>
            | PlainDateSlots<CalendarSlot>

        case PlainDateTimeBranding:
          return createPlainDateSlots(slots as PlainDateTimeSlots<CalendarSlot>)
      }

      const calendar = getCalendarSlotFromBag(relativeTo as any) // !!!
      const res = refineMaybeZonedDateTimeBag(
        refineTimeZoneSlot,
        createTimeZoneOps,
        createDateRefineOps(calendar),
        relativeTo as unknown as ZonedDateTimeBag<CalendarArg, TimeZoneArg>, // !!!
      )

      return { ...res, calendar }
    }

    return parseZonedOrPlainDateTime(relativeTo)
  }
}
