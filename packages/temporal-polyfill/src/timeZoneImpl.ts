import { isoCalendarId } from './calendarConfig'
import { parseIntlYear } from './calendarImpl'
import { ensureString } from './cast'
import { DayTimeNano, addDayTimeNanoAndNumber, numberToDayTimeNano } from './dayTimeNano'
import { OrigDateTimeFormat, hashIntlFormatParts, standardLocaleId } from './intlFormat'
import { IsoDateTimeFields } from './isoFields'
import { formatOffsetNano } from './isoFormat'
import {
  epochNanoToSec,
  epochNanoToSecRemainder,
  isoArgsToEpochSec,
  isoToEpochNano,
  isoToEpochSec,
} from './isoMath'
import { parseMaybeOffsetNano } from './isoParse'
import { TimeZoneOps } from './timeZoneOps'
import { milliInSec, nanoInSec, secInDay } from './units'
import { clampNumber, compareNumbers, createLazyGenerator } from './utils'

const periodDur = secInDay * 60
const minPossibleTransition = isoArgsToEpochSec(1847)
const maxPossibleTransition = isoArgsToEpochSec(new Date().getUTCFullYear() + 10)

const queryCacheableTimeZoneImpl = createLazyGenerator((timeZoneId: string): TimeZoneImpl => {
  return timeZoneId === 'UTC'
    ? new FixedTimeZoneImpl(0, timeZoneId) // override ID
    : new IntlTimeZoneImpl(timeZoneId)
})

export function queryTimeZoneImpl(timeZoneId: string): TimeZoneImpl {
  // TODO: fix double-call of ensureString
  timeZoneId = ensureString(timeZoneId).toLowerCase()

  const offsetNano = parseMaybeOffsetNano(timeZoneId, true) // onlyHourMinute=true
  if (offsetNano !== undefined) {
    return new FixedTimeZoneImpl(offsetNano)
  }

  return queryCacheableTimeZoneImpl(
    timeZoneId.toUpperCase() // normalize IANA string using uppercase so 'UTC'
  )
}

export interface TimeZoneImpl extends TimeZoneOps {
  getTransition(epochNano: DayTimeNano, direction: -1 | 1): DayTimeNano | undefined
}

// Fixed
// -------------------------------------------------------------------------------------------------

export class FixedTimeZoneImpl implements TimeZoneImpl {
  constructor(
    public offsetNano: number,
    public id: string = formatOffsetNano(offsetNano)
  ) {}

  getOffsetNanosecondsFor(epochNano: DayTimeNano): number {
    return this.offsetNano
  }

  getPossibleInstantsFor(isoDateTimeFields: IsoDateTimeFields): DayTimeNano[] {
    return [
      addDayTimeNanoAndNumber(
        isoToEpochNano(isoDateTimeFields)!,
        -this.offsetNano,
      )
    ]
  }

  getTransition(epochNano: DayTimeNano, direction: -1 | 1): DayTimeNano | undefined {
    return undefined // hopefully minifier will remove
  }
}

// Intl
// -------------------------------------------------------------------------------------------------

interface IntlTimeZoneStore {
  getPossibleEpochSec: (zonedEpochSec: number) => number[]
  getOffsetSec: (epochSec: number) => number
  getTransition: (epochSec: number, direction: -1 | 1) => number | undefined
}

export class IntlTimeZoneImpl implements TimeZoneImpl {
  id: string
  store: IntlTimeZoneStore

  constructor(id: string) {
    const format = buildIntlFormat(id)
    this.id = format.resolvedOptions().timeZone // TODO: less calling of .resolvedOptions()
    this.store = createIntlTimeZoneStore(createComputeOffsetSec(format))
  }

  getOffsetNanosecondsFor(epochNano: DayTimeNano): number {
    return this.store.getOffsetSec(epochNanoToSec(epochNano)) * nanoInSec
  }

  getPossibleInstantsFor(isoDateTimeFields: IsoDateTimeFields): DayTimeNano[] {
    const [zonedEpochSec, subsecNano] = isoToEpochSec(isoDateTimeFields)

    return this.store.getPossibleEpochSec(zonedEpochSec).map((epochSec) => {
      return addDayTimeNanoAndNumber(numberToDayTimeNano(epochSec, nanoInSec), subsecNano)
    })
  }

  /*
  exclusive for both directions
  */
  getTransition(epochNano: DayTimeNano, direction: -1 | 1): DayTimeNano | undefined {
    const [epochSec, subsecNano] = epochNanoToSecRemainder(epochNano)
    const resEpochSec = this.store.getTransition(
      epochSec + ((direction > 0 || subsecNano) ? 1 : 0),
      direction,
    )

    if (resEpochSec !== undefined) {
      return numberToDayTimeNano(resEpochSec, nanoInSec)
    }
  }
}

function createIntlTimeZoneStore(
  computeOffsetSec: (epochSec: number) => number,
): IntlTimeZoneStore {
  const getSample = createLazyGenerator(computeOffsetSec) // always given startEpochSec/endEpochSec
  const getSplit = createLazyGenerator(createSplitTuple)
  let minTransition = minPossibleTransition
  let maxTransition = maxPossibleTransition

  function getPossibleEpochSec(zonedEpochSec: number): number[] {
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

  function getOffsetSec(epochSec: number): number {
    const clampedEpochSec = clampNumber(epochSec, minTransition, maxTransition)
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
  function getTransition(epochSec: number, direction: -1 | 1): number | undefined {
    const clampedEpochSec = clampNumber(epochSec, minTransition, maxTransition)
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
        (offsetSec = (
          forEpochSec < split[0]
            ? startOffsetSec
            : forEpochSec >= split[1]
              ? endOffsetSec
              : undefined
        )) === undefined
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

function createSplitTuple(startEpochSec: number, endEpochSec: number): [number, number] {
  return [startEpochSec, endEpochSec]
}

function computePeriod(epochSec: number): [number, number] {
  const startEpochSec = Math.floor(epochSec / periodDur) * epochSec
  const endEpochSec = startEpochSec + periodDur
  return [startEpochSec, endEpochSec]
}

function createComputeOffsetSec(format: Intl.DateTimeFormat): (
  (epochSec: number) => number
) {
  return (epochSec: number) => {
    const intlParts = hashIntlFormatParts(format, epochSec * milliInSec)
    const zonedEpochSec = isoArgsToEpochSec(
      parseIntlYear(intlParts, isoCalendarId).year,
      parseInt(intlParts.month),
      parseInt(intlParts.day),
      parseInt(intlParts.hour),
      parseInt(intlParts.minute),
      parseInt(intlParts.second),
    )
    return zonedEpochSec - epochSec
  }
}

function buildIntlFormat(timeZoneId: string): Intl.DateTimeFormat {
  // format will ALWAYS do gregorian. need to parse year
  return new OrigDateTimeFormat(standardLocaleId, {
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
