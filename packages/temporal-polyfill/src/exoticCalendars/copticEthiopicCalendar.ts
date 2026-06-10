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

export function createCopticCalendar() {
  return createCopticFamilyCalendar(copticEpoch, copticEraOrigins)
}

export function createEthiopicCalendar() {
  return createCopticFamilyCalendar(ethiopicEpoch, ethiopicEraOrigins, 0, true)
}

export function createEthiopicAmeteAlemCalendar() {
  return createCopticFamilyCalendar(
    ethiopicEpoch,
    ethioaaEraOrigins,
    ameteMihretDelta,
  )
}

function createCopticFamilyCalendar(
  epoch: number,
  eraOrigins: Record<string, number>,
  ameteAlemYearDelta = 0,
  hasAmeteMihretEra = false,
) {
  return createArithmeticCalendar({
    eraOrigins,
    computeYearFromEra(eraYear, normalizedEra, eraOrigin) {
      return normalizedEra === 'aa' && hasAmeteMihretEra
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
      return { year: year + ameteAlemYearDelta, month, day }
    },
    toJulianDay(year, month, day) {
      return copticFamilyToJulianDay(
        epoch,
        year - ameteAlemYearDelta,
        month,
        day,
      )
    },
    computeDaysInMonth(year, month) {
      return copticFamilyDaysInMonth(year - ameteAlemYearDelta, month)
    },
    computeDaysInYear(year) {
      return 365 + copticFamilyLeapDay(year - ameteAlemYearDelta)
    },
    computeMonthsInYear() {
      return 13
    },
    computeInLeapYear(year) {
      return this.computeDaysInYear(year) > 365
    },
    computeEraFields({ year }) {
      if (ameteAlemYearDelta) {
        return { era: 'aa', eraYear: year }
      }
      if (hasAmeteMihretEra && year <= 0) {
        return { era: 'aa', eraYear: year + ameteMihretDelta }
      }
      return { era: 'am', eraYear: year }
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
