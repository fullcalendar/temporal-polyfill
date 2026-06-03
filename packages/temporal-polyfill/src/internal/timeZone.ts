import { bigNanoInSec } from './bigNano'
import {
  epochNanoToSec,
  epochNanoToSecMod,
  isoArgsToEpochSec,
  isoDateTimeToEpochSec,
} from './epochMath'
import { CalendarDateTimeFields } from './fieldTypes'
import { normalizeEraName } from './intlCalendarConfig'
import { formatEpochMilliToPartsRecord } from './intlFormatUtils'
import { maxMilli } from './temporalConstants'
import {
  checkEpochNanoInBounds,
  isoDateTimeAndOffsetToEpochNano,
} from './temporalLimits'
import { getTimeZonePeriodDays, minPossibleTransition } from './timeZoneConfig'
import { type ResolvedTimeZone, resolveTimeZoneRecord } from './timeZoneId'
import { milliInSec, nanoInSec, secInDay } from './units'
import { compareNumbers, constrainToRange, memoize } from './utils'

export interface TimeZone {
  id: string
  compareKey: string | number
  getOffsetNanosecondsFor(epochNano: bigint): number
  getPossibleInstantsFor(isoDateTime: CalendarDateTimeFields): bigint[]
  getTransition(epochNano: bigint, direction: -1 | 1): bigint | undefined
}

export function queryTimeZone(rawTimeZoneId: string): TimeZone {
  const record = resolveTimeZoneRecord(rawTimeZoneId)
  return queryTimeZoneRecord(record.id, record)
}

// Cache by normalized ID after resolveTimeZoneRecord.
const queryTimeZoneRecord = memoize(
  (normTimeZoneId: string, record: ResolvedTimeZone): TimeZone => {
    return record.kind === 'named'
      ? new IntlTimeZone(normTimeZoneId, record.compareKey, record.format)
      : new FixedTimeZone(
          normTimeZoneId,
          record.compareKey,
          record.kind === 'fixed' ? record.offsetNano : 0,
        )
  },
)

// Match proposal-temporal's transition-search horizon. Offset lookup itself
// must remain unbounded: distant-future dates still need their actual Intl
// offset, even when public transition search would give up after this horizon.
const transitionSearchSec = secInDay * 366 * 3

const maxIntlSampleSec = maxMilli / milliInSec
// Use a conservative lower sampling bound: around year 1653 CE, which is
// old enough to precede known standard-time transitions but avoids the BCE date
// fields where host Intl.DateTimeFormat can become unreliable.
const minIntlSampleSec = -10_000_000_000

// Fixed
// -----------------------------------------------------------------------------

export class FixedTimeZone implements TimeZone {
  constructor(
    public id: string,
    public compareKey: string | number,
    public offsetNano: number,
  ) {}

  getOffsetNanosecondsFor(): number {
    return this.offsetNano
  }

  // Strict ISO date bounds checking is intentionally NOT done here.
  // It is conditionally performed in getMatchingInstantFor based on offsetDisambig.
  // This allows offset: "use"/"ignore" to accept epoch-boundary dates.
  getPossibleInstantsFor(isoDateTime: CalendarDateTimeFields): bigint[] {
    return [isoDateTimeAndOffsetToEpochNano(isoDateTime, this.offsetNano)]
  }

  getTransition(): bigint | undefined {
    return undefined // hopefully minifier will remove
  }
}

// Intl
// -----------------------------------------------------------------------------

interface IntlTimeZoneStore {
  getPossibleEpochSec: (zonedEpochSec: number) => number[]
  getOffsetSec: (epochSec: number) => number
  getTransition: (epochSec: number, direction: -1 | 1) => number | undefined
}

export class IntlTimeZone implements TimeZone {
  tzStore: IntlTimeZoneStore // NOTE: `store` is a reserved prop and won't be mangled

  constructor(
    public id: string,
    public compareKey: string | number,
    format: Intl.DateTimeFormat,
  ) {
    this.tzStore = createIntlTimeZoneStore(
      createComputeOffsetSec(format),
      getTimeZonePeriodDays(id),
    )
  }

  getOffsetNanosecondsFor(epochNano: bigint): number {
    return this.tzStore.getOffsetSec(epochNanoToSec(epochNano)) * nanoInSec
  }

  getPossibleInstantsFor(isoDateTime: CalendarDateTimeFields): bigint[] {
    const [zonedEpochSec, subsecNano] = isoDateTimeToEpochSec(isoDateTime)

    return this.tzStore.getPossibleEpochSec(zonedEpochSec).map((epochSec) => {
      return checkEpochNanoInBounds(
        BigInt(epochSec) * bigNanoInSec + BigInt(subsecNano),
      )
    })
  }

  /*
  exclusive for both directions
  */
  getTransition(epochNano: bigint, direction: -1 | 1): bigint | undefined {
    const [epochSec, subsecNano] = epochNanoToSecMod(epochNano)
    const resEpochSec = this.tzStore.getTransition(
      epochSec + (direction > 0 || subsecNano ? 1 : 0),
      direction,
    )

    if (resEpochSec !== undefined) {
      return BigInt(resEpochSec) * bigNanoInSec
    }
  }
}

function createIntlTimeZoneStore(
  computeOffsetSec: (epochSec: number) => number,
  periodDays: number,
): IntlTimeZoneStore {
  // always given startEpochSec/endEpochSec
  const getSample = memoize(computeOffsetSec)
  const getSplit = memoize(createSplitTuple)
  const periodSec = periodDays * secInDay

  function getPossibleEpochSec(zonedEpochSec: number): number[] {
    const wideOffsetSec0 = getOffsetSec(zonedEpochSec - secInDay)
    const wideOffsetSec1 = getOffsetSec(zonedEpochSec + secInDay)

    const wideUtcEpochSec0 = zonedEpochSec - wideOffsetSec0
    const wideUtcEpochSec1 = zonedEpochSec - wideOffsetSec1 // could move below

    if (wideOffsetSec0 === wideOffsetSec1) {
      return [wideUtcEpochSec0]
    }

    const narrowOffsetSec0 = getOffsetSec(wideUtcEpochSec0)
    const narrowOffsetSec1 = getOffsetSec(wideUtcEpochSec1)

    if (narrowOffsetSec0 === narrowOffsetSec1) {
      return [zonedEpochSec - narrowOffsetSec0]
    }

    // narrow could be too narrow
    if (wideOffsetSec0 > wideOffsetSec1) {
      return [wideUtcEpochSec0, wideUtcEpochSec1]
    }

    return []
  }

  function getOffsetSec(epochSec: number): number {
    const [startEpochSec, endEpochSec] = computePeriod(epochSec, periodSec)
    const clampedStartEpochSec = clampIntlSampleEpochSec(startEpochSec)
    const clampedEndEpochSec = clampIntlSampleEpochSec(endEpochSec)
    const startOffsetSec = getSample(clampedStartEpochSec)
    const endOffsetSec = getSample(clampedEndEpochSec)

    if (startOffsetSec === endOffsetSec) {
      return startOffsetSec
    }

    const split = getSplit(clampedStartEpochSec, clampedEndEpochSec)
    return pinch(split, startOffsetSec, endOffsetSec, epochSec)
  }

  /*
  inclusive for positive direction, exclusive for negative
  */
  function getTransition(
    epochSec: number,
    direction: -1 | 1,
  ): number | undefined {
    // There cannot be a discoverable transition after Temporal's maximum
    // supported instant. Bail out before the first Intl sample would exceed
    // native Date's TimeClip range.
    if (direction > 0 && epochSec >= maxIntlSampleSec) {
      return undefined
    }

    // Traveling backwards for a transition
    if (direction < 0) {
      // Starting in the past, before minimum possible transition
      if (epochSec <= minPossibleTransition) {
        return undefined
      }

      const currentEpochSec = getCurrentEpochSec()
      const lookaheadEpochSec = currentEpochSec + transitionSearchSec

      // Starting in the future, after maximum possible transition.
      // Do analytics on the currentEpochSec->lookaheadEpochSec period.
      // TODO: try to eliminate recursion
      if (epochSec > lookaheadEpochSec) {
        return getTransition(lookaheadEpochSec, -1)
      }
    }

    const searchEpochSec =
      direction > 0
        ? // if moving forward from far past, fast-forward search to lower bound
          Math.max(epochSec, minPossibleTransition)
        : epochSec
    let [startEpochSec, endEpochSec] = computePeriod(searchEpochSec, periodSec)

    const inc = periodSec * direction
    const searchLimit =
      direction > 0
        ? Math.max(epochSec, getCurrentEpochSec()) + transitionSearchSec
        : minPossibleTransition
    const inBounds = () =>
      direction < 0 ? endEpochSec > searchLimit : startEpochSec < searchLimit

    while (inBounds()) {
      const clampedStartEpochSec = clampIntlSampleEpochSec(startEpochSec)
      const clampedEndEpochSec = clampIntlSampleEpochSec(endEpochSec)
      const startOffsetSec = getSample(clampedStartEpochSec)
      const endOffsetSec = getSample(clampedEndEpochSec)

      if (startOffsetSec !== endOffsetSec) {
        const split = getSplit(clampedStartEpochSec, clampedEndEpochSec)
        pinch(split, startOffsetSec, endOffsetSec)
        const transitionEpochSec = split[0]

        if ((compareNumbers(transitionEpochSec, epochSec) || 1) === direction) {
          return transitionEpochSec
        }
      }

      startEpochSec += inc
      endEpochSec += inc
    }
  }

  /*
  everything outside of 'split' is know that transition doesn't happen
  transition is the first reading of a new offset period
  just one isolated sample doesn't make it known
  */
  function pinch(
    split: [number, number],
    startOffsetSec: number,
    endOffsetSec: number,
  ): undefined
  function pinch(
    split: [number, number],
    startOffsetSec: number,
    endOffsetSec: number,
    forEpochSec: number,
  ): number
  function pinch(
    split: [number, number],
    startOffsetSec: number,
    endOffsetSec: number,
    forEpochSec?: number,
  ): number | undefined {
    let offsetSec: number | undefined
    let splitDurSec: number | undefined

    while (
      (forEpochSec === undefined ||
        (offsetSec =
          forEpochSec < split[0]
            ? startOffsetSec
            : forEpochSec >= split[1]
              ? endOffsetSec
              : undefined) === undefined) &&
      (splitDurSec = split[1] - split[0])
    ) {
      const middleEpochSec = split[0] + Math.floor(splitDurSec / 2)
      const middleOffsetSec = computeOffsetSec(middleEpochSec)

      if (middleOffsetSec === endOffsetSec) {
        split[1] = middleEpochSec
      } else {
        // middleOffsetSec === startOffsetSec
        split[0] = middleEpochSec + 1
      }
    }

    return offsetSec
  }

  return { getPossibleEpochSec, getOffsetSec, getTransition }
}

function getCurrentEpochSec(): number {
  return Math.floor(Date.now() / milliInSec)
}

function createSplitTuple(
  startEpochSec: number,
  endEpochSec: number,
): [number, number] {
  return [startEpochSec, endEpochSec]
}

function computePeriod(epochSec: number, periodSec: number): [number, number] {
  const startEpochSec = Math.floor(epochSec / periodSec) * periodSec
  const endEpochSec = startEpochSec + periodSec
  return [startEpochSec, endEpochSec]
}

function clampIntlSampleEpochSec(epochSec: number): number {
  return constrainToRange(epochSec, minIntlSampleSec, maxIntlSampleSec)
}

/*
The formatter comes from queryTimeZoneIntlFormat(), which always requests the
ISO calendar. Some hosts may resolve that as gregory, but either way the parts
below are interpreted as ISO/Gregorian fields, not as user-calendar fields.
*/
function createComputeOffsetSec(
  format: Intl.DateTimeFormat,
): (epochSec: number) => number {
  return (epochSec: number) => {
    const intlParts = formatEpochMilliToPartsRecord(
      format,
      epochSec * milliInSec,
    )
    const zonedEpochSec = isoArgsToEpochSec(
      parseIntlPartsYear(intlParts),
      parseInt(intlParts.month),
      parseInt(intlParts.day),
      parseInt(intlParts.hour),
      parseInt(intlParts.minute),
      parseInt(intlParts.second),
    )
    return zonedEpochSec - epochSec
  }
}

function parseIntlPartsYear(intlParts: Record<string, string>): number {
  const relatedYear = intlParts.relatedYear

  if (relatedYear !== undefined) {
    return parseInt(relatedYear)
  }

  const year = parseInt(intlParts.year)

  // Intl formats BCE years as positive era-years. Convert them back into the
  // proleptic ISO year expected by epoch conversion helpers.
  return intlParts.era !== undefined &&
    normalizeEraName(intlParts.era) === 'bce'
    ? 1 - year
    : year
}
