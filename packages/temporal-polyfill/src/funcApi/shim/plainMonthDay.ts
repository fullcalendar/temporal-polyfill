import { calendarIdGetters, monthDayFieldGetters } from '../../classApi/mixins'
import { createSlotClass, rejectInvalidBag } from '../../classApi/slotClass'
import { plainMonthDaysEqual } from '../../internal/compare'
import { constructMonthDaySlots } from '../../internal/construct'
import { refinePlainMonthDayObjectLike } from '../../internal/createFromFields'
import {
  getInternalCalendarId,
  isoCalendar,
} from '../../internal/externalCalendar'
import { MonthDayFields } from '../../internal/fieldTypes'
import { formatPlainMonthDayIso } from '../../internal/isoFormat'
import { parsePlainMonthDay } from '../../internal/isoParse'
import { mergePlainMonthDayFields } from '../../internal/merge'
import {
  CalendarDisplayOptions,
  OverflowOptions,
} from '../../internal/optionsModel'
import { PlainMonthDayRecordBranding } from '../common-branding'
import { CalendarShimRecord, getCalendarShimRecordInternal } from './calendar'

export type PlainMonthDayShimRecord = any & MonthDayFields

export const [
  PlainMonthDayShimRecord,
  createPlainMonthDayShimRecord,
  getPlainMonthDayShimRecordSlots,
] = createSlotClass(
  PlainMonthDayRecordBranding,
  (
    isoMonth: number,
    isoDay: number,
    calendar?: CalendarShimRecord,
    referenceIsoYear?: number,
  ) =>
    constructMonthDaySlots(
      isoMonth,
      isoDay,
      calendar === undefined
        ? undefined
        : getInternalCalendarId(getCalendarShimRecordInternal(calendar)),
      referenceIsoYear,
    ),
  formatPlainMonthDayIso,
  {
    ...calendarIdGetters,
    ...monthDayFieldGetters,
  },
  {},
  {},
)

export function create(
  isoMonth: number,
  isoDay: number,
  calendar?: CalendarShimRecord,
  referenceIsoYear?: number,
): PlainMonthDayShimRecord {
  return new PlainMonthDayShimRecord(
    isoMonth,
    isoDay,
    calendar,
    referenceIsoYear,
  )
}

export function fromFields(
  fields: Partial<MonthDayFields> & { calendar?: CalendarShimRecord },
  options?: OverflowOptions,
): PlainMonthDayShimRecord {
  const inputCalendar = fields.calendar
  const internalCalendar = inputCalendar
    ? getCalendarShimRecordInternal(inputCalendar)
    : isoCalendar
  const resSlots = refinePlainMonthDayObjectLike(
    internalCalendar,
    !inputCalendar,
    fields as any,
    options,
  )
  return createPlainMonthDayShimRecord(resSlots)
}

export function fromString(s: string): PlainMonthDayShimRecord {
  return createPlainMonthDayShimRecord(parsePlainMonthDay(s))
}

export function withFields(
  record: PlainMonthDayShimRecord,
  mod: Partial<MonthDayFields>,
  options?: OverflowOptions,
): PlainMonthDayShimRecord {
  const slots = getPlainMonthDayShimRecordSlots(record)
  const resSlots = mergePlainMonthDayFields(
    slots,
    rejectInvalidBag(mod),
    options,
  )
  return createPlainMonthDayShimRecord(resSlots)
}

export function equals(
  record: PlainMonthDayShimRecord,
  otherRecord: PlainMonthDayShimRecord,
): boolean {
  const slots = getPlainMonthDayShimRecordSlots(record)
  const otherSlots = getPlainMonthDayShimRecordSlots(otherRecord)
  return plainMonthDaysEqual(slots, otherSlots)
}

export function toString(
  record: PlainMonthDayShimRecord,
  options?: CalendarDisplayOptions,
): string {
  return formatPlainMonthDayIso(
    getPlainMonthDayShimRecordSlots(record),
    options,
  )
}
