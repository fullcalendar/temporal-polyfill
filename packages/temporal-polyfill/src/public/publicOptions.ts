import { parseZonedOrPlainDateTime } from '../internal/isoParse'
import { ensureString } from '../internal/cast'
import { isObjectlike, pluckProps } from '../internal/utils'
import { calendarImplDateFromFields, calendarImplFields } from '../internal/calendarRecordSimple'
import { timeZoneImplGetOffsetNanosecondsFor, timeZoneImplGetPossibleInstantsFor } from '../internal/timeZoneRecordSimple'
import { DayTimeNano } from '../internal/dayTimeNano'
import { IsoDateTimeFields, isoDateFieldNamesDesc } from '../internal/isoFields'
import { refineMaybeZonedDateTimeBag } from '../internal/convert'
import { ZonedDateTimeBag } from '../internal/genericBag'
import { PlainDateSlots, ZonedDateTimeSlots } from '../genericApi/genericTypes'

// public
import { IsoDateSlots, ZonedEpochSlots, getSlots } from './slots'
import { PlainDate } from './plainDate'
import { ZonedDateTime } from './zonedDateTime'
import { calendarProtocolDateFromFields, calendarProtocolFields, createCalendarSlotRecord } from './calendarRecordComplex'
import { CalendarSlot, getBagCalendarSlot } from './calendarSlot'
import { TimeZoneSlot, refineTimeZoneSlot } from './timeZoneSlot'
import { TimeZoneArg } from './timeZone'
import { createTimeZoneSlotRecord, timeZoneProtocolGetOffsetNanosecondsFor, timeZoneProtocolGetPossibleInstantsFor } from './timeZoneRecordComplex'
import { CalendarArg } from './calendar'

export function refinePublicRelativeTo(relativeTo: ZonedDateTime | PlainDate | string): ZonedEpochSlots | IsoDateSlots | undefined {
  if (relativeTo !== undefined) {
    if (isObjectlike(relativeTo)) {
      const slots = getSlots(relativeTo)
      const { branding } = slots || {}

      if (branding === 'ZonedDateTime' ||
        branding === 'PlainDate') {
        return slots as (ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot> | PlainDateSlots<CalendarSlot>)
      } else if (branding === 'PlainDateTime') {
        return {
          ...pluckProps(isoDateFieldNamesDesc, slots as any),
          calendar: (slots as any).calendar, // !!!
        }
      }

      const calendar = getBagCalendarSlot(relativeTo) // TODO: double-access of slots(.calendar)
      const calendarRecord = createCalendarSlotRecord(calendar, {
        dateFromFields: calendarImplDateFromFields,
        fields: calendarImplFields,
      }, {
        dateFromFields: calendarProtocolDateFromFields,
        fields: calendarProtocolFields,
      })

      let timeZone: TimeZoneSlot | undefined
      function getTimeZoneRecord(timeZoneArg: TimeZoneArg) {
        timeZone = refineTimeZoneSlot(timeZoneArg)
        return createTimeZoneSlotRecord(timeZone, {
          getOffsetNanosecondsFor: timeZoneImplGetOffsetNanosecondsFor,
          getPossibleInstantsFor: timeZoneImplGetPossibleInstantsFor,
        }, {
          getOffsetNanosecondsFor: timeZoneProtocolGetOffsetNanosecondsFor,
          getPossibleInstantsFor: timeZoneProtocolGetPossibleInstantsFor,
        })
      }

      const res = refineMaybeZonedDateTimeBag(
        calendarRecord,
        getTimeZoneRecord,
        relativeTo as unknown as ZonedDateTimeBag<CalendarArg, TimeZoneArg>,
      )

      return timeZone ? {
        epochNanoseconds: res as DayTimeNano,
        timeZone,
        calendar,
      } : {
        ...(res as IsoDateTimeFields),
        calendar,
      }
    }

    return parseZonedOrPlainDateTime(ensureString(relativeTo))
  }
}
