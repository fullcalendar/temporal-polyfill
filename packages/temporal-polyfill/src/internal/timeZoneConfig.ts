import { isoArgsToEpochSec } from './timeMath'
export const utcTimeZoneId = 'UTC'

// Time-zone transition search works by sampling the offset at both ends
// of a period and then bisecting only when those samples differ. Keep the broad
// default for ordinary zones, but use shorter periods for tzdb histories where
// the offset can change away and back within a few days. This period is used by
// both transition search and direct offset lookup, so these day counts protect
// ordinary DST-gap math too, not only getTimeZoneTransition().
//
// TODO: maybe change this to 19 like proposal-temporal's polyfill
//
export const defaultTimeZonePeriodDays = 60

// These values mirror known close-transition cases in test262. They are not a
// general proof that no closer pair can ever appear in future tzdb releases;
// they are a local performance/correctness tradeoff until the native Intl path
// grows a transition search that can discover multiple changes inside a large
// scan range.
//
// Borrowed from
// https://github.com/tc39/proposal-temporal/blob/171f1c3b630f91b1a0bba80ce5cbfcfa5b14c478/polyfill/lib/ecmascript.mjs#L2397
//
const timeZonePeriodDaysByName: Record<string, number> = {
  El_Aaiun: 17,
  Tucuman: 12,
  Tirane: 11,
  Riga: 10,
  Simferopol: 9,
  Vienna: 9,
  Tunis: 8,
  Boa_Vista: 6,
  Fortaleza: 6,
  Maceio: 6,
  Noronha: 6,
  Recife: 6,
  Gaza: 6,
  Hebron: 6,
  DeNoronha: 6,
}

export function getTimeZonePeriodDays(timeZoneId: string): number {
  const timeZoneName = timeZoneId.split('/').pop()!
  return timeZonePeriodDaysByName[timeZoneName] || defaultTimeZonePeriodDays
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
