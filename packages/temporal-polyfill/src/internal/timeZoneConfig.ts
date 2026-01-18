import { isoArgsToEpochSec } from './timeMath'
import { secInDay } from './units'

export const utcTimeZoneId = 'UTC'

export const periodDur = secInDay * 60

export const minPossibleTransition = isoArgsToEpochSec(1847)
export const maxPossibleTransition = isoArgsToEpochSec(getCurrentYearPlus10())

function getCurrentYearPlus10() {
  const currentDate = /*@__PURE__*/ new Date(0)
  const currentYear = /*@__PURE__*/ currentDate.getUTCFullYear()
  return currentYear + 10
}
