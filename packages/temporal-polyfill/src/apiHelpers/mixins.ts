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
} from '../internal/calendarDerived'
import { CalendarImpl } from '../internal/calendarImpl'
import { CalendarDateFields, TimeFields } from '../internal/fieldTypes'
import { computeIsoDayOfWeek } from '../internal/isoCalendarMath'
import { EpochNanoFields, getEpochMilli, getEpochNano } from '../internal/slots'

type CalendarDateSlots = CalendarDateFields & { calendar: CalendarImpl }

/*
These accessors are the stored calendar date fields. The getter body still
asks the owning class for slots, so copied descriptors preserve each class's
brand checks and slot storage.
*/
export const createCalendarFieldGetters = <Slots extends CalendarDateSlots>(
  getSlots: (obj: unknown) => Slots,
) =>
  class {
    get era(): string | undefined {
      const slots = getSlots(this)
      return computeCalendarEraFields(slots.calendar, slots).era
    }

    get eraYear(): number | undefined {
      const slots = getSlots(this)
      return computeCalendarEraFields(slots.calendar, slots).eraYear
    }

    get year(): number {
      const slots = getSlots(this)
      return computeCalendarDateFields(slots.calendar, slots).year
    }

    get month(): number {
      const slots = getSlots(this)
      return computeCalendarDateFields(slots.calendar, slots).month
    }

    get monthCode(): string {
      const slots = getSlots(this)
      return computeCalendarMonthCode(slots.calendar, slots)
    }

    get day(): number {
      const slots = getSlots(this)
      return computeCalendarDateFields(slots.calendar, slots).day
    }
  }

/*
These fields are derived from the ISO date and calendar. Keeping them separate
lets record-style APIs reuse only the fields they actually expose as
properties.
*/
export const createCalendarDerivedGetters = <Slots extends CalendarDateSlots>(
  getSlots: (obj: unknown) => Slots,
) =>
  class {
    get dayOfWeek(): number {
      return computeIsoDayOfWeek(getSlots(this))
    }

    get dayOfYear(): number {
      const slots = getSlots(this)
      return computeCalendarDayOfYear(slots.calendar, slots)
    }

    get weekOfYear(): number | undefined {
      const slots = getSlots(this)
      return computeCalendarWeekOfYear(slots.calendar, slots)
    }

    get yearOfWeek(): number | undefined {
      const slots = getSlots(this)
      return computeCalendarYearOfWeek(slots.calendar, slots)
    }

    get daysInWeek(): number {
      getSlots(this)
      return 7
    }

    get daysInMonth(): number {
      const slots = getSlots(this)
      return computeCalendarDaysInMonth(slots.calendar, slots)
    }

    get daysInYear(): number {
      const slots = getSlots(this)
      return computeCalendarDaysInYear(slots.calendar, slots)
    }

    get monthsInYear(): number {
      const slots = getSlots(this)
      return computeCalendarMonthsInYear(slots.calendar, slots)
    }

    get inLeapYear(): boolean {
      const slots = getSlots(this)
      return computeCalendarInLeapYear(slots.calendar, slots)
    }
  }

/*
The same clock fields appear on PlainTime and PlainDateTime. Keeping them here
also preserves the receiver's slot lookup, so PlainTime and PlainDateTime still
throw their own invalid-calling-context errors.
*/
export const createTimeGetters = <Slots extends TimeFields>(
  getSlots: (obj: unknown) => Slots,
) =>
  class {
    get hour(): number {
      return getSlots(this).hour
    }

    get minute(): number {
      return getSlots(this).minute
    }

    get second(): number {
      return getSlots(this).second
    }

    get millisecond(): number {
      return getSlots(this).millisecond
    }

    get microsecond(): number {
      return getSlots(this).microsecond
    }

    get nanosecond(): number {
      return getSlots(this).nanosecond
    }
  }

/*
Instant and ZonedDateTime both store epoch nanoseconds. These accessors stay
shared while each class keeps control over its own slot lookup and branding.
*/
export const createEpochGetters = <Slots extends EpochNanoFields>(
  getSlots: (obj: unknown) => Slots,
) =>
  class {
    get epochMilliseconds(): number {
      return getEpochMilli(getSlots(this))
    }

    get epochNanoseconds(): bigint {
      return getEpochNano(getSlots(this))
    }
  }
