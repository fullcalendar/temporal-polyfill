import { isoArgsToEpochSec } from './timeMath'
import { secInDay } from './units'

export const utcTimeZoneId = 'UTC'

export const periodDur = secInDay * 60

export const minPossibleTransition = isoArgsToEpochSec(1847)
export const maxPossibleTransition = isoArgsToEpochSec(getCurrentYearPlus10())

function getCurrentYearPlus10() {
  const currentDate = new Date()
  const currentYear =
    // `new Date()` might be 0 in some environments and situations
    // https://github.com/fullcalendar/temporal-polyfill/issues/83
    currentDate.getTime() === 0 ? 2040 : currentDate.getUTCFullYear()
  return currentYear + 10
}
