import {
  computeCalendarDateFields,
  computeCalendarDayOfYear,
  computeCalendarDaysInMonth,
  computeCalendarDaysInYear,
  computeCalendarEraFields,
  computeCalendarInLeapYear,
  computeCalendarMonthCode,
  computeCalendarMonthsInYear,
  computeCalendarWeekOfYear,
  computeCalendarYearOfWeek,
} from '../../internal/calendarDerived'
import { getCalendarSlotId } from '../../internal/calendarSlot'
import { toStrictInteger } from '../../internal/cast'
import {
  compareZonedDateTimes,
  zonedDateTimesEqual,
} from '../../internal/compare'
import { constructZonedEpochNanoSlots } from '../../internal/construct'
import {
  zonedDateTimeToInstant,
  zonedDateTimeToPlainDate,
  zonedDateTimeToPlainDateTime,
  zonedDateTimeToPlainTime,
} from '../../internal/convert'
import { refineZonedDateTimeObjectLike } from '../../internal/createFromFields'
import { diffZonedDateTimes, getCommonCalendar } from '../../internal/diff'
import {
  CalendarDateFields,
  CalendarDateTimeFields,
  DateTimeFields,
  TimeFields,
} from '../../internal/fieldTypes'
import { combineDateAndTime } from '../../internal/fieldUtils'
import { createFormatPrepper, zonedConfig } from '../../internal/intlFormatPrep'
import { LocalesArg } from '../../internal/intlFormatUtils'
import { computeIsoDayOfWeek } from '../../internal/isoCalendarMath'
import {
  formatOffsetNano,
  formatZonedDateTimeIso,
  formatZonedDateTimeIsoAuto,
} from '../../internal/isoFormat'
import { parseZonedDateTime } from '../../internal/isoParse'
import { mergeZonedDateTimeFields } from '../../internal/merge'
import { zonedDateTimeWithPlainTime } from '../../internal/modify'
import { moveZonedDateTime } from '../../internal/move'
import {
  DiffOptions,
  DirectionName,
  DirectionOptions,
  EpochDisambig,
  OffsetDisambig,
  OverflowOptions,
  RoundingMathOptions,
  RoundingModeName,
  RoundingOptions,
  ZonedDateTimeDisplayOptions,
  ZonedFieldOptions,
} from '../../internal/optionsModel'
import { refineUnitRoundOptions } from '../../internal/optionsRoundingRefine'
import {
  IsoDateTimeInterval,
  alignZonedEpoch,
  computeZonedHoursInDay,
  computeZonedStartOfDay,
  roundZonedDateTime,
  roundZonedEpochToInterval,
} from '../../internal/round'
import {
  createZonedEpochNanoSlots,
  getEpochMilli,
  getEpochNano,
} from '../../internal/slots'
import { checkEpochNanoInBounds } from '../../internal/temporalLimits'
import { queryTimeZone } from '../../internal/timeZone'
import { refineTimeZoneId } from '../../internal/timeZoneId'
import {
  getMatchingInstantFor,
  getSingleInstantFor,
  getTimeZoneTransitionEpochNanoseconds,
  zonedEpochSlotsToIso,
} from '../../internal/timeZoneMath'
import {
  DayTimeUnitName,
  Unit,
  UnitName,
  nanoInHour,
  nanoInMicro,
  nanoInMilli,
  nanoInMinute,
  nanoInSec,
} from '../../internal/units'
import { NumberSign, bindArgs } from '../../internal/utils'
import { ZonedDateTimeFields } from '../commonTypes'
import type * as RecordTypes from '../recordTypes'
import {
  getZonedDateTimeSlots,
  setZonedDateTimeSlots,
} from '../temporalRecords'
import {
  CalendarShimRecord,
  CalendarShimResolver,
  createCalendarShimStringResolver,
  refineCalendarShimArg,
} from './calendar'
import {
  diffZonedDays,
  diffZonedMonths,
  diffZonedTimeUnits,
  diffZonedWeeks,
  diffZonedYears,
} from './diffUtils'
import {
  DurationShimRecord,
  createDurationShimRecord,
  getDurationShimRecordSlots,
} from './duration'
import { InstantShimRecord, createInstantShimRecord } from './instant'
import {
  moveByDaysStrict,
  moveByIsoWeeks,
  moveByMonths,
  moveByYears,
  moveToDayOfMonth,
  moveToDayOfWeek,
  moveToDayOfYear,
  moveToWeekOfYear,
  reversedMove,
} from './moveUtils'
import { PlainDateShimRecord, createPlainDateShimRecord } from './plainDate'
import {
  PlainDateTimeShimRecord,
  createPlainDateTimeShimRecord,
} from './plainDateTime'
import {
  PlainTimeShimRecord,
  createPlainTimeShimRecord,
  getPlainTimeShimRecordSlots,
} from './plainTime'
import {
  attachDebugString,
  defineTemporalClass,
  forbiddenValueOf,
} from './recordUtils'
import {
  computeDayCeil,
  computeHourFloor,
  computeIsoWeekCeil,
  computeIsoWeekFloor,
  computeIsoWeekInterval,
  computeMicroFloor,
  computeMilliFloor,
  computeMinuteFloor,
  computeMonthCeil,
  computeMonthFloor,
  computeMonthInterval,
  computeSecFloor,
  computeYearCeil,
  computeYearFloor,
  computeYearInterval,
} from './roundUtils'
import { rejectInvalidBag } from './temporalRecords'

type ZonedDateTimeRecord = RecordTypes.ZonedDateTimeRecord

type ZonedDateTimeShimFields = ZonedDateTimeFields<CalendarShimRecord>

type ZonedDateTimeShimSlots = ReturnType<typeof constructZonedEpochNanoSlots>

export const getZonedDateTimeShimRecordSlots: (
  record: unknown,
) => ZonedDateTimeShimSlots = getZonedDateTimeSlots

class _ZonedDateTimeShimRecord implements ZonedDateTimeRecord {
  declare readonly [RecordTypes.ZonedDateTimeRecordBrand]: undefined

  constructor(
    epochNanoseconds: bigint,
    timeZoneId: string,
    calendar?: CalendarShimRecord,
  ) {
    setZonedDateTimeShimRecordSlots(
      this,
      constructZonedEpochNanoSlots(
        refineCalendarShimArg,
        epochNanoseconds,
        timeZoneId,
        calendar,
      ),
    )
  }

  get calendarId() {
    return getCalendarSlotId(getZonedDateTimeShimRecordSlots(this).calendar)
  }

  get epochMilliseconds() {
    return getEpochMilli(getZonedDateTimeShimRecordSlots(this))
  }

  get epochNanoseconds() {
    return getEpochNano(getZonedDateTimeShimRecordSlots(this))
  }

  get timeZoneId() {
    return getZonedDateTimeShimRecordSlots(this).timeZone.id
  }

  get era() {
    const slots = zonedEpochSlotsToIso(getZonedDateTimeShimRecordSlots(this))
    return computeCalendarEraFields(slots.calendar, slots).era
  }

  get eraYear() {
    const slots = zonedEpochSlotsToIso(getZonedDateTimeShimRecordSlots(this))
    return computeCalendarEraFields(slots.calendar, slots).eraYear
  }

  get year() {
    const slots = zonedEpochSlotsToIso(getZonedDateTimeShimRecordSlots(this))
    return computeCalendarDateFields(slots.calendar, slots).year
  }

  get month() {
    const slots = zonedEpochSlotsToIso(getZonedDateTimeShimRecordSlots(this))
    return computeCalendarDateFields(slots.calendar, slots).month
  }

  get monthCode() {
    const slots = zonedEpochSlotsToIso(getZonedDateTimeShimRecordSlots(this))
    return computeCalendarMonthCode(slots.calendar, slots)
  }

  get day() {
    const slots = zonedEpochSlotsToIso(getZonedDateTimeShimRecordSlots(this))
    return computeCalendarDateFields(slots.calendar, slots).day
  }

  get hour() {
    return zonedEpochSlotsToIso(getZonedDateTimeShimRecordSlots(this)).hour
  }

  get minute() {
    return zonedEpochSlotsToIso(getZonedDateTimeShimRecordSlots(this)).minute
  }

  get second() {
    return zonedEpochSlotsToIso(getZonedDateTimeShimRecordSlots(this)).second
  }

  get millisecond() {
    return zonedEpochSlotsToIso(getZonedDateTimeShimRecordSlots(this))
      .millisecond
  }

  get microsecond() {
    return zonedEpochSlotsToIso(getZonedDateTimeShimRecordSlots(this))
      .microsecond
  }

  get nanosecond() {
    return zonedEpochSlotsToIso(getZonedDateTimeShimRecordSlots(this))
      .nanosecond
  }

  toJSON() {
    return formatZonedDateTimeIsoAuto(getZonedDateTimeShimRecordSlots(this))
  }

  valueOf() {
    return forbiddenValueOf()
  }
}

function setZonedDateTimeShimRecordSlots(
  instance: object,
  slots: ZonedDateTimeShimSlots,
) {
  setZonedDateTimeSlots(instance, slots)
  attachDebugString(instance, slots, formatZonedDateTimeIsoAuto)
}

export function createZonedDateTimeShimRecord(
  slots: ZonedDateTimeShimSlots,
): ZonedDateTimeShimRecord {
  const instance = Object.create(ZonedDateTimeShimRecord.prototype)
  setZonedDateTimeShimRecordSlots(instance, slots)
  return instance
}

export type ZonedDateTimeShimRecord = _ZonedDateTimeShimRecord
export const ZonedDateTimeShimRecord = defineTemporalClass(
  _ZonedDateTimeShimRecord,
  'ZonedDateTime',
)

export function create(
  epochNanoseconds: bigint,
  timeZoneId: string,
  calendar?: CalendarShimRecord,
): ZonedDateTimeShimRecord {
  return new ZonedDateTimeShimRecord(epochNanoseconds, timeZoneId, calendar)
}

export function fromFields(
  fields: ZonedDateTimeShimFields,
  options?: ZonedFieldOptions,
): ZonedDateTimeShimRecord {
  const inputCalendar = fields.calendar
  const calendarSlot = refineCalendarShimArg(inputCalendar)
  const resSlots = refineZonedDateTimeObjectLike(
    refineTimeZoneId,
    calendarSlot,
    fields as any,
    options,
  )
  return createZonedDateTimeShimRecord(resSlots)
}

export function fromString(
  s: string,
  getCalendar: CalendarShimResolver,
  options?: ZonedFieldOptions,
): ZonedDateTimeShimRecord {
  return createZonedDateTimeShimRecord(
    parseZonedDateTime(
      s,
      createCalendarShimStringResolver(getCalendar),
      options,
    ),
  )
}

export function withFields(
  record: ZonedDateTimeShimRecord,
  mod: Partial<DateTimeFields>,
  options?: ZonedFieldOptions,
): ZonedDateTimeShimRecord {
  const slots = getZonedDateTimeShimRecordSlots(record)
  const resSlots = mergeZonedDateTimeFields(
    slots,
    rejectInvalidBag(mod),
    options,
  )
  return createZonedDateTimeShimRecord(resSlots)
}

export function withCalendar(
  record: ZonedDateTimeShimRecord,
  inputCalendar: CalendarShimRecord,
): ZonedDateTimeShimRecord {
  const slots = getZonedDateTimeShimRecordSlots(record)
  const calendarSlot = refineCalendarShimArg(inputCalendar)
  return createZonedDateTimeShimRecord(
    createZonedEpochNanoSlots(
      slots.epochNanoseconds,
      slots.timeZone,
      calendarSlot,
    ),
  )
}

export function withTimeZone(
  record: ZonedDateTimeShimRecord,
  timeZoneId: string,
): ZonedDateTimeShimRecord {
  const slots = getZonedDateTimeShimRecordSlots(record)
  return createZonedDateTimeShimRecord(
    createZonedEpochNanoSlots(
      slots.epochNanoseconds,
      queryTimeZone(refineTimeZoneId(timeZoneId)),
      slots.calendar,
    ),
  )
}

export function withPlainTime(
  record: ZonedDateTimeShimRecord,
  plainTimeRecord?: PlainTimeShimRecord,
): ZonedDateTimeShimRecord {
  const slots = getZonedDateTimeShimRecordSlots(record)
  const plainTimeSlots =
    plainTimeRecord === undefined
      ? undefined
      : getPlainTimeShimRecordSlots(plainTimeRecord)
  const resSlots = zonedDateTimeWithPlainTime(slots, plainTimeSlots)
  return createZonedDateTimeShimRecord(resSlots)
}

export function offsetNanoseconds(record: ZonedDateTimeShimRecord): number {
  return zonedEpochSlotsToIso(getZonedDateTimeShimRecordSlots(record))
    .offsetNanoseconds
}

export function offset(record: ZonedDateTimeShimRecord): string {
  return formatOffsetNano(offsetNanoseconds(record))
}

export function dayOfWeek(record: ZonedDateTimeShimRecord): number {
  return computeIsoDayOfWeek(
    zonedEpochSlotsToIso(getZonedDateTimeShimRecordSlots(record)),
  )
}

export function daysInWeek(record: ZonedDateTimeShimRecord): number {
  getZonedDateTimeShimRecordSlots(record)
  return 7
}

export function weekOfYear(
  record: ZonedDateTimeShimRecord,
): number | undefined {
  const slots = zonedEpochSlotsToIso(getZonedDateTimeShimRecordSlots(record))
  return computeCalendarWeekOfYear(slots.calendar, slots)
}

export function yearOfWeek(
  record: ZonedDateTimeShimRecord,
): number | undefined {
  const slots = zonedEpochSlotsToIso(getZonedDateTimeShimRecordSlots(record))
  return computeCalendarYearOfWeek(slots.calendar, slots)
}

export function dayOfYear(record: ZonedDateTimeShimRecord): number {
  const slots = zonedEpochSlotsToIso(getZonedDateTimeShimRecordSlots(record))
  return computeCalendarDayOfYear(slots.calendar, slots)
}

export function daysInMonth(record: ZonedDateTimeShimRecord): number {
  const slots = zonedEpochSlotsToIso(getZonedDateTimeShimRecordSlots(record))
  return computeCalendarDaysInMonth(slots.calendar, slots)
}

export function daysInYear(record: ZonedDateTimeShimRecord): number {
  const slots = zonedEpochSlotsToIso(getZonedDateTimeShimRecordSlots(record))
  return computeCalendarDaysInYear(slots.calendar, slots)
}

export function monthsInYear(record: ZonedDateTimeShimRecord): number {
  const slots = zonedEpochSlotsToIso(getZonedDateTimeShimRecordSlots(record))
  return computeCalendarMonthsInYear(slots.calendar, slots)
}

export function inLeapYear(record: ZonedDateTimeShimRecord): boolean {
  const slots = zonedEpochSlotsToIso(getZonedDateTimeShimRecordSlots(record))
  return computeCalendarInLeapYear(slots.calendar, slots)
}

export function hoursInDay(record: ZonedDateTimeShimRecord): number {
  return computeZonedHoursInDay(getZonedDateTimeShimRecordSlots(record))
}

export function toString(
  record: ZonedDateTimeShimRecord,
  options?: ZonedDateTimeDisplayOptions,
): string {
  return formatZonedDateTimeIso(
    getZonedDateTimeShimRecordSlots(record),
    options,
  )
}

export function toSimpleString(record: ZonedDateTimeShimRecord): string {
  return formatZonedDateTimeIsoAuto(getZonedDateTimeShimRecordSlots(record))
}

export function add(
  record: ZonedDateTimeShimRecord,
  durationRecord: DurationShimRecord,
  options?: OverflowOptions,
): ZonedDateTimeShimRecord {
  const slots = getZonedDateTimeShimRecordSlots(record)
  const durationSlots = getDurationShimRecordSlots(durationRecord)
  const resSlots = moveZonedDateTime(false, slots, durationSlots, options)
  return createZonedDateTimeShimRecord(resSlots)
}

export function subtract(
  record: ZonedDateTimeShimRecord,
  durationRecord: DurationShimRecord,
  options?: OverflowOptions,
): ZonedDateTimeShimRecord {
  const slots = getZonedDateTimeShimRecordSlots(record)
  const durationSlots = getDurationShimRecordSlots(durationRecord)
  const resSlots = moveZonedDateTime(true, slots, durationSlots, options)
  return createZonedDateTimeShimRecord(resSlots)
}

// this is equivalent to Temporal's `until`
export function diff(
  record: ZonedDateTimeShimRecord,
  otherRecord: ZonedDateTimeShimRecord,
  options?: DiffOptions<UnitName>,
): DurationShimRecord {
  const slots = getZonedDateTimeShimRecordSlots(record)
  const otherSlots = getZonedDateTimeShimRecordSlots(otherRecord)
  const calendar = getCommonCalendar(slots.calendar, otherSlots.calendar)
  const resSlots = diffZonedDateTimes(
    false,
    calendar,
    slots,
    otherSlots,
    options,
  )
  return createDurationShimRecord(resSlots)
}

export function round(
  record: ZonedDateTimeShimRecord,
  options: DayTimeUnitName | RoundingOptions<DayTimeUnitName>,
): ZonedDateTimeShimRecord {
  return createZonedDateTimeShimRecord(
    roundZonedDateTime(getZonedDateTimeShimRecordSlots(record), options),
  )
}

export function startOfDay(
  record: ZonedDateTimeShimRecord,
): ZonedDateTimeShimRecord {
  return createZonedDateTimeShimRecord(
    computeZonedStartOfDay(getZonedDateTimeShimRecordSlots(record)),
  )
}

export function getTimeZoneTransition(
  record: ZonedDateTimeShimRecord,
  options: DirectionOptions | DirectionName,
): ZonedDateTimeShimRecord | null {
  const slots = getZonedDateTimeShimRecordSlots(record)
  const epochNanoseconds = getTimeZoneTransitionEpochNanoseconds(slots, options)
  return epochNanoseconds
    ? createZonedDateTimeShimRecord({ ...slots, epochNanoseconds })
    : null
}

export function equals(
  record: ZonedDateTimeShimRecord,
  otherRecord: ZonedDateTimeShimRecord,
): boolean {
  const slots = getZonedDateTimeShimRecordSlots(record)
  const otherSlots = getZonedDateTimeShimRecordSlots(otherRecord)
  return zonedDateTimesEqual(slots, otherSlots)
}

export function compare(
  record: ZonedDateTimeShimRecord,
  otherRecord: ZonedDateTimeShimRecord,
): NumberSign {
  const slots = getZonedDateTimeShimRecordSlots(record)
  const otherSlots = getZonedDateTimeShimRecordSlots(otherRecord)
  return compareZonedDateTimes(slots, otherSlots)
}

export function toInstant(record: ZonedDateTimeShimRecord): InstantShimRecord {
  const resSlots = zonedDateTimeToInstant(
    getZonedDateTimeShimRecordSlots(record),
  )
  return createInstantShimRecord(resSlots)
}

export function toPlainDateTime(
  record: ZonedDateTimeShimRecord,
): PlainDateTimeShimRecord {
  const resSlots = zonedDateTimeToPlainDateTime(
    getZonedDateTimeShimRecordSlots(record),
  )
  return createPlainDateTimeShimRecord(resSlots)
}

export function toPlainDate(
  record: ZonedDateTimeShimRecord,
): PlainDateShimRecord {
  const resSlots = zonedDateTimeToPlainDate(
    getZonedDateTimeShimRecordSlots(record),
  )
  return createPlainDateShimRecord(resSlots)
}

export function toPlainTime(
  record: ZonedDateTimeShimRecord,
): PlainTimeShimRecord {
  const resSlots = zonedDateTimeToPlainTime(
    getZonedDateTimeShimRecordSlots(record),
  )
  return createPlainTimeShimRecord(resSlots)
}

const prepFormat = createFormatPrepper(zonedConfig)

export function toLocaleString(
  record: ZonedDateTimeShimRecord,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  const [format, epochMilli] = prepFormat(
    locales,
    options,
    getZonedDateTimeShimRecordSlots(record),
  )
  return format.format(epochMilli)
}

// Non-standard: With
// -----------------------------------------------------------------------------

export const withDayOfYear = zonedTransform(moveToDayOfYear)
export const withDayOfMonth = zonedTransform(moveToDayOfMonth)
export const withDayOfWeek = zonedTransform(moveToDayOfWeek)
export const withWeekOfYear = zonedTransform(moveToWeekOfYear)

// Non-standard: Move
// -----------------------------------------------------------------------------

export const addYears = zonedTransform(moveByYears)
export const addMonths = zonedTransform(moveByMonths)
export const addWeeks = zonedTransform(moveByIsoWeeks)
export const addDays = zonedTransform(moveByDaysStrict)
export const addHours = bindArgs(moveByTimeUnit, nanoInHour)
export const addMinutes = bindArgs(moveByTimeUnit, nanoInMinute)
export const addSeconds = bindArgs(moveByTimeUnit, nanoInSec)
export const addMilliseconds = bindArgs(moveByTimeUnit, nanoInMilli)
export const addMicroseconds = bindArgs(moveByTimeUnit, nanoInMicro)
export const addNanoseconds = bindArgs(moveByTimeUnit, 1)

export const subtractYears = reversedMove(addYears)
export const subtractMonths = reversedMove(addMonths)
export const subtractWeeks = reversedMove(addWeeks)
export const subtractDays = reversedMove(addDays)
export const subtractHours = reversedMove(addHours)
export const subtractMinutes = reversedMove(addMinutes)
export const subtractSeconds = reversedMove(addSeconds)
export const subtractMilliseconds = reversedMove(addMilliseconds)
export const subtractMicroseconds = reversedMove(addMicroseconds)
export const subtractNanoseconds = reversedMove(addNanoseconds)

// Non-standard: Round
// -----------------------------------------------------------------------------

export const roundToYear = bindArgs(
  roundToInterval,
  Unit.Year,
  computeYearInterval,
)

export const roundToMonth = bindArgs(
  roundToInterval,
  Unit.Month,
  computeMonthInterval,
)

export const roundToWeek = bindArgs(
  roundToInterval,
  Unit.Week,
  computeIsoWeekInterval,
)

// Non-standard: Start-of-Unit
// -----------------------------------------------------------------------------

export const startOfYear = aligned(computeYearFloor)
export const startOfMonth = aligned(computeMonthFloor)
export const startOfWeek = aligned(computeIsoWeekFloor)
export const startOfHour = alignedZonedTime(computeHourFloor)
export const startOfMinute = alignedZonedTime(computeMinuteFloor)
export const startOfSecond = alignedZonedTime(computeSecFloor)
export const startOfMillisecond = alignedZonedTime(computeMilliFloor)
export const startOfMicrosecond = alignedZonedTime(computeMicroFloor)

// Non-standard: End-of-Unit
// -----------------------------------------------------------------------------

export const endOfYear = aligned(computeYearCeil, -1)
export const endOfMonth = aligned(computeMonthCeil, -1)
export const endOfWeek = aligned(computeIsoWeekCeil, -1)
export const endOfDay = aligned(computeDayCeil, -1)
export const endOfHour = alignedZonedTime(computeHourFloor, nanoInHour - 1)
export const endOfMinute = alignedZonedTime(
  computeMinuteFloor,
  nanoInMinute - 1,
)
export const endOfSecond = alignedZonedTime(computeSecFloor, nanoInSec - 1)
export const endOfMillisecond = alignedZonedTime(
  computeMilliFloor,
  nanoInMilli - 1,
)
export const endOfMicrosecond = alignedZonedTime(
  computeMicroFloor,
  nanoInMicro - 1,
)

// Non-standard: Diffing
// -----------------------------------------------------------------------------

export function diffYears(
  record0: ZonedDateTimeShimRecord,
  record1: ZonedDateTimeShimRecord,
  options?: RoundingModeName | RoundingMathOptions,
): number {
  return diffZonedYears(
    getZonedDateTimeShimRecordSlots(record0),
    getZonedDateTimeShimRecordSlots(record1),
    options,
  )
}

export function diffMonths(
  record0: ZonedDateTimeShimRecord,
  record1: ZonedDateTimeShimRecord,
  options?: RoundingModeName | RoundingMathOptions,
): number {
  return diffZonedMonths(
    getZonedDateTimeShimRecordSlots(record0),
    getZonedDateTimeShimRecordSlots(record1),
    options,
  )
}

export function diffWeeks(
  record0: ZonedDateTimeShimRecord,
  record1: ZonedDateTimeShimRecord,
  options?: RoundingModeName | RoundingMathOptions,
): number {
  return diffZonedWeeks(
    getZonedDateTimeShimRecordSlots(record0),
    getZonedDateTimeShimRecordSlots(record1),
    options,
  )
}

export function diffDays(
  record0: ZonedDateTimeShimRecord,
  record1: ZonedDateTimeShimRecord,
  options?: RoundingModeName | RoundingMathOptions,
): number {
  return diffZonedDays(
    getZonedDateTimeShimRecordSlots(record0),
    getZonedDateTimeShimRecordSlots(record1),
    options,
  )
}

export const diffHours = bindArgs(diffTimeUnits, Unit.Hour, nanoInHour)
export const diffMinutes = bindArgs(diffTimeUnits, Unit.Minute, nanoInMinute)
export const diffSeconds = bindArgs(diffTimeUnits, Unit.Second, nanoInSec)
export const diffMilliseconds = bindArgs(
  diffTimeUnits,
  Unit.Millisecond,
  nanoInMilli,
)
export const diffMicroseconds = bindArgs(
  diffTimeUnits,
  Unit.Microsecond,
  nanoInMicro,
)
export const diffNanoseconds = bindArgs(diffTimeUnits, Unit.Nanosecond, 1)

function diffTimeUnits(
  unit: Unit,
  nanoInUnit: number,
  record0: ZonedDateTimeShimRecord,
  record1: ZonedDateTimeShimRecord,
  options?: RoundingModeName | RoundingMathOptions,
): number {
  return diffZonedTimeUnits(
    unit as any,
    nanoInUnit,
    getZonedDateTimeShimRecordSlots(record0),
    getZonedDateTimeShimRecordSlots(record1),
    options,
  )
}

function moveByTimeUnit(
  nanoInUnit: number,
  record: ZonedDateTimeShimRecord,
  units: number,
): ZonedDateTimeShimRecord {
  const slots = getZonedDateTimeShimRecordSlots(record)
  const epochNanoseconds =
    slots.epochNanoseconds + BigInt(toStrictInteger(units)) * BigInt(nanoInUnit)
  return createZonedDateTimeShimRecord({
    ...slots,
    epochNanoseconds: checkEpochNanoInBounds(epochNanoseconds),
  })
}

function roundToInterval(
  unit: Unit,
  computeInterval: (slots: any) => IsoDateTimeInterval,
  record: ZonedDateTimeShimRecord,
  options?: RoundingModeName | RoundingMathOptions,
): ZonedDateTimeShimRecord {
  const slots = getZonedDateTimeShimRecordSlots(record)
  const [, roundingMode] = refineUnitRoundOptions(unit, options)
  const epochNanoseconds = roundZonedEpochToInterval(
    computeInterval,
    slots.timeZone,
    slots,
    roundingMode,
  )
  return createZonedDateTimeShimRecord({
    ...slots,
    epochNanoseconds: checkEpochNanoInBounds(epochNanoseconds),
  })
}

function aligned(
  computeAlignment: (record: any) => CalendarDateTimeFields,
  nanoDelta = 0,
): (record: ZonedDateTimeShimRecord) => ZonedDateTimeShimRecord {
  return (record) => {
    const slots = getZonedDateTimeShimRecordSlots(record)
    const epochNanoseconds =
      alignZonedEpoch(computeAlignment, slots.timeZone, slots) +
      BigInt(nanoDelta)
    return createZonedDateTimeShimRecord({
      ...slots,
      epochNanoseconds: checkEpochNanoInBounds(epochNanoseconds),
    })
  }
}

function alignedZonedTime(
  computeAlignment: (time: TimeFields) => TimeFields,
  nanoDelta = 0,
): (record: ZonedDateTimeShimRecord) => ZonedDateTimeShimRecord {
  return (record) => {
    const slots = getZonedDateTimeShimRecordSlots(record)
    const { timeZone } = slots
    const isoDateTime = zonedEpochSlotsToIso(slots, timeZone)

    // Sub-day alignment is wall-clock alignment, not exact-time subtraction.
    // Transitions can happen inside an hour/minute/etc, so subtracting the
    // apparent wall-clock remainder would cross gaps/repeats incorrectly.
    const alignedIsoDateTime = combineDateAndTime(
      isoDateTime,
      computeAlignment(isoDateTime),
    )

    // If the aligned wall time is repeated, prefer the current offset so
    // 01:30-05:00 startOfHour stays in the second 01:00 hour. If the aligned
    // wall time is skipped, compatible disambiguation still moves forward.
    const epochNanoseconds =
      getMatchingInstantFor(
        timeZone,
        alignedIsoDateTime,
        isoDateTime.offsetNanoseconds,
        OffsetDisambig.Prefer,
        EpochDisambig.Compat,
        true,
      ) + BigInt(nanoDelta)
    return createZonedDateTimeShimRecord({
      ...slots,
      epochNanoseconds: checkEpochNanoInBounds(epochNanoseconds),
    })
  }
}

function zonedTransform<A extends any[]>(
  transformIsoDate: (isoDate: any, ...args: A) => CalendarDateFields,
): (record: ZonedDateTimeShimRecord, ...args: A) => ZonedDateTimeShimRecord {
  return (record, ...args) => {
    const slots = getZonedDateTimeShimRecordSlots(record)
    const { timeZone } = slots
    const isoDateTime = zonedEpochSlotsToIso(slots, timeZone)
    const isoDate = transformIsoDate(isoDateTime, ...args)
    // These transforms are date-only operations. Preserve the original
    // wall-clock time while allowing the transform to replace the ISO date.
    const epochNanoseconds = getSingleInstantFor(
      timeZone,
      combineDateAndTime(isoDate, isoDateTime),
    )
    return createZonedDateTimeShimRecord({
      ...slots,
      epochNanoseconds: checkEpochNanoInBounds(epochNanoseconds),
    })
  }
}
