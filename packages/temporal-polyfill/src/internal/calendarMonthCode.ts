import * as errorMessages from './errorMessages'
import { padNumber2 } from './utils'

export type MonthCodeParts = [monthCodeNumber: number, isLeapMonth: boolean]

const monthCodeRegExp = /^M(\d{2})(L?)$/

export function parseMonthCode(monthCode: string): MonthCodeParts {
  const m = monthCodeRegExp.exec(monthCode)
  if (!m) {
    throw new RangeError(errorMessages.invalidMonthCode(monthCode))
  }

  return [
    parseInt(m[1]), // monthCodeNumber
    Boolean(m[2]),
  ]
}

export function formatMonthCode(
  monthCodeNumber: number,
  isLeapMonth: boolean,
): string {
  return 'M' + padNumber2(monthCodeNumber) + (isLeapMonth ? 'L' : '')
}

export function monthCodeNumberToMonth(
  monthCodeNumber: number,
  isLeapMonth: boolean | undefined,
  leapMonth: number | undefined,
): number {
  return (
    monthCodeNumber +
    (isLeapMonth || (leapMonth && monthCodeNumber >= leapMonth) ? 1 : 0)
  )
}

export function monthToMonthCodeNumber(
  month: number,
  leapMonth?: number,
): number {
  return month - (leapMonth && month >= leapMonth ? 1 : 0)
}
