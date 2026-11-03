import { secInUtcDay } from './units'

export const utcTimeZoneId = 'UTC'

// Time-zone transition search works by sampling the offset at both ends of a period,
// and then bisecting only when those samples differ. A period must be shorter than the
// time between any two of a zone's transitions, or else both can land in one period,
// which either hides them or finds only one. This period is used by both transition
// search and direct offset lookup, so these day counts protect ordinary offset and
// DST-gap math too, not only getTimeZoneTransition().
//
// The default fits all but the zones below. timeZoneImpl.test.ts checks every zone
// against native Temporal, so a closer pair in a future tzdb release will fail there.
export const defaultTimeZonePeriodDays = 19

// Based on proposal-temporal's values, which come from close transitions in test262.
// https://github.com/tc39/proposal-temporal/blob/171f1c3b630f91b1a0bba80ce5cbfcfa5b14c478/polyfill/lib/ecmascript.mjs#L2397
//
const timeZonePeriodDaysByName: Record<string, number> = {
  // Quoted keys are intentional. Production builds mangle property names, but
  // these keys are looked up by runtime IANA zone names.
  'El_Aaiun': 16, // 16.96 days apart in 1976
  'Tucuman': 12,
  'Tirane': 11,
  'Riga': 10,
  'Simferopol': 9,
  'Vienna': 9,
  'Tunis': 8,
  'Boa_Vista': 6,
  'Fortaleza': 6,
  'Maceio': 6,
  'Noronha': 6,
  'Recife': 6,
  'Gaza': 6,
  'Hebron': 6,
  'DeNoronha': 6,
}

export function getTimeZonePeriodDays(timeZoneId: string): number {
  const timeZoneName = timeZoneId.split('/').pop()!
  return timeZonePeriodDaysByName[timeZoneName] || defaultTimeZonePeriodDays
}

// -44925 is 1847-01-01 as an ISO epoch-day count.
export const minPossibleTransitionSec = -44925 * secInUtcDay
