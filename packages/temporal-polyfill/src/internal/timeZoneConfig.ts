import { isoArgsToEpochSec } from './timeMath'
import { secInDay } from './units'

export const utcTimeZoneId = 'UTC'

export const periodDur = secInDay * 60

export const minPossibleTransition = isoArgsToEpochSec(1847)
export const maxPossibleTransition = isoArgsToEpochSec(
  /*@__PURE__*/ getCurrentYearPlus10(),
)

function getCurrentYearPlus10() {
  return new Date().getUTCFullYear() + 10
}
