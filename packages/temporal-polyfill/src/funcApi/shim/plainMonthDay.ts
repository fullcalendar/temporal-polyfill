import { calendarIdGetters, monthDayFieldGetters } from '../../classApi/mixins'
import { createSlotClass, rejectInvalidBag } from '../../classApi/slotClass'
import { plainMonthDaysEqual } from '../../internal/compare'
import { constructMonthDaySlots } from '../../internal/construct'
import { convertPlainMonthDayToDate } from '../../internal/convert'
import { refinePlainMonthDayObjectLike } from '../../internal/createFromFields'
import {
  getInternalCalendarId,
  isoCalendar,
} from '../../internal/externalCalendar'
import { EraYearOrYear, MonthDayFields } from '../../internal/fieldTypes'
import {
  createFormatPrepper,
  monthDayConfig,
} from '../../internal/intlFormatPrep'
import { LocalesArg } from '../../internal/intlFormatUtils'
import { formatPlainMonthDayIso } from '../../internal/isoFormat'
import { parsePlainMonthDay } from '../../internal/isoParse'
import { mergePlainMonthDayFields } from '../../internal/merge'
import {
  CalendarDisplayOptions,
  OverflowOptions,
} from '../../internal/optionsModel'
import { PlainMonthDayRecordBranding } from '../common-branding'
import { DateTimeFormatLike, createDateTimeFormat } from '../dateTimeFormat'
import { CalendarShimRecord, getCalendarShimRecordInternal } from './calendar'
import { PlainDateShimRecord, createPlainDateShimRecord } from './plainDate'

export type PlainMonthDayShimRecord = any & MonthDayFields
type Format = DateTimeFormatLike<PlainMonthDayShimRecord>

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

export function toPlainDate(
  record: PlainMonthDayShimRecord,
  fields: EraYearOrYear,
): PlainDateShimRecord {
  const slots = getPlainMonthDayShimRecordSlots(record)
  const resSlots = convertPlainMonthDayToDate(slots.calendar, record, fields)
  return createPlainDateShimRecord(resSlots)
}

const prepFormat = createFormatPrepper(monthDayConfig)

export function createFormat(
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): Format {
  return createDateTimeFormat(
    monthDayConfig,
    getPlainMonthDayShimRecordSlots,
    locales,
    options,
  )
}

export function toLocaleString(
  record: PlainMonthDayShimRecord,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  const [format, epochMilli] = prepFormat(
    locales,
    options,
    getPlainMonthDayShimRecordSlots(record),
  )
  return format.format(epochMilli)
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
