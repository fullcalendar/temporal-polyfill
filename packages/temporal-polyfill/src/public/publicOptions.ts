import { parseZonedOrPlainDateTime } from '../internal/isoParse'
import { ensureString } from '../internal/cast'
import { isObjectlike, pluckProps } from '../internal/utils'
import { isoDateFieldNamesDesc } from '../internal/isoFields'
import { refineMaybeZonedDateTimeBag } from '../genericApi/convert'
import { ZonedDateTimeBag } from '../internal/genericBag'
import { MarketSlots } from '../internal/markerSystemTypes'
import { PlainDateSlots, ZonedDateTimeSlots } from '../genericApi/genericTypes'
import { PlainDateBranding, ZonedDateTimeBranding } from '../genericApi/branding'

// public
import { BrandingSlots, getSlots } from './slots'
import { PlainDateArg } from './plainDate'
import { ZonedDateTimeArg } from './zonedDateTime'
import { CalendarSlot, getBagCalendarSlot } from './calendarSlot'
import { TimeZoneSlot, refineTimeZoneSlot } from './timeZoneSlot'
import { TimeZoneArg } from './timeZone'
import { CalendarArg } from './calendar'
import { createDateNewCalendarRecord, createTypicalTimeZoneRecord } from './recordCreators'

export function refinePublicRelativeTo(
  relativeTo: ZonedDateTimeArg | PlainDateArg | undefined,
): MarketSlots<CalendarSlot, TimeZoneSlot> | undefined {
  if (relativeTo !== undefined) {
    if (isObjectlike(relativeTo)) {
      const slots = (getSlots(relativeTo) || {}) as Partial<BrandingSlots>

      switch (slots.branding) {
        case ZonedDateTimeBranding:
        case PlainDateBranding:
          return slots as (ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot> | PlainDateSlots<CalendarSlot>)

        case PlainDateBranding:
          return {
            ...pluckProps(isoDateFieldNamesDesc, slots as any),
            calendar: (slots as any).calendar, // !!!
          }
      }

      const calendar = getBagCalendarSlot(relativeTo)
      const res = refineMaybeZonedDateTimeBag(
        createDateNewCalendarRecord(calendar),
        refineTimeZoneSlot,
        createTypicalTimeZoneRecord,
        relativeTo as unknown as ZonedDateTimeBag<CalendarArg, TimeZoneArg>, // !!!
      )

      return { ...res, calendar }
    }

    return parseZonedOrPlainDateTime(ensureString(relativeTo))
  }
}
