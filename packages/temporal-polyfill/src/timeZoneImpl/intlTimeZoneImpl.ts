import { hashIntlFormatParts, normalizeShortEra } from '../dateUtils/intlFormat'
import { epochSecondsToISOYear, isoToEpochMilli, isoYearToEpochSeconds } from '../dateUtils/isoMath'
import { milliInSecond, secondsInDay } from '../dateUtils/units'
import { compareValues, numSign } from '../utils/math'
import { PossibleOffsetInfo, RawTransition, TimeZoneImpl } from './timeZoneImpl'

const MAX_YEAR_TRAVEL = 5
const ISLAND_SEARCH_DAYS = [
  182, // 50% through year
  91, // 25% through year
  273, // 75% through year
]

export class IntlTimeZoneImpl extends TimeZoneImpl {
  private format: Intl.DateTimeFormat

  // a cache of second offsets at the last second of each year
  private yearEndOffsets: { [year: string]: number }

  private transitionsInYear: { [year: string]: RawTransition[] }

  constructor(id: string) {
    const format = new Intl.DateTimeFormat('en-GB', { // gives 24-hour clock
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
    this.transitionsInYear = {}
  }

  // `zoneSecs` is like epochSecs, but to zone's pseudo-epoch
  getPossibleOffsets(zoneSecs: number): PossibleOffsetInfo {
    const prevTransition = this.getTransition(zoneSecs, -1)
    const nextTransition = this.getTransition(zoneSecs, 1)
    const anyTransition = prevTransition || nextTransition

    // determine if overall named timezone has a positive or negative leaning.
    // even with DST, if the offsets are +00:00 and +01:00, will be positive.
    // if unable to compute, will set to zero.
    const zoneLean = anyTransition ? numSign(anyTransition[1] + anyTransition[2]) : 0

    const relevantTransition = zoneLean > 0 ? nextTransition : prevTransition
    // If transition in the relevant direction, use the offset of the future/past year
    if (!relevantTransition) {
      const utcYear = epochSecondsToISOYear(zoneSecs) + zoneLean
      return [this.getYearEndOffset(utcYear), 0]
    }

    // try the two different hypotheses for the offset
    const [transitionEpochSecs, offsetSecsBefore, offsetSecsDiff] = relevantTransition
    const offsetSecsAfter = offsetSecsBefore + offsetSecsDiff
    const epochSecs0 = zoneSecs + offsetSecsBefore
    const epochSecs1 = zoneSecs + offsetSecsAfter

    // both are before the transition, use the offset before
    if (epochSecs0 < transitionEpochSecs && epochSecs1 < transitionEpochSecs) {
      return [offsetSecsBefore, 0]
    }
    // both are after the transition, use the offset after
    if (epochSecs0 >= transitionEpochSecs && epochSecs1 >= transitionEpochSecs) {
      return [offsetSecsAfter, 0]
    }
    // otherwise, we're stuck within a transition
    return [offsetSecsBefore, offsetSecsDiff]
  }

  /*
  NOTE: if Intl.DateTimeFormat's timeZoneName:'shortOffset' option were available,
  we could parse that.
  */
  getOffset(epochSecs: number): number {
    const map = hashIntlFormatParts(this.format, epochSecs * milliInSecond)
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

    return zoneSecs - epochSecs
  }

  getTransition(epochSecs: number, direction: -1 | 1): RawTransition | undefined {
    const startYear = epochSecondsToISOYear(epochSecs)

    for (let yearTravel = 0; yearTravel < MAX_YEAR_TRAVEL; yearTravel++) {
      const year = startYear + yearTravel * direction
      const transitions = this.getTransitionsInYear(year)
      const len = transitions.length
      const startIndex = direction < 0 ? len - 1 : 0

      for (let travel = 0; travel < len; travel++) {
        const transition = transitions[startIndex + travel * direction]

        // does the current transition overtake epochSecs in the direction of travel?
        if (compareValues(transition[0], epochSecs) === direction) {
          return transition
        }
      }
    }
  }

  private getYearEndOffset(utcYear: number): number {
    const { yearEndOffsets } = this
    return yearEndOffsets[utcYear] ||
      (yearEndOffsets[utcYear] = this.getOffset(
        isoYearToEpochSeconds(utcYear + 1) - 1,
      ))
  }

  private getTransitionsInYear(utcYear: number): RawTransition[] {
    const { transitionsInYear } = this
    return transitionsInYear[utcYear] ||
      (transitionsInYear[utcYear] = this.computeTransitionsInYear(utcYear))
  }

  private computeTransitionsInYear(utcYear: number): RawTransition[] {
    const enteringOffset = this.getYearEndOffset(utcYear - 1)
    const exitingOffset = this.getYearEndOffset(utcYear)
    const startSecs = isoYearToEpochSeconds(utcYear - 1)
    const endSecs = isoYearToEpochSeconds(utcYear)

    if (enteringOffset !== exitingOffset) {
      return [this.searchTransition(startSecs, endSecs, enteringOffset, exitingOffset)]
    }

    const island = this.searchIsland(enteringOffset, startSecs)
    if (island !== undefined) {
      return [
        this.searchTransition(startSecs, island[0], enteringOffset, island[1]),
        this.searchTransition(island[0], endSecs, island[1], exitingOffset),
      ]
    }

    return []
  }

  // assumes the offset changes at some point between startSecs -> endSecs.
  // finds the point where it switches over to the new offset.
  private searchTransition(
    startEpochSecs: number,
    endEpochSecs: number,
    startOffsetSecs: number,
    endOffsetSecs: number,
  ): RawTransition {
    // keep doing binary search until start/end are 1 second apart
    while (endEpochSecs - startEpochSecs > 1) {
      const middleEpochSecs = Math.floor(startEpochSecs + (endEpochSecs - startEpochSecs) / 2)
      const middleOffsetSecs = this.getOffset(middleEpochSecs)

      if (middleOffsetSecs === startOffsetSecs) {
        // middle is same as start. move start to the middle
        startEpochSecs = middleEpochSecs
      } else {
        // middle is same as end. move end to the middle
        endEpochSecs = middleEpochSecs
      }
    }
    return [
      endEpochSecs,
      startOffsetSecs, // caller could have computed this
      endOffsetSecs - startOffsetSecs, // same
    ]
  }

  // assumes the offset is the same at startSecs and endSecs.
  // pokes around the time in-between to see if there's a temporary switchover.
  private searchIsland(
    outerOffsetSecs: number,
    startEpochSecs: number,
  ): [number, number] | undefined { // [epochSecs, offsetSecs]
    for (const days of ISLAND_SEARCH_DAYS) {
      const epochSecs = startEpochSecs + days * secondsInDay
      const offsetSecs = this.getOffset(epochSecs)
      if (offsetSecs !== outerOffsetSecs) {
        return [epochSecs, offsetSecs]
      }
    }
  }
}
