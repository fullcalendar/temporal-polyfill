import { isoCalendarId } from './calendarConfig'
import { parseIntlYear } from './intlMath'
import { DayTimeNano, addDayTimeNanoAndNumber, numberToDayTimeNano } from './dayTimeNano'
import { OrigDateTimeFormat, hashIntlFormatParts, standardLocaleId } from './intlFormat'
import { IsoDateTimeFields } from './isoFields'
import { formatOffsetNano } from './isoFormat'
import {
  checkEpochNanoInBounds,
  epochNanoToSec,
  epochNanoToSecRemainder,
  isoArgsToEpochSec,
  isoToEpochNanoWithOffset,
  isoToEpochSec
} from './timeMath'
import { parseOffsetNanoMaybe } from './isoParse'
import { milliInSec, nanoInSec, secInDay } from './units'
import { capitalize, clampNumber, compareNumbers, createLazyGenerator } from './utils'

export const utcTimeZoneId = 'UTC'

const periodDur = secInDay * 60
const minPossibleTransition = isoArgsToEpochSec(1847)
const maxPossibleTransition = isoArgsToEpochSec(/*@__PURE__*/ getCurrentYearPlus10())

function getCurrentYearPlus10() {
  return new Date().getUTCFullYear() + 10
}

export interface NativeTimeZone { // TODO: rename to NativeTimeZoneOps?
  getOffsetNanosecondsFor(epochNano: DayTimeNano): number
  getPossibleInstantsFor(isoFields: IsoDateTimeFields): DayTimeNano[]
  getTransition(epochNano: DayTimeNano, direction: -1 | 1): DayTimeNano | undefined
}

// Query
// -------------------------------------------------------------------------------------------------

export function resolveTimeZoneId(id: string): string {
  const spirit = getTimeZoneSpirit(id)
  return typeof spirit === 'number'
    ? formatOffsetNano(spirit)
    : (spirit ? normalizeNamedTimeZoneId(id) : utcTimeZoneId)
}

export function getTimeZoneComparator(slotId: string): string | number {
  const spirit = getTimeZoneSpirit(slotId)
  return typeof spirit === 'number'
    ? spirit
    : (spirit ? spirit.resolvedOptions().timeZone : utcTimeZoneId)
}

export const queryNativeTimeZone = createLazyGenerator((slotId: string): NativeTimeZone => {
  const spirit = getTimeZoneSpirit(slotId)
  return typeof spirit === 'object'
    ? new IntlTimeZone(spirit)
    : new FixedTimeZone(spirit || 0)
})

function getTimeZoneSpirit(
  id: string // id or slotId
): number | Intl.DateTimeFormat | undefined { // undefined means utcTimeZoneId
  const offsetNano = parseOffsetNanoMaybe(id, true) // onlyHourMinute=true
  if (offsetNano !== undefined) {
    return offsetNano
  }
  if (id.toUpperCase() !== utcTimeZoneId) {
    return queryFormatForTimeZone(id) // case-agnostic
  }
}

function normalizeNamedTimeZoneId(s: string): string {
  const lower = s.toLowerCase()
  const parts = lower.split('/')

  return parts.map((part, partI) => {
    // abbreviation-like (big parts, like 'ACT' in 'Australia/ACT')
    // OR numeric-offset-like
    // OR Pacific/YAP
    if ((part.length <= 3 || part.match(/\d/)) && !part.match(/etc|yap/)) {
      return part.toUpperCase()
    }

    return part.replace(/baja|dumont|[a-z]+/g, (a, i) => {
      // abbreviation-like (small parts)
      // - starts with 1-or-2-letters?
      // - Knox_IN, NZ-CHAT
      if (a.length <= 2 && !partI || a === 'in' || a === 'chat') {
        return a.toUpperCase()
      }

      // word-like
      if (a.length > 2 || !i) {
        return capitalize(a).replace(/island|noronha|murdo|rivadavia|urville/, capitalize)
      }

      // lowercase (au/of/es)
      return a
    })
  }).join('/')
}

// Fixed
// -------------------------------------------------------------------------------------------------

export class FixedTimeZone implements NativeTimeZone {
  constructor(
    public offsetNano: number,
  ) {}

  getOffsetNanosecondsFor(epochNano: DayTimeNano): number {
    return this.offsetNano
  }

  getPossibleInstantsFor(isoDateTimeFields: IsoDateTimeFields): DayTimeNano[] {
    return [
      isoToEpochNanoWithOffset(isoDateTimeFields, this.offsetNano)
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

export class IntlTimeZone implements NativeTimeZone {
  store: IntlTimeZoneStore

  constructor(format: Intl.DateTimeFormat) {
    this.store = createIntlTimeZoneStore(createComputeOffsetSec(format))
  }

  getOffsetNanosecondsFor(epochNano: DayTimeNano): number {
    return this.store.getOffsetSec(epochNanoToSec(epochNano)) * nanoInSec
  }

  getPossibleInstantsFor(isoFields: IsoDateTimeFields): DayTimeNano[] {
    const [zonedEpochSec, subsecNano] = isoToEpochSec(isoFields)

    return this.store.getPossibleEpochSec(zonedEpochSec).map((epochSec) => {
      return checkEpochNanoInBounds(
        addDayTimeNanoAndNumber(numberToDayTimeNano(epochSec, nanoInSec), subsecNano)
      )
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
  const startEpochSec = Math.floor(epochSec / periodDur) * periodDur
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

const queryFormatForTimeZone = createLazyGenerator(createFormatForTimeZone)

function createFormatForTimeZone(timeZoneId: string): Intl.DateTimeFormat {
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
