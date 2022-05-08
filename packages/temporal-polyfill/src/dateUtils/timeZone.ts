import { Temporal } from 'temporal-spec'
import {
  DISAMBIG_COMPATIBLE,
  DISAMBIG_EARLIER,
  DISAMBIG_LATER,
  DISAMBIG_REJECT,
  DisambigInt,
} from '../argParse/disambig'
import { Instant } from '../public/instant'
import { PlainDateTime } from '../public/plainDateTime'
import { toEpochNano } from './epoch'
import { nanoInDay } from './units'

// Utils for working with TimeZoneProtocol

export function getInstantFor(
  timeZoneProtocol: Temporal.TimeZoneProtocol,
  dateTime: PlainDateTime,
  disambigInt: DisambigInt = DISAMBIG_COMPATIBLE,
): Temporal.Instant {
  const possibleInstants = timeZoneProtocol.getPossibleInstantsFor(dateTime)

  if (possibleInstants.length === 1) {
    return possibleInstants[0]
  } else {
    if (disambigInt === DISAMBIG_REJECT) {
      throw new RangeError('Ambiguous offset')
    }

    // within a transition that jumps back
    // (compat means earlier)
    if (possibleInstants.length) {
      return possibleInstants[
        disambigInt === DISAMBIG_LATER
          ? 1
          : 0 // DISAMBIG_EARLIER and DISAMBIG_COMPATIBLE
      ]

    // within a transition that jumps forward
    // (compat means later)
    } else {
      const gapNano = computeGapNear(timeZoneProtocol, dateTime)
      const moreInstants = timeZoneProtocol.getPossibleInstantsFor(
        dateTime.add({
          nanoseconds:
            gapNano *
            (disambigInt === DISAMBIG_EARLIER
              ? -1
              : 1), // DISAMBIG_LATER and DISAMBIG_COMPATIBLE
        }),
      )

      return moreInstants[// either 1 or 2 choices
        disambigInt === DISAMBIG_EARLIER
          ? 0
          : moreInstants.length - 1 // DISAMBIG_LATER and DISAMBIG_COMPATIBLE
      ]
    }
  }
}

function computeGapNear(
  timeZoneProtocol: Temporal.TimeZoneProtocol,
  plainDateTime: PlainDateTime,
): number {
  const utcEpochNano = toEpochNano(plainDateTime)
  const offsetDayBefore = timeZoneProtocol.getOffsetNanosecondsFor(
    new Instant(utcEpochNano.sub(nanoInDay)),
  )
  const offsetDayAfter = timeZoneProtocol.getOffsetNanosecondsFor(
    new Instant(utcEpochNano.add(nanoInDay)),
  )
  return offsetDayAfter - offsetDayBefore
}
