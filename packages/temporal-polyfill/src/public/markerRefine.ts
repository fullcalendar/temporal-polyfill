import { parseZonedOrPlainDateTime } from '../internal/parseIso'
import { ensureString } from '../internal/cast'
import { isObjectlike, pluckProps } from '../internal/utils'
import { isoDateFieldNamesDesc } from '../internal/calendarIsoFields'
import { refineMaybeZonedDateTimeBag } from '../genericApi/bagGeneric'
import { MarkerSlots } from '../internal/marker'
import { ZonedDateTimeBag } from '../genericApi/bagGeneric'
import { PlainDateSlots, ZonedDateTimeSlots } from '../genericApi/slotsGeneric'
import { PlainDateBranding, PlainDateTimeBranding, ZonedDateTimeBranding } from '../genericApi/branding'

// public
import { BrandingSlots, getSlots } from './slotsForClasses'
import { PlainDateArg } from './plainDate'
import { ZonedDateTimeArg } from './zonedDateTime'
import { CalendarSlot, getCalendarSlotFromBag } from './calendarSlot'
import { TimeZoneSlot, refineTimeZoneSlot } from './timeZoneSlot'
import { TimeZoneArg } from './timeZone'
import { CalendarArg } from './calendar'
import { createDateRefineOps } from './calendarOpsQuery'
import { createTimeZoneOps } from './timeZoneOpsQuery'

export function refinePublicRelativeTo(
  relativeTo: ZonedDateTimeArg | PlainDateArg | undefined,
): MarkerSlots<CalendarSlot, TimeZoneSlot> | undefined {
  if (relativeTo !== undefined) {
    if (isObjectlike(relativeTo)) {
      const slots = (getSlots(relativeTo) || {}) as Partial<BrandingSlots>

      switch (slots.branding) {
        case ZonedDateTimeBranding:
        case PlainDateBranding:
          return slots as (ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot> | PlainDateSlots<CalendarSlot>)

        case PlainDateTimeBranding:
          return pluckProps([...isoDateFieldNamesDesc, 'calendar'], slots as any)
      }

      const calendar = getCalendarSlotFromBag(relativeTo as any) // !!!
      const res = refineMaybeZonedDateTimeBag(
        createDateRefineOps(calendar),
        refineTimeZoneSlot,
        createTimeZoneOps,
        relativeTo as unknown as ZonedDateTimeBag<CalendarArg, TimeZoneArg>, // !!!
      )

      return { ...res, calendar }
    }

    return parseZonedOrPlainDateTime(ensureString(relativeTo))
  }
}
