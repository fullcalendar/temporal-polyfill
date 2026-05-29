import {
  computeCalendarDateFields,
  computeCalendarDaysInMonth,
  computeCalendarDaysInYear,
  computeCalendarEraFields,
  computeCalendarInLeapYear,
  computeCalendarMonthCode,
  computeCalendarMonthsInYear,
} from '../../internal/calendarDerived'
import { getCalendarSlotId } from '../../internal/calendarSlot'
import {
  compareIsoDateFields,
  plainYearMonthsEqual,
} from '../../internal/compare'
import {
  constructDurationSlots,
  constructYearMonthSlots,
} from '../../internal/construct'
import { convertPlainYearMonthToDate } from '../../internal/convert'
import { refinePlainYearMonthObjectLike } from '../../internal/createFromFields'
import { diffPlainYearMonth, getCommonCalendar } from '../../internal/diff'
import { DayFields, YearMonthFields } from '../../internal/fieldTypes'
import {
  createFormatPrepper,
  yearMonthConfig,
} from '../../internal/intlFormatPrep'
import { LocalesArg } from '../../internal/intlFormatUtils'
import {
  formatPlainYearMonthIso,
  formatYearMonthIsoAuto,
} from '../../internal/isoFormat'
import { parsePlainYearMonth } from '../../internal/isoParse'
import { mergePlainYearMonthFields } from '../../internal/merge'
import { movePlainYearMonth } from '../../internal/move'
import {
  CalendarDisplayOptions,
  DiffOptions,
  OverflowOptions,
  RoundingMathOptions,
  RoundingModeName,
} from '../../internal/optionsModel'
import { YearMonthUnitName } from '../../internal/units'
import { NumberSign } from '../../internal/utils'
import { DateTimeFormatLike } from '../commonTypes'
import type * as RecordTypes from '../recordTypes'
import {
  getPlainYearMonthSlots,
  setPlainYearMonthSlots,
} from '../temporalRecords'
import {
  CalendarShimRecord,
  CalendarShimResolver,
  createCalendarShimStringResolver,
  refineCalendarShimArg,
} from './calendar'
import { createDateTimeFormat } from './dateTimeFormat'
import { diffPlainMonths, diffPlainYears } from './diffUtils'
import {
  DurationShimRecord,
  createDurationShimRecord,
  getDurationShimRecordSlots,
} from './duration'
import { reversedMove } from './moveUtils'
import { PlainDateShimRecord, createPlainDateShimRecord } from './plainDate'
import {
  attachDebugString,
  defineTemporalClass,
  forbiddenValueOf,
} from './recordUtils'
import { rejectInvalidBag } from './temporalRecords'

type PlainYearMonthRecord = RecordTypes.PlainYearMonthRecord

type Format = DateTimeFormatLike<PlainYearMonthShimRecord>

type PlainYearMonthShimSlots = ReturnType<typeof constructYearMonthSlots>

export const getPlainYearMonthShimRecordSlots: (
  record: unknown,
) => PlainYearMonthShimSlots = getPlainYearMonthSlots

class _PlainYearMonthShimRecord
  implements YearMonthFields, PlainYearMonthRecord
{
  declare readonly [RecordTypes.PlainYearMonthRecordBrand]: undefined

  constructor(
    isoYear: number,
    isoMonth: number,
    calendar?: CalendarShimRecord,
    referenceIsoDay?: number,
  ) {
    setPlainYearMonthShimRecordSlots(
      this,
      constructYearMonthSlots(
        refineCalendarShimArg,
        isoYear,
        isoMonth,
        calendar,
        referenceIsoDay,
      ),
    )
  }

  get calendarId() {
    return getCalendarSlotId(getPlainYearMonthShimRecordSlots(this).calendar)
  }

  get era() {
    const slots = getPlainYearMonthShimRecordSlots(this)
    return computeCalendarEraFields(slots.calendar, slots).era
  }

  get eraYear() {
    const slots = getPlainYearMonthShimRecordSlots(this)
    return computeCalendarEraFields(slots.calendar, slots).eraYear
  }

  get year() {
    const slots = getPlainYearMonthShimRecordSlots(this)
    return computeCalendarDateFields(slots.calendar, slots).year
  }

  get month() {
    const slots = getPlainYearMonthShimRecordSlots(this)
    return computeCalendarDateFields(slots.calendar, slots).month
  }

  get monthCode() {
    const slots = getPlainYearMonthShimRecordSlots(this)
    return computeCalendarMonthCode(slots.calendar, slots)
  }

  toJSON() {
    return formatYearMonthIsoAuto(getPlainYearMonthShimRecordSlots(this))
  }

  valueOf() {
    return forbiddenValueOf()
  }
}

function setPlainYearMonthShimRecordSlots(
  instance: object,
  slots: PlainYearMonthShimSlots,
) {
  setPlainYearMonthSlots(instance, slots)
  attachDebugString(instance, slots, formatYearMonthIsoAuto)
}

export function createPlainYearMonthShimRecord(
  slots: PlainYearMonthShimSlots,
): PlainYearMonthShimRecord {
  const instance = Object.create(PlainYearMonthShimRecord.prototype)
  setPlainYearMonthShimRecordSlots(instance, slots)
  return instance
}

export type PlainYearMonthShimRecord = _PlainYearMonthShimRecord
export const PlainYearMonthShimRecord = defineTemporalClass(
  _PlainYearMonthShimRecord,
  'PlainYearMonth',
)

export function create(
  isoYear: number,
  isoMonth: number,
  calendar?: CalendarShimRecord,
  referenceIsoDay?: number,
): PlainYearMonthShimRecord {
  return new PlainYearMonthShimRecord(
    isoYear,
    isoMonth,
    calendar,
    referenceIsoDay,
  )
}

export function fromFields(
  fields: Partial<YearMonthFields> & { calendar?: CalendarShimRecord },
  options?: OverflowOptions,
): PlainYearMonthShimRecord {
  const calendarSlot = refineCalendarShimArg(fields.calendar)
  const resSlots = refinePlainYearMonthObjectLike(
    calendarSlot,
    fields as any,
    options,
  )
  return createPlainYearMonthShimRecord(resSlots)
}

export function fromString(
  s: string,
  getCalendar: CalendarShimResolver,
): PlainYearMonthShimRecord {
  return createPlainYearMonthShimRecord(
    parsePlainYearMonth(s, createCalendarShimStringResolver(getCalendar)),
  )
}

export function daysInMonth(record: PlainYearMonthShimRecord): number {
  const slots = getPlainYearMonthShimRecordSlots(record)
  return computeCalendarDaysInMonth(slots.calendar, slots)
}

export function daysInYear(record: PlainYearMonthShimRecord): number {
  const slots = getPlainYearMonthShimRecordSlots(record)
  return computeCalendarDaysInYear(slots.calendar, slots)
}

export function monthsInYear(record: PlainYearMonthShimRecord): number {
  const slots = getPlainYearMonthShimRecordSlots(record)
  return computeCalendarMonthsInYear(slots.calendar, slots)
}

export function inLeapYear(record: PlainYearMonthShimRecord): boolean {
  const slots = getPlainYearMonthShimRecordSlots(record)
  return computeCalendarInLeapYear(slots.calendar, slots)
}

export function withFields(
  record: PlainYearMonthShimRecord,
  mod: Partial<YearMonthFields>,
  options?: OverflowOptions,
): PlainYearMonthShimRecord {
  const slots = getPlainYearMonthShimRecordSlots(record)
  const resSlots = mergePlainYearMonthFields(
    slots,
    rejectInvalidBag(mod),
    options,
  )
  return createPlainYearMonthShimRecord(resSlots)
}

export function add(
  record: PlainYearMonthShimRecord,
  durationRecord: DurationShimRecord,
  options?: OverflowOptions,
): PlainYearMonthShimRecord {
  const slots = getPlainYearMonthShimRecordSlots(record)
  const durationSlots = getDurationShimRecordSlots(durationRecord)
  const resSlots = movePlainYearMonth(false, slots, durationSlots, options)
  return createPlainYearMonthShimRecord(resSlots)
}

export function addYears(
  record: PlainYearMonthShimRecord,
  years: number,
  options?: OverflowOptions,
): PlainYearMonthShimRecord {
  const slots = getPlainYearMonthShimRecordSlots(record)
  const resSlots = movePlainYearMonth(
    false,
    slots,
    constructDurationSlots(years),
    options,
  )
  return createPlainYearMonthShimRecord(resSlots)
}

export function addMonths(
  record: PlainYearMonthShimRecord,
  months: number,
  options?: OverflowOptions,
): PlainYearMonthShimRecord {
  const slots = getPlainYearMonthShimRecordSlots(record)
  const resSlots = movePlainYearMonth(
    false,
    slots,
    constructDurationSlots(0, months),
    options,
  )
  return createPlainYearMonthShimRecord(resSlots)
}

export function subtract(
  record: PlainYearMonthShimRecord,
  durationRecord: DurationShimRecord,
  options?: OverflowOptions,
): PlainYearMonthShimRecord {
  const slots = getPlainYearMonthShimRecordSlots(record)
  const durationSlots = getDurationShimRecordSlots(durationRecord)
  const resSlots = movePlainYearMonth(true, slots, durationSlots, options)
  return createPlainYearMonthShimRecord(resSlots)
}

export const subtractYears: (
  record: PlainYearMonthShimRecord,
  years: number,
  options?: OverflowOptions,
) => PlainYearMonthShimRecord = reversedMove(addYears)

export const subtractMonths: (
  record: PlainYearMonthShimRecord,
  months: number,
  options?: OverflowOptions,
) => PlainYearMonthShimRecord = reversedMove(addMonths)

// this is equivalent to Temporal's `until`
export function diff(
  record: PlainYearMonthShimRecord,
  otherRecord: PlainYearMonthShimRecord,
  options?: DiffOptions<YearMonthUnitName>,
): DurationShimRecord {
  const slots = getPlainYearMonthShimRecordSlots(record)
  const otherSlots = getPlainYearMonthShimRecordSlots(otherRecord)
  const calendar = getCommonCalendar(slots.calendar, otherSlots.calendar)
  const resSlots = diffPlainYearMonth(
    false,
    calendar,
    slots,
    otherSlots,
    options,
  )
  return createDurationShimRecord(resSlots)
}

export function diffYears(
  record0: PlainYearMonthShimRecord,
  record1: PlainYearMonthShimRecord,
  options?: RoundingModeName | RoundingMathOptions,
): number {
  return diffPlainYears(
    getPlainYearMonthShimRecordSlots(record0),
    getPlainYearMonthShimRecordSlots(record1),
    options,
  )
}

export function diffMonths(
  record0: PlainYearMonthShimRecord,
  record1: PlainYearMonthShimRecord,
  options?: RoundingModeName | RoundingMathOptions,
): number {
  return diffPlainMonths(
    getPlainYearMonthShimRecordSlots(record0),
    getPlainYearMonthShimRecordSlots(record1),
    options,
  )
}

export function equals(
  record: PlainYearMonthShimRecord,
  otherRecord: PlainYearMonthShimRecord,
): boolean {
  const slots = getPlainYearMonthShimRecordSlots(record)
  const otherSlots = getPlainYearMonthShimRecordSlots(otherRecord)
  return plainYearMonthsEqual(slots, otherSlots)
}

export function compare(
  record: PlainYearMonthShimRecord,
  otherRecord: PlainYearMonthShimRecord,
): NumberSign {
  const slots = getPlainYearMonthShimRecordSlots(record)
  const otherSlots = getPlainYearMonthShimRecordSlots(otherRecord)
  return compareIsoDateFields(slots, otherSlots)
}

export function toPlainDate(
  record: PlainYearMonthShimRecord,
  fields: DayFields,
): PlainDateShimRecord {
  const slots = getPlainYearMonthShimRecordSlots(record)
  const resSlots = convertPlainYearMonthToDate(slots.calendar, record, fields)
  return createPlainDateShimRecord(resSlots)
}

const prepFormat = createFormatPrepper(yearMonthConfig)

export function createFormat(
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): Format {
  return createDateTimeFormat(
    yearMonthConfig,
    getPlainYearMonthShimRecordSlots,
    locales,
    options,
  )
}

export function toLocaleString(
  record: PlainYearMonthShimRecord,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  const [format, epochMilli] = prepFormat(
    locales,
    options,
    getPlainYearMonthShimRecordSlots(record),
  )
  return format.format(epochMilli)
}

export function toString(
  record: PlainYearMonthShimRecord,
  options?: CalendarDisplayOptions,
): string {
  return formatPlainYearMonthIso(
    getPlainYearMonthShimRecordSlots(record),
    options,
  )
}

export function toSimpleString(record: PlainYearMonthShimRecord): string {
  return formatYearMonthIsoAuto(getPlainYearMonthShimRecordSlots(record))
}
