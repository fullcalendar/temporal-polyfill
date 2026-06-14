import { DayTimeUnit, Unit, unitNanoMap } from './units'
import { divTrunc, modTrunc } from './utils'

export function nanoToGivenFields<F>(
  nano: number,
  largestUnit: DayTimeUnit, // stops populating at this unit
  fieldNames: (keyof F)[],
): { [Key in keyof F]?: number } {
  const fields = {} as { [Key in keyof F]: number }

  for (let unit = largestUnit; unit >= Unit.Nanosecond; unit--) {
    const divisor = unitNanoMap[unit]

    fields[fieldNames[unit]] = divTrunc(nano, divisor)
    nano = modTrunc(nano, divisor)
  }

  return fields
}

// There is no generic `bigNanoToGivenFields` because bigint inputs need
// domain-specific balancing before the result can become Number fields. Duration
// conversion peels off days, computes the requested largest unit, and applies
// Temporal's finite/range checks in `nanoToDurationDayTimeFields`; epoch
// date-time conversion splits at the UTC-day boundary in `epochNanoToIsoDateTime`
// before reusing PlainTime-sized Number conversion for the time part.

// The reverse direction is intentionally not a generic "given fields -> nano"
// helper anymore. Duration math needs bigint-preserving helpers in
// durationMath.ts (`durationOnlyTimeToBigNano`, `durationDayTimeToBigNano`,
// `durationTimeToBigNano`, and `durationSubMinuteToBigNano`), while PlainTime
// and ISO date-time math use the number-based helpers in timeFieldMath.ts
// (`timeFieldsToNano`, `timeFieldsToMilli`, `timeFieldsToSec`, and
// `timeFieldsToSubsecNano`). Full ISO date-times compose date and time in
// epochMath.ts via `isoDateTimeToEpochNano`.
