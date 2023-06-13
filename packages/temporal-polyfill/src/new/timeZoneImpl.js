/* eslint-disable no-return-assign */
/* eslint-disable no-unmodified-loop-condition */
import { parseIntlYear } from './calendarImpl'
import { IntlDateTimeFormat, hashIntlFormatParts, standardCalendarId } from './intlFormat'
import {
  epochNanoToSec,
  epochNanoToSecMod,
  epochSecToNano,
  isoArgsToEpochSec,
  isoToEpochNano,
  isoToEpochSec,
} from './isoMath'
import { parseOffsetNano } from './isoParse'
import { milliInSec, nanoInSec, secInDay } from './units'
import { clamp, compareNumbers, createLazyMap } from './utils'

const periodDur = secInDay * 60
const minPossibleTransition = isoArgsToEpochSec(1847)
const maxPossibleTransition = isoArgsToEpochSec(new Date().getUTCFullYear() + 10)

const intlTimeZoneImplCache = {}

export function queryTimeZoneImpl(timeZoneId) {
  const offsetNano = parseOffsetNano(timeZoneId)

  if (offsetNano !== undefined) {
    return new FixedTimeZoneImpl(timeZoneId, offsetNano)
  }

  return intlTimeZoneImplCache[timeZoneId] || (
    intlTimeZoneImplCache[timeZoneId] = new IntlTimeZoneImpl(timeZoneId)
  )
}

// Fixed
// -------------------------------------------------------------------------------------------------

export class FixedTimeZoneImpl {
  constructor(id, offetNano) {
    this.id = id
    this.offsetNano = offetNano
  }

  getOffsetNanosecondsFor(epochNano) {
    return [this.offsetNano]
  }

  getPossibleInstantsFor(isoDateTimeFields) {
    return [isoToEpochNano(isoDateTimeFields).add(this.offsetNano)]
  }

  getTransition(epochNano, direction) {
  }
}

// Intl
// -------------------------------------------------------------------------------------------------

export class IntlTimeZoneImpl {
  constructor(id) {
    this.id = id
    this.store = createIntlTimeZoneStore(createComputeOffsetSec(id))
  }

  getOffsetNanosecondsFor(epochNano) {
    return this.store.getOffsetSec(epochNanoToSec(epochNano)) * nanoInSec
  }

  getPossibleInstantsFor(isoDateTimeFields) {
    const [zonedEpochSec, subsecNano] = isoToEpochSec(isoDateTimeFields)
    return this.store.getPossibleEpochSec(zonedEpochSec)
      .map((epochSec) => epochSecToNano(epochSec).add(subsecNano))
  }

  /*
  exclusive for both directions
  */
  getTransition(epochNano, direction) {
    const [epochSec, subsecNano] = epochNanoToSecMod(epochNano)
    const resEpochSec = this.store.getTransition(
      epochSec.toNumber() + ((direction > 0 || subsecNano) ? 1 : 0),
      direction,
    )
    if (resEpochSec !== undefined) {
      return epochSecToNano(resEpochSec)
    }
  }
}

function createIntlTimeZoneStore(computeOffsetSec) {
  const getSample = createLazyMap(computeOffsetSec) // always given startEpochSec/endEpochSec
  const getSplit = createLazyMap((startEpochSec, endEpochSec) => [startEpochSec, endEpochSec])
  let minTransition = minPossibleTransition
  let maxTransition = maxPossibleTransition

  function getPossibleEpochSec(zonedEpochSec) {
    let startOffsetSec = getOffsetSec(zonedEpochSec - secInDay)
    let endOffsetSec = getOffsetSec(zonedEpochSec + secInDay)
    const startUtcEpochSec = zonedEpochSec - startOffsetSec

    if (startOffsetSec === endOffsetSec) {
      return [startUtcEpochSec]
    }

    const endUtcEpochSec = zonedEpochSec - endOffsetSec
    startOffsetSec = getOffsetSec(startUtcEpochSec)
    endOffsetSec = getOffsetSec(endUtcEpochSec)

    if (startOffsetSec === endOffsetSec) {
      return [startUtcEpochSec]
    }

    if (startUtcEpochSec < endUtcEpochSec) {
      return [startUtcEpochSec, endUtcEpochSec]
    }

    return []
  }

  function getOffsetSec(epochSec) {
    const clampedEpochSec = clamp(epochSec, minTransition, maxTransition)
    const [startEpochSec, endEpochSec] = computePeriod(clampedEpochSec)
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
  function getTransition(epochSec, direction) {
    const clampedEpochSec = clamp(epochSec, minTransition, maxTransition)
    let [startEpochSec, endEpochSec] = computePeriod(clampedEpochSec)

    const inc = periodDur * direction
    const inBounds = direction < 0
      ? () => endEpochSec > minTransition || (minTransition = clampedEpochSec, false)
      : () => startEpochSec < maxTransition || (maxTransition = clampedEpochSec, false)

    while (inBounds()) {
      const startOffsetSec = getSample(startEpochSec)
      const endOffsetSec = getSample(endEpochSec)

      if (startOffsetSec !== endOffsetSec) {
        const split = getSplit(startEpochSec, endEpochSec)
        pinch(split, startOffsetSec, endOffsetSec)
        const transitionEpochSec = split[0]

        if ((compareNumbers(epochSec, transitionEpochSec) || 1) === direction) {
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
  function pinch(split, startOffsetSec, endOffsetSec, forEpochSec) {
    let offsetSec
    let splitDurSec

    while (
      (forEpochSec === undefined ||
        (forEpochSec < split[0]
          ? startOffsetSec
          : forEpochSec >= split[1]
            ? endOffsetSec
            : undefined
        ) === undefined
      ) &&
      (splitDurSec = split[1] - split[0])
    ) {
      const middleEpochSec = split[0] + Math.floor(splitDurSec / 2)
      const middleOffsetSec = computeOffsetSec(middleEpochSec)

      if (middleOffsetSec === endOffsetSec) {
        split[1] = middleEpochSec
      } else { // middleOffsetSec === startOffsetSec
        split[0] = middleEpochSec + 1
      }
    }

    return offsetSec
  }

  return { getPossibleEpochSec, getOffsetSec, getTransition }
}

function computePeriod(epochSec) {
  const startEpochSec = Math.floor(epochSec / periodDur)
  const endEpochSec = startEpochSec + periodDur
  return [startEpochSec, endEpochSec]
}

function createComputeOffsetSec(timeZoneId) {
  const format = buildIntlFormat(timeZoneId)

  return (epochSec) => {
    const intlParts = hashIntlFormatParts(format, epochSec * milliInSec)
    const zonedEpochSec = isoArgsToEpochSec(
      parseIntlYear(intlParts).year,
      parseInt(intlParts.month),
      parseInt(intlParts.day),
      parseInt(intlParts.hour),
      parseInt(intlParts.minute),
      parseInt(intlParts.second),
    )
    return zonedEpochSec - epochSec
  }
}

function buildIntlFormat(timeZoneId) {
  // format will ALWAYS do gregorian. need to parse year
  return new IntlDateTimeFormat(standardCalendarId, {
    timeZone: timeZoneId,
    era: 'short',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  })
}
