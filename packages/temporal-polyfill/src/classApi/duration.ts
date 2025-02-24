import {
  ZonedDateTimeBag,
  durationWithFields,
  refineDurationBag,
  refineMaybeZonedDateTimeBag,
} from '../internal/bagRefine'
import { createNativeStandardOps } from '../internal/calendarNativeQuery'
import { compareDurations } from '../internal/compare'
import { constructDurationSlots } from '../internal/construct'
import { DurationFields } from '../internal/durationFields'
import {
  absDuration,
  addDurations,
  getDurationBlank,
  negateDuration,
  roundDuration,
} from '../internal/durationMath'
import { DurationBag } from '../internal/fields'
import { LocalesArg } from '../internal/intlFormatUtils'
import { formatDurationIso } from '../internal/isoFormat'
import { parseDuration, parseRelativeToSlots } from '../internal/isoParse'
import { RelativeToSlots } from '../internal/markerSystem'
import {
  DurationRoundingOptions,
  DurationTotalOptions,
  RelativeToOptions,
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
import { queryNativeTimeZone } from '../internal/timeZoneNative'
import { totalDuration } from '../internal/total'
import { UnitName } from '../internal/units'
import { NumberSign, isObjectLike } from '../internal/utils'
import { getCalendarIdFromBag } from './calendarArg'
import { durationGetters, neverValueOf } from './mixins'
import { PlainDateArg } from './plainDate'
import { PlainDateTimeArg } from './plainDateTime'
import { createSlotClass, getSlots } from './slotClass'
import { refineTimeZoneArg } from './timeZoneArg'
import { ZonedDateTimeArg } from './zonedDateTime'

export type Duration = any & DurationFields
export type DurationArg = Duration | DurationBag | string

export const [Duration, createDuration, getDurationSlots] = createSlotClass(
  DurationBranding,
  constructDurationSlots,
  {
    ...durationGetters,
    blank: getDurationBlank,
  },
  {
    with(slots: DurationSlots, mod: DurationBag): Duration {
      return createDuration(durationWithFields(slots, mod))
    },
    negated(slots: DurationSlots): Duration {
      return createDuration(negateDuration(slots))
    },
    abs(slots: DurationSlots): Duration {
      return createDuration(absDuration(slots))
    },
    add(
      slots: DurationSlots,
      otherArg: DurationArg,
      options?: RelativeToOptions<PlainDateArg | ZonedDateTimeArg>,
    ) {
      return createDuration(
        addDurations(
          refinePublicRelativeTo,
          createNativeStandardOps,
          queryNativeTimeZone,
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
          createNativeStandardOps,
          queryNativeTimeZone,
          true,
          slots,
          toDurationSlots(otherArg),
          options,
        ),
      )
    },
    round(
      slots: DurationSlots,
      options: DurationRoundingOptions<PlainDateArg | ZonedDateTimeArg>,
    ): Duration {
      return createDuration(
        roundDuration(
          refinePublicRelativeTo,
          createNativeStandardOps,
          queryNativeTimeZone,
          slots,
          options,
        ),
      )
    },
    total(
      slots: DurationSlots,
      options: UnitName | DurationTotalOptions<PlainDateArg | ZonedDateTimeArg>,
    ): number {
      return totalDuration(
        refinePublicRelativeTo,
        createNativeStandardOps,
        queryNativeTimeZone,
        slots,
        options,
      )
    },
    toLocaleString(
      slots: DurationSlots,
      locales?: LocalesArg,
      options?: any,
    ): string {
      return (Intl as any).DurationFormat
        ? new (Intl as any).DurationFormat(locales, options).format(this)
        : formatDurationIso(slots)
    },
    toString: formatDurationIso,
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
        createNativeStandardOps,
        queryNativeTimeZone,
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
  relativeTo: ZonedDateTimeArg | PlainDateTimeArg | PlainDateArg | undefined,
): RelativeToSlots | undefined {
  if (relativeTo !== undefined) {
    if (isObjectLike(relativeTo)) {
      const slots = (getSlots(relativeTo) || {}) as Partial<BrandingSlots>

      switch (slots.branding) {
        case ZonedDateTimeBranding:
        case PlainDateBranding:
          return slots as ZonedDateTimeSlots | PlainDateSlots

        case PlainDateTimeBranding:
          return createPlainDateSlots(slots as PlainDateTimeSlots)
      }

      const calendarId = getCalendarIdFromBag(relativeTo as any) // !!!
      const res = refineMaybeZonedDateTimeBag(
        refineTimeZoneArg,
        queryNativeTimeZone,
        createNativeStandardOps(calendarId),
        relativeTo as unknown as ZonedDateTimeBag, // !!!
      )

      return { ...res, calendar: calendarId }
    }

    return parseRelativeToSlots(relativeTo)
  }
}
