import { epochNanoToISOYear, isoToEpochMilli, isoYearToEpochSeconds } from '../dateUtils/epoch'
import { hashIntlFormatParts, normalizeShortEra } from '../dateUtils/intlFormat'
import { milliInSecond, nanoInSecond, secondsInDay } from '../dateUtils/units'
import { OrigDateTimeFormat } from '../native/intlUtils'
import { LargeInt, compareLargeInts, createLargeInt } from '../utils/largeInt'
import { specialCases } from './specialCases'
import { RawTransition, TimeZoneImpl } from './timeZoneImpl'

const DST_EARLIEST_YEAR = 1847 // year with the first DST transitions
const DST_PERSIST_YEAR = new Date().getUTCFullYear() + 10 // DST won't change on or after this

const ISLAND_SEARCH_DAYS = [
  182, // 50% through year
  91, // 25% through year
  273, // 75% through year
]

// TODO: general question: why not use minutes internally instead of seconds?
// No... Temporal.ZonedDateTime.from({ year: 1971, month: 1, day: 1, timeZone: 'Africa/Monrovia' })
// .offset => '-00:44:30' // seconds

export class IntlTimeZoneImpl extends TimeZoneImpl {
  private format: Intl.DateTimeFormat

  // a cache of second offsets at the last second of each year
  private yearEndOffsets: { [year: string]: number }

  private transitionsInYear: { [year: string]: RawTransition[] }

  constructor(id: string) {
    const format = new OrigDateTimeFormat('en-GB', { // gives 24-hour clock
      era: 'short',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      timeZone: id,
    })
    super(format.resolvedOptions().timeZone)
    this.format = format
    this.yearEndOffsets = {}
    this.transitionsInYear = specialCases[id] || {}
  }

  // `zoneNano` is like epochNano, but from zone's pseudo-epoch
  getPossibleOffsets(zoneNano: LargeInt): number[] {
    let lastOffsetNano: number | undefined

    const transitions = [
      this.getTransition(zoneNano, -1),
      this.getTransition(zoneNano.sub(1), 1),
      // ^subtract 1 b/c getTransition is always exclusive
    ].filter(Boolean) as RawTransition[]

    // loop transitions from past to future
    for (const transition of transitions) {
      const [transitionEpochNano, offsetNanoBefore, offsetNanoAfter] = transition
      // FYI, a transition's switchover to offsetNanoAfter happens
      // *inclusively* as transitionEpochNano

      // two possibilities (no guarantee of chronology)
      const epochNanoA = zoneNano.sub(offsetNanoBefore)
      const epochNanoB = zoneNano.sub(offsetNanoAfter)

      // is the transition after both possibilities?
      if (
        compareLargeInts(transitionEpochNano, epochNanoA) > 0 && // >
        compareLargeInts(transitionEpochNano, epochNanoB) > 0 // >
      ) {
        return [offsetNanoBefore]

      // is the transition before both possibilities?
      } else if (
        compareLargeInts(transitionEpochNano, epochNanoA) <= 0 && // <=
        compareLargeInts(transitionEpochNano, epochNanoB) <= 0 // <=
      ) {
        // keep looping...

      // stuck in a transition?
      } else {
        // if the offset increases, we're inside a forward transition that looses an hour
        // return an empty result because zoneNano lives within this empty region
        if (offsetNanoBefore < offsetNanoAfter) {
          return []
        } else {
          return [offsetNanoBefore, offsetNanoAfter]
        }
      }

      lastOffsetNano = offsetNanoAfter
    }

    // only found transitions before zoneSecs
    if (lastOffsetNano !== undefined) {
      return [lastOffsetNano]
    }

    // found no transitions?
    return [
      this.getYearEndOffsetSec(epochNanoToISOYear(zoneNano)) * nanoInSecond,
    ]
  }

  getOffset(epochNano: LargeInt): number {
    return this.getOffsetForEpochSecs(
      epochNano.div(nanoInSecond).toNumber(),
    ) * nanoInSecond
  }

  private getOffsetForEpochSecs(epochSec: number): number {
    // NOTE: if Intl.DateTimeFormat's timeZoneName:'shortOffset' option were available,
    // we could parse that.
    const map = hashIntlFormatParts(this.format, epochSec * milliInSecond)

    let year = parseInt(map.year)
    if (normalizeShortEra(map.era) === 'bce') {
      year = -(year - 1)
    }

    const zoneMilli = isoToEpochMilli(
      year,
      parseInt(map.month),
      parseInt(map.day),
      parseInt(map.hour),
      parseInt(map.minute),
      parseInt(map.second),
    )
    const zoneSecs = Math.floor(zoneMilli / milliInSecond)

    return zoneSecs - epochSec
  }

  /*
  Always exclusive. Will never return a transition that starts exactly on epochNano
  */
  getTransition(epochNano: LargeInt, direction: -1 | 1): RawTransition | undefined {
    let year = epochNanoToISOYear(epochNano)

    if (year > DST_PERSIST_YEAR) {
      // look ahead or behind ONE year
      const res = this.getTransitionFrom(year, year + direction, direction, epochNano)
      if (res || direction > 0) {
        return res
      }
      // fast-backwards in-bounds
      year = DST_PERSIST_YEAR
    }

    return this.getTransitionFrom(
      Math.max(year, DST_EARLIEST_YEAR),
      direction < 0
        ? DST_EARLIEST_YEAR - 1 // inclusive -> exclusive
        : DST_PERSIST_YEAR,
      direction,
      epochNano,
    )
  }

  getTransitionFrom(
    year: number,
    endYear: number, // exclusive
    direction: -1 | 1,
    epochNano: LargeInt,
  ): RawTransition | undefined {
    for (; year !== endYear; year += direction) {
      let transitions = this.getTransitionsInYear(year)

      if (direction < 0) {
        transitions = transitions.slice().reverse()
      }

      for (const transition of transitions) {
        // does the current transition overtake epochNano in the direction of travel?
        if (compareLargeInts(transition[0], epochNano) === direction) {
          return transition
        }
      }
    }
  }

  private getYearEndOffsetSec(utcYear: number): number {
    const { yearEndOffsets } = this
    return yearEndOffsets[utcYear] ||
      (yearEndOffsets[utcYear] = this.getOffsetForEpochSecs(
        isoYearToEpochSeconds(utcYear + 1) - 1,
      ))
  }

  private getTransitionsInYear(utcYear: number): RawTransition[] {
    const { transitionsInYear } = this
    return transitionsInYear[utcYear] ||
      (transitionsInYear[utcYear] = this.computeTransitionsInYear(utcYear))
  }

  private computeTransitionsInYear(utcYear: number): RawTransition[] {
    const startOffsetSec = this.getYearEndOffsetSec(utcYear - 1) // right before start of year
    const endOffsetSec = this.getYearEndOffsetSec(utcYear) // at end of year
    // FYI, a transition could be in the first second of the year, thus the exclusiveness

    // TODO: make a isoYearEndEpochSeconds util? use in getYearEndOffsetSec?
    const startEpochSec = isoYearToEpochSeconds(utcYear) - 1
    const endEpochSec = isoYearToEpochSeconds(utcYear + 1) - 1

    if (startOffsetSec !== endOffsetSec) {
      return [this.searchTransition(startEpochSec, endEpochSec, startOffsetSec, endOffsetSec)]
    }

    const island = this.searchIsland(startOffsetSec, startEpochSec)
    if (island !== undefined) {
      return [
        this.searchTransition(startEpochSec, island[0], startOffsetSec, island[1]),
        this.searchTransition(island[0], endEpochSec, island[1], endOffsetSec),
      ]
    }

    return []
  }

  // assumes the offset changes at some point between startSecs -> endSecs.
  // finds the point where it switches over to the new offset.
  private searchTransition(
    startEpochSec: number,
    endEpochSec: number,
    startOffsetSec: number,
    endOffsetSec: number,
  ): RawTransition {
    // keep doing binary search until start/end are 1 second apart
    while (endEpochSec - startEpochSec > 1) {
      const middleEpochSecs = Math.floor(startEpochSec + (endEpochSec - startEpochSec) / 2)
      const middleOffsetSecs = this.getOffsetForEpochSecs(middleEpochSecs)

      if (middleOffsetSecs === startOffsetSec) {
        // middle is same as start. move start to the middle
        startEpochSec = middleEpochSecs
      } else {
        // middle is same as end. move end to the middle
        endEpochSec = middleEpochSecs
      }
    }
    return [
      createLargeInt(endEpochSec).mult(nanoInSecond),
      startOffsetSec * nanoInSecond,
      endOffsetSec * nanoInSecond,
    ]
  }

  // assumes the offset is the same at startSecs and endSecs.
  // pokes around the time in-between to see if there's a temporary switchover.
  private searchIsland(
    outerOffsetSec: number,
    startEpochSec: number,
  ): [number, number] | undefined { // [epochSec, offsetSec]
    for (const days of ISLAND_SEARCH_DAYS) {
      const epochSec = startEpochSec + days * secondsInDay
      const offsetSec = this.getOffsetForEpochSecs(epochSec)
      if (offsetSec !== outerOffsetSec) {
        return [epochSec, offsetSec]
      }
    }
  }
}
