import type { Temporal } from 'temporal-spec'
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
import { createYearMonthSlots } from '../../internal/slots'
import type {
  RoundingMathOptions,
  RoundingModeName,
} from '../../internal/temporalSpecHelpers'
import { Unit } from '../../internal/units'
import { NumberSign } from '../../internal/utils'
import { DateTimeFormatLike } from '../commonTypes'
import type * as RecordTypes from '../recordTypes'
import { refineRoundToOptions } from '../roundTo'
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
import { createDateTimeFormatFactory } from './dateTimeFormat'
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
import {
  computeYearCeil,
  computeYearFloor,
  computeYearInterval,
  roundDateTimeToInterval,
} from './roundUtils'
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
  options?: Temporal.OverflowOptions,
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
  options?: Temporal.OverflowOptions,
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
  options?: Temporal.OverflowOptions,
): PlainYearMonthShimRecord {
  const slots = getPlainYearMonthShimRecordSlots(record)
  const durationSlots = getDurationShimRecordSlots(durationRecord)
  const resSlots = movePlainYearMonth(false, slots, durationSlots, options)
  return createPlainYearMonthShimRecord(resSlots)
}

export function addYears(
  record: PlainYearMonthShimRecord,
  years: number,
  options?: Temporal.OverflowOptions,
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
  options?: Temporal.OverflowOptions,
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
  options?: Temporal.OverflowOptions,
): PlainYearMonthShimRecord {
  const slots = getPlainYearMonthShimRecordSlots(record)
  const durationSlots = getDurationShimRecordSlots(durationRecord)
  const resSlots = movePlainYearMonth(true, slots, durationSlots, options)
  return createPlainYearMonthShimRecord(resSlots)
}

export const subtractYears: (
  record: PlainYearMonthShimRecord,
  years: number,
  options?: Temporal.OverflowOptions,
) => PlainYearMonthShimRecord = reversedMove(addYears)

export const subtractMonths: (
  record: PlainYearMonthShimRecord,
  months: number,
  options?: Temporal.OverflowOptions,
) => PlainYearMonthShimRecord = reversedMove(addMonths)

// this is equivalent to Temporal's `until`
export function diff(
  record: PlainYearMonthShimRecord,
  otherRecord: PlainYearMonthShimRecord,
  options?: Temporal.RoundingOptionsWithLargestUnit<'year' | 'month'>,
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
  options?: RoundingMathOptions | RoundingModeName,
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
  options?: RoundingMathOptions | RoundingModeName,
): number {
  return diffPlainMonths(
    getPlainYearMonthShimRecordSlots(record0),
    getPlainYearMonthShimRecordSlots(record1),
    options,
  )
}

// Round against the calendar year interval, then rewrap the chosen boundary as
// a YearMonth record. The boundary carries a reference ISO day that keeps
// non-ISO calendars aligned with the same semantics as PlainDate rounding.
export function roundToYear(
  record: PlainYearMonthShimRecord,
  options?: RoundingMathOptions | RoundingModeName,
): PlainYearMonthShimRecord {
  const slots = getPlainYearMonthShimRecordSlots(record)
  const [, roundingMode] = refineRoundToOptions(Unit.Year, options)
  const roundedIsoDateTime = roundDateTimeToInterval(
    computeYearInterval,
    slots,
    roundingMode,
  )
  return createPlainYearMonthShimRecord(
    createYearMonthSlots(roundedIsoDateTime, slots.calendar),
  )
}

export function startOfYear(
  record: PlainYearMonthShimRecord,
): PlainYearMonthShimRecord {
  const slots = getPlainYearMonthShimRecordSlots(record)
  return createPlainYearMonthShimRecord(
    createYearMonthSlots(computeYearFloor(slots), slots.calendar),
  )
}

// PlainYearMonth has month precision, so the inclusive end of the year is the
// month before the next calendar year's exclusive boundary.
export function endOfYear(
  record: PlainYearMonthShimRecord,
): PlainYearMonthShimRecord {
  const slots = getPlainYearMonthShimRecordSlots(record)
  const yearCeilSlots = createYearMonthSlots(
    computeYearCeil(slots),
    slots.calendar,
  )
  return createPlainYearMonthShimRecord(
    movePlainYearMonth(true, yearCeilSlots, constructDurationSlots(0, 1)),
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

export const createFormat: (
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
) => Format = createDateTimeFormatFactory(
  yearMonthConfig,
  getPlainYearMonthShimRecordSlots,
)

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
  options?: Temporal.PlainDateToStringOptions,
): string {
  return formatPlainYearMonthIso(
    getPlainYearMonthShimRecordSlots(record),
    options,
  )
}

export function toSimpleString(record: PlainYearMonthShimRecord): string {
  return formatYearMonthIsoAuto(getPlainYearMonthShimRecordSlots(record))
}
