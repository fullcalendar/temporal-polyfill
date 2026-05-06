import { BigNano, moveBigNano, numberToBigNano } from './bigNano'
import {
  epochNanoToSec,
  epochNanoToSecMod,
  isoArgsToEpochSec,
  isoDateTimeToEpochSec,
} from './epochMath'
import { CalendarDateTimeFields } from './fieldTypes'
import { formatEpochMilliToPartsRecord } from './intlFormatUtils'
import { parseIntlPartsYear } from './intlParts'
import {
  checkEpochNanoInBounds,
  isoDateTimeToEpochNanoWithOffset,
} from './temporalLimits'
import {
  getTimeZonePeriodDays,
  maxPossibleTransition,
  minPossibleTransition,
} from './timeZoneConfig'
import { type ResolvedTimeZone, resolveTimeZoneRecord } from './timeZoneId'
import { milliInSec, nanoInSec, secInDay } from './units'
import { clampNumber, compareNumbers, memoize } from './utils'

export interface TimeZoneImpl {
  id: string
  compareKey: string | number
  getOffsetNanosecondsFor(epochNano: BigNano): number
  getPossibleInstantsFor(isoDateTime: CalendarDateTimeFields): BigNano[]
  getTransition(epochNano: BigNano, direction: -1 | 1): BigNano | undefined
}

export function queryTimeZone(rawTimeZoneId: string): TimeZoneImpl {
  const record = resolveTimeZoneRecord(rawTimeZoneId)
  return queryTimeZoneRecord(record.id, record)
}

// Cache by normalized ID after resolveTimeZoneRecord.
const queryTimeZoneRecord = memoize(
  (normTimeZoneId: string, record: ResolvedTimeZone): TimeZoneImpl => {
    return record.kind === 'named'
      ? new IntlTimeZone(normTimeZoneId, record.compareKey, record.format)
      : new FixedTimeZone(
          normTimeZoneId,
          record.compareKey,
          record.kind === 'fixed' ? record.offsetNano : 0,
        )
  },
)

// Fixed
// -----------------------------------------------------------------------------

export class FixedTimeZone implements TimeZoneImpl {
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
  getPossibleInstantsFor(isoDateTime: CalendarDateTimeFields): BigNano[] {
    return [isoDateTimeToEpochNanoWithOffset(isoDateTime, this.offsetNano)]
  }

  getTransition(): BigNano | undefined {
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

export class IntlTimeZone implements TimeZoneImpl {
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

  getOffsetNanosecondsFor(epochNano: BigNano): number {
    return this.tzStore.getOffsetSec(epochNanoToSec(epochNano)) * nanoInSec
  }

  getPossibleInstantsFor(isoDateTime: CalendarDateTimeFields): BigNano[] {
    const [zonedEpochSec, subsecNano] = isoDateTimeToEpochSec(isoDateTime)

    return this.tzStore.getPossibleEpochSec(zonedEpochSec).map((epochSec) => {
      return checkEpochNanoInBounds(
        moveBigNano(numberToBigNano(epochSec, nanoInSec), subsecNano),
      )
    })
  }

  /*
  exclusive for both directions
  */
  getTransition(epochNano: BigNano, direction: -1 | 1): BigNano | undefined {
    const [epochSec, subsecNano] = epochNanoToSecMod(epochNano)
    const resEpochSec = this.tzStore.getTransition(
      epochSec + (direction > 0 || subsecNano ? 1 : 0),
      direction,
    )

    if (resEpochSec !== undefined) {
      return numberToBigNano(resEpochSec, nanoInSec)
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
  let minTransition = minPossibleTransition
  let maxTransition = maxPossibleTransition

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
    const clampedEpochSec = clampNumber(epochSec, minTransition, maxTransition)
    const [startEpochSec, endEpochSec] = computePeriod(
      clampedEpochSec,
      periodSec,
    )
    const startOffsetSec = getSample(startEpochSec)
    const endOffsetSec = getSample(endEpochSec)

    if (startOffsetSec === endOffsetSec) {
      return startOffsetSec
    }

    const split = getSplit(startEpochSec, endEpochSec)
    return pinch(split, startOffsetSec, endOffsetSec, epochSec)
  }

  /*
  inclusive for positive direction, exclusive for negative
  */
  function getTransition(
    epochSec: number,
    direction: -1 | 1,
  ): number | undefined {
    const clampedEpochSec = clampNumber(epochSec, minTransition, maxTransition)
    let [startEpochSec, endEpochSec] = computePeriod(clampedEpochSec, periodSec)

    const inc = periodSec * direction
    const inBounds =
      direction < 0
        ? () =>
            endEpochSec > minTransition ||
            ((minTransition = clampedEpochSec), false)
        : () =>
            startEpochSec < maxTransition ||
            ((maxTransition = clampedEpochSec), false)

    while (inBounds()) {
      const startOffsetSec = getSample(startEpochSec)
      const endOffsetSec = getSample(endEpochSec)

      if (startOffsetSec !== endOffsetSec) {
        const split = getSplit(startEpochSec, endEpochSec)
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
