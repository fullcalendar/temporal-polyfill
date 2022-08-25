import { createLargeInt } from '../utils/largeInt'
import { excludeUndefined } from '../utils/obj'
import { nanoToDuration } from './dayAndTime'
import {
  DurationFields,
  UnsignedDurationFields,
  negateDuration,
  signDuration,
} from './durationFields'
import { createParseError, parseNanoAfterDecimal, toIntMaybe } from './parse'
import { durationRegExp, normalizeDashes } from './parseRegExp'
import {
  HOUR,
  MILLISECOND,
  MINUTE,
  SECOND,
  TimeUnitInt,
  nanoIn,
  nanoInSecond,
} from './units'

export function parseDuration(str: string): DurationFields {
  const res = tryParseDuration(str)
  if (res === undefined) {
    throw createParseError('duration', str)
  }
  return res
}

function tryParseDuration(str: string): DurationFields | undefined {
  const match = durationRegExp.exec(normalizeDashes(str))
  if (match) { // TODO: break out into parseDurationParts
    let hours: number | undefined
    let minutes: number | undefined
    let seconds: number | undefined
    let leftoverNano: number | undefined

    ([hours, leftoverNano] = parseDurationTimeUnit(match[8], match[10], HOUR, undefined));
    ([minutes, leftoverNano] = parseDurationTimeUnit(match[12], match[14], MINUTE, leftoverNano));
    ([seconds, leftoverNano] = parseDurationTimeUnit(match[16], match[18], SECOND, leftoverNano))

    const fields: Partial<UnsignedDurationFields> = excludeUndefined({
      years: toIntMaybe(match[2]),
      months: toIntMaybe(match[3]),
      weeks: toIntMaybe(match[4]),
      days: toIntMaybe(match[5]),
      hours,
      minutes,
      seconds,
    })

    if (!Object.keys(fields).length) {
      throw new RangeError('Duration string must have at least one field')
    }

    const small = nanoToDuration(createLargeInt(leftoverNano || 0), MILLISECOND)
    // TODO: use mergeDurations somehow?
    fields.milliseconds = small.milliseconds
    fields.microseconds = small.microseconds
    fields.nanoseconds = small.nanoseconds

    let signedDuration = signDuration(fields as UnsignedDurationFields)

    if (match[1] === '-') {
      signedDuration = negateDuration(signedDuration)
    }

    return signedDuration
  }
}

function parseDurationTimeUnit(
  beforeDecimal: string | undefined,
  afterDecimal: string | undefined,
  unit: TimeUnitInt,
  leftoverNano: number | undefined,
): [number | undefined, number | undefined] { // [wholeUnits, leftoverNano]
  if (beforeDecimal !== undefined) {
    if (leftoverNano !== undefined) {
      throw new RangeError('Partial units must be last unit')
    }
    return [
      parseInt(beforeDecimal),
      afterDecimal !== undefined
        ? parseNanoAfterDecimal(afterDecimal) * (nanoIn[unit] / nanoInSecond) // mult by # of secs
        : undefined,
    ]
  } else if (leftoverNano !== undefined) {
    const wholeUnits = Math.trunc(leftoverNano / nanoIn[unit])
    return [wholeUnits, leftoverNano - (wholeUnits * nanoIn[unit])]
  } else {
    return [undefined, undefined]
  }
}
