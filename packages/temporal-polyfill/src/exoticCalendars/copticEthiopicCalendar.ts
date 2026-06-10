import { eraYearToYear } from '../internal/calendarFields'
import { constrainToRange, modFloor } from '../internal/utils'
import { createArithmeticCalendar } from './utils/arithmeticCalendar'

// Adapted from Adobe's @internationalized/date Ethiopic/Coptic calendar
// implementation and ICU-style arithmetic calendar rules.

const ethiopicEpoch = 1723856
const copticEpoch = 1824665
const ameteMihretDelta = 5500
const copticEraOrigins = {
  'am': 0,
}
const ethiopicEraOrigins = {
  'am': 0,
  'aa': 0,
}
const ethioaaEraOrigins = {
  'aa': 0,
}
const copticEraRemaps = {
  'era0': 'am',
  'era1': 'am',
  'coptic': 'am',
}
const ethiopicEraRemaps = {
  'era0': 'aa',
  'era1': 'am',
  'ethioaa': 'aa',
  'ethiopic': 'am',
}
const ethioaaEraRemaps = {
  'era0': 'aa',
  'era1': 'aa',
  'ethioaa': 'aa',
}

export function createCopticCalendar() {
  return createCopticFamilyCalendar('coptic', copticEpoch)
}

export function createEthiopicCalendar() {
  return createCopticFamilyCalendar('ethiopic', ethiopicEpoch)
}

export function createEthiopicAmeteAlemCalendar() {
  return createCopticFamilyCalendar('ethioaa', ethiopicEpoch, true)
}

function createCopticFamilyCalendar(
  id: 'coptic' | 'ethiopic' | 'ethioaa',
  epoch: number,
  isAmeteAlem = false,
) {
  return createArithmeticCalendar({
    eraOrigins:
      id === 'coptic'
        ? copticEraOrigins
        : id === 'ethiopic'
          ? ethiopicEraOrigins
          : ethioaaEraOrigins,
    eraRemaps:
      id === 'coptic'
        ? copticEraRemaps
        : id === 'ethiopic'
          ? ethiopicEraRemaps
          : ethioaaEraRemaps,
    computeYearFromEra(eraYear, normalizedEra, eraOrigin) {
      return normalizedEra === 'aa' && id === 'ethiopic'
        ? eraYear - ameteMihretDelta
        : eraYearToYear(eraYear, eraOrigin)
    },
    constrainPlainMonthDay(monthCodeNumber, isLeapMonth, day) {
      return !isLeapMonth && monthCodeNumber === 13
        ? constrainToRange(day, 1, 6)
        : constrainToRange(day, 1, 30)
    },
    fromJulianDay(julianDay) {
      const [year, month, day] = julianDayToCopticFamily(epoch, julianDay)
      return { year: isAmeteAlem ? year + ameteMihretDelta : year, month, day }
    },
    toJulianDay(year, month, day) {
      return copticFamilyToJulianDay(
        epoch,
        isAmeteAlem ? year - ameteMihretDelta : year,
        month,
        day,
      )
    },
    computeDaysInMonth(year, month) {
      return copticFamilyDaysInMonth(
        isAmeteAlem ? year - ameteMihretDelta : year,
        month,
      )
    },
    computeDaysInYear(year) {
      return (
        365 + copticFamilyLeapDay(isAmeteAlem ? year - ameteMihretDelta : year)
      )
    },
    computeMonthsInYear() {
      return 13
    },
    computeInLeapYear(year) {
      return this.computeDaysInYear(year) > 365
    },
    computeEraFields({ year }) {
      if (id === 'ethioaa') {
        return { era: 'aa', eraYear: year }
      }
      if (id === 'ethiopic' && year <= 0) {
        return { era: 'aa', eraYear: year + ameteMihretDelta }
      }
      return {
        era: id === 'ethiopic' ? 'am' : id === 'coptic' ? 'am' : 'aa',
        eraYear: year,
      }
    },
  })
}

function copticFamilyToJulianDay(
  epoch: number,
  year: number,
  month: number,
  day: number,
): number {
  return epoch + 365 * year + Math.floor(year / 4) + 30 * (month - 1) + day - 1
}

function julianDayToCopticFamily(epoch: number, julianDay: number) {
  const year = Math.floor((4 * (julianDay - epoch) + 3) / 1461)
  const month =
    1 +
    Math.floor((julianDay - copticFamilyToJulianDay(epoch, year, 1, 1)) / 30)
  const day = julianDay + 1 - copticFamilyToJulianDay(epoch, year, month, 1)
  return [year, month, day]
}

function copticFamilyLeapDay(year: number) {
  return Math.floor(modFloor(year, 4) / 3)
}

function copticFamilyDaysInMonth(year: number, month: number) {
  return month % 13 !== 0 ? 30 : copticFamilyLeapDay(year) + 5
}
