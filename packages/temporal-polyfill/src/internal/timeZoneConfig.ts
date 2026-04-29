import { isoArgsToEpochSec } from './timeMath'
export const utcTimeZoneId = 'UTC'

// Native time-zone transition search works by sampling the offset at both ends
// of a period and then bisecting only when those samples differ. Keep the broad
// default for ordinary zones, but use shorter periods for tzdb histories where
// the offset can change away and back within a few days. This period is used by
// both transition search and direct offset lookup, so these day counts protect
// ordinary DST-gap math too, not only getTimeZoneTransition().
//
// TODO: maybe change this to 19 like @js-temporal/polyfill
//
export const defaultTimeZonePeriodDays = 60

export function getTimeZonePeriodDays(timeZoneId: string): number {
  // These values mirror known close-transition cases in test262. They are not a
  // general proof that no closer pair can ever appear in future tzdb releases;
  // they are a local performance/correctness tradeoff until the native Intl path
  // grows a transition search that can discover multiple changes inside a large
  // scan range.
  switch (timeZoneId) {
    case 'Africa/El_Aaiun':
      return 17
    case 'America/Argentina/Tucuman':
      return 12
    case 'Europe/Tirane':
      return 11
    case 'Europe/Riga':
      return 10
    case 'Europe/Simferopol':
    case 'Europe/Vienna':
      return 9
    case 'Africa/Tunis':
      return 8
    case 'America/Boa_Vista':
    case 'America/Fortaleza':
    case 'America/Maceio':
    case 'America/Noronha':
    case 'America/Recife':
    case 'Asia/Gaza':
    case 'Asia/Hebron':
    case 'Brazil/DeNoronha':
      return 6
    default:
      return defaultTimeZonePeriodDays
  }
}

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
