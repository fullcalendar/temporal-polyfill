import {
  computeCalendarDateFields,
  computeCalendarMonthCode,
} from '../../internal/calendarDerived'
import { getCalendarSlotId } from '../../internal/calendarSlot'
import { plainMonthDaysEqual } from '../../internal/compare'
import { constructMonthDaySlots } from '../../internal/construct'
import { convertPlainMonthDayToDate } from '../../internal/convert'
import { refinePlainMonthDayObjectLike } from '../../internal/createFromFields'
import { EraYearOrYear, MonthDayFields } from '../../internal/fieldTypes'
import {
  createFormatPrepper,
  monthDayConfig,
} from '../../internal/intlFormatPrep'
import { LocalesArg } from '../../internal/intlFormatUtils'
import {
  formatMonthDayIsoAuto,
  formatPlainMonthDayIso,
} from '../../internal/isoFormat'
import { parsePlainMonthDay } from '../../internal/isoParse'
import { mergePlainMonthDayFields } from '../../internal/merge'
import {
  CalendarDisplayOptions,
  OverflowOptions,
} from '../../internal/optionsModel'
import { DateTimeFormatLike } from '../commonTypes'
import {
  CalendarShimRecord,
  CalendarShimResolver,
  createCalendarShimStringResolver,
  refineCalendarShimArg,
} from './calendar'
import { createDateTimeFormat } from './dateTimeFormat'
import { PlainDateShimRecord, createPlainDateShimRecord } from './plainDate'
import {
  invalidRecordType,
  recordValueOf,
  registerRecord,
  rejectInvalidBag,
} from './recordUtils'

type Format = DateTimeFormatLike<PlainMonthDayShimRecord>

type PlainMonthDayShimSlots = ReturnType<typeof constructMonthDaySlots>
const plainMonthDayShimMap = new WeakMap<object, PlainMonthDayShimSlots>()

export class PlainMonthDayShimRecord
  implements Pick<MonthDayFields, 'monthCode' | 'day'>
{
  constructor(
    isoMonth: number,
    isoDay: number,
    calendar?: CalendarShimRecord,
    referenceIsoYear?: number,
  ) {
    setPlainMonthDayShimRecordSlots(
      this,
      constructMonthDaySlots(
        refineCalendarShimArg,
        isoMonth,
        isoDay,
        calendar,
        referenceIsoYear,
      ),
    )
  }

  get calendarId() {
    return getCalendarSlotId(getPlainMonthDayShimRecordSlots(this).calendar)
  }

  get monthCode() {
    const slots = getPlainMonthDayShimRecordSlots(this)
    return computeCalendarMonthCode(slots.calendar, slots)
  }

  get day() {
    const slots = getPlainMonthDayShimRecordSlots(this)
    return computeCalendarDateFields(slots.calendar, slots).day
  }

  toJSON() {
    return formatMonthDayIsoAuto(getPlainMonthDayShimRecordSlots(this))
  }

  valueOf() {
    return recordValueOf()
  }
}

function setPlainMonthDayShimRecordSlots(
  instance: object,
  slots: PlainMonthDayShimSlots,
) {
  plainMonthDayShimMap.set(instance, slots)
  registerRecord(instance, slots, formatMonthDayIsoAuto)
}

export function createPlainMonthDayShimRecord(
  slots: PlainMonthDayShimSlots,
): PlainMonthDayShimRecord {
  const instance = Object.create(PlainMonthDayShimRecord.prototype)
  setPlainMonthDayShimRecordSlots(instance, slots)
  return instance
}

export function getPlainMonthDayShimRecordSlots(
  record: unknown,
): PlainMonthDayShimSlots {
  return getPlainMonthDayShimRecordSlotsIfPresent(record) || invalidRecordType()
}

export function getPlainMonthDayShimRecordSlotsIfPresent(
  record: unknown,
): PlainMonthDayShimSlots | undefined {
  return typeof record === 'object' && record !== null
    ? plainMonthDayShimMap.get(record)
    : undefined
}

// TEMP disabled for size inspection: defineTemporalClass(PlainMonthDayShimRecord, ...)

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

export function isRecord(arg: unknown): arg is PlainMonthDayShimRecord {
  return !!getPlainMonthDayShimRecordSlotsIfPresent(arg)
}

export function fromFields(
  fields: Partial<MonthDayFields> & { calendar?: CalendarShimRecord },
  options?: OverflowOptions,
): PlainMonthDayShimRecord {
  const inputCalendar = fields.calendar
  const calendarSlot = refineCalendarShimArg(inputCalendar)
  const resSlots = refinePlainMonthDayObjectLike(
    calendarSlot,
    !inputCalendar,
    fields as any,
    options,
  )
  return createPlainMonthDayShimRecord(resSlots)
}

export function fromString(
  s: string,
  getCalendar: CalendarShimResolver,
): PlainMonthDayShimRecord {
  return createPlainMonthDayShimRecord(
    parsePlainMonthDay(s, createCalendarShimStringResolver(getCalendar)),
  )
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
