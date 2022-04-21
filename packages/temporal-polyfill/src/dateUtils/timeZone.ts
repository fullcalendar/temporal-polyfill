import {
  DISAMBIG_COMPATIBLE,
  DISAMBIG_EARLIER,
  DISAMBIG_REJECT,
  DisambigInt,
} from '../argParse/disambig'
import { PlainDateTimeArg } from '../public/plainDateTime'
import { Temporal } from '../spec'

// Utils for working with TimeZoneProtocol

export function getInstantFor(
  timeZoneProtocol: Temporal.TimeZoneProtocol,
  dateTimeArg: PlainDateTimeArg,
  disambigInt: DisambigInt = DISAMBIG_COMPATIBLE,
): Temporal.Instant {
  const possibleInstants = timeZoneProtocol.getPossibleInstantsFor(dateTimeArg)

  if (possibleInstants.length === 1 || disambigInt === DISAMBIG_COMPATIBLE) {
    return possibleInstants[0]
  }

  if (disambigInt === DISAMBIG_REJECT) {
    throw new RangeError('Ambiguous offset')
  }

  if (disambigInt === DISAMBIG_EARLIER) {
    return possibleInstants[
      possibleInstants[0].epochNanoseconds < possibleInstants[1].epochNanoseconds
        ? 0
        : 1
    ]
  }

  // DISAMBIG_LATER
  // TODO: optimize by combining with above statement
  return possibleInstants[
    possibleInstants[0].epochNanoseconds > possibleInstants[1].epochNanoseconds
      ? 0
      : 1
  ]
}
