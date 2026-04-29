import { isoArgsToEpochSec } from './timeMath'
import { secInDay } from './units'

export const utcTimeZoneId = 'UTC'

// Native time-zone transition search works by sampling the offset at both ends
// of a period and then bisecting only when those samples differ. This longer
// historical window keeps boundary scans fast, but it can hide real-world
// close-together transitions whose offsets return to the original value inside
// one period. Revisit this algorithm instead of only tuning this constant.
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
