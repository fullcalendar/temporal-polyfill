import { describe, expect, it } from 'vitest'
import { NativeTemporal } from '../nativeSwitch'
import * as CalendarFns from './calendar'
import * as DurationFns from './duration'
import * as InstantFns from './instant'
import * as PlainDateFns from './plainDate'
import * as PlainDateTimeFns from './plainDateTime'
import * as PlainMonthDayFns from './plainMonthDay'
import * as PlainTimeFns from './plainTime'
import * as PlainYearMonthFns from './plainYearMonth'
import {
  expectDurationEquals,
  expectInstantEquals,
  expectPlainDateEquals,
  expectPlainDateTimeEquals,
  expectPlainMonthDayEquals,
  expectPlainTimeEquals,
  expectPlainYearMonthEquals,
  expectZonedDateTimeEquals,
} from './testUtils'
import * as ZonedDateTimeFns from './zonedDateTime'

const hasNativeTemporal = Boolean(NativeTemporal)

describe('toNative', () => {
  it.runIf(hasNativeTemporal)(
    'converts records to native Temporal objects',
    () => {
      const instant = InstantFns.create(1_234_567_890n)
      const nativeInstant = InstantFns.toNative(instant)
      expect(nativeInstant).toBeInstanceOf(NativeTemporal!.Instant)
      expectInstantEquals(nativeInstant, 1_234_567_890n)

      const zonedDateTime = ZonedDateTimeFns.create(
        1_234_567_890n,
        'UTC',
        CalendarFns.getISO(),
      )
      const nativeZonedDateTime = ZonedDateTimeFns.toNative(zonedDateTime)
      expect(nativeZonedDateTime).toBeInstanceOf(NativeTemporal!.ZonedDateTime)
      expectZonedDateTimeEquals(nativeZonedDateTime, {
        epochNanoseconds: 1_234_567_890n,
        timeZoneId: 'UTC',
      })

      const plainDateTime = PlainDateTimeFns.create(
        2024,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12,
        CalendarFns.getISO(),
      )
      const nativePlainDateTime = PlainDateTimeFns.toNative(plainDateTime)
      expect(nativePlainDateTime).toBeInstanceOf(NativeTemporal!.PlainDateTime)
      expectPlainDateTimeEquals(nativePlainDateTime, {
        year: 2024,
        month: 5,
        day: 6,
        hour: 7,
        minute: 8,
        second: 9,
        millisecond: 10,
        microsecond: 11,
        nanosecond: 12,
      })

      const plainDate = PlainDateFns.create(2024, 5, 6, CalendarFns.getISO())
      const nativePlainDate = PlainDateFns.toNative(plainDate)
      expect(nativePlainDate).toBeInstanceOf(NativeTemporal!.PlainDate)
      expectPlainDateEquals(nativePlainDate, {
        year: 2024,
        month: 5,
        day: 6,
      })

      const plainTime = PlainTimeFns.create(7, 8, 9, 10, 11, 12)
      const nativePlainTime = PlainTimeFns.toNative(plainTime)
      expect(nativePlainTime).toBeInstanceOf(NativeTemporal!.PlainTime)
      expectPlainTimeEquals(nativePlainTime, {
        hour: 7,
        minute: 8,
        second: 9,
        millisecond: 10,
        microsecond: 11,
        nanosecond: 12,
      })

      const plainYearMonth = PlainYearMonthFns.create(
        2024,
        5,
        CalendarFns.getISO(),
        6,
      )
      const nativePlainYearMonth = PlainYearMonthFns.toNative(plainYearMonth)
      expect(nativePlainYearMonth).toBeInstanceOf(
        NativeTemporal!.PlainYearMonth,
      )
      expectPlainYearMonthEquals(nativePlainYearMonth, {
        year: 2024,
        month: 5,
      })

      const plainMonthDay = PlainMonthDayFns.create(
        5,
        6,
        CalendarFns.getISO(),
        2024,
      )
      const nativePlainMonthDay = PlainMonthDayFns.toNative(plainMonthDay)
      expect(nativePlainMonthDay).toBeInstanceOf(NativeTemporal!.PlainMonthDay)
      expectPlainMonthDayEquals(nativePlainMonthDay, {
        monthCode: 'M05',
        day: 6,
      })

      const duration = DurationFns.create(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
      const nativeDuration = DurationFns.toNative(duration)
      expect(nativeDuration).toBeInstanceOf(NativeTemporal!.Duration)
      expectDurationEquals(nativeDuration, {
        years: 1,
        months: 2,
        weeks: 3,
        days: 4,
        hours: 5,
        minutes: 6,
        seconds: 7,
        milliseconds: 8,
        microseconds: 9,
        nanoseconds: 10,
      })
    },
  )

  it.runIf(!hasNativeTemporal)(
    'throws when no global Temporal is present',
    () => {
      expect(() => InstantFns.toNative(InstantFns.create(1n))).toThrow()
      expect(() =>
        ZonedDateTimeFns.toNative(ZonedDateTimeFns.create(1n, 'UTC')),
      ).toThrow()
      expect(() =>
        PlainDateTimeFns.toNative(PlainDateTimeFns.create(2024, 5, 6)),
      ).toThrow()
      expect(() =>
        PlainDateFns.toNative(PlainDateFns.create(2024, 5, 6)),
      ).toThrow()
      expect(() => PlainTimeFns.toNative(PlainTimeFns.create(7))).toThrow()
      expect(() =>
        PlainYearMonthFns.toNative(PlainYearMonthFns.create(2024, 5)),
      ).toThrow()
      expect(() =>
        PlainMonthDayFns.toNative(PlainMonthDayFns.create(5, 6)),
      ).toThrow()
      expect(() => DurationFns.toNative(DurationFns.create(1))).toThrow()
    },
  )
})
