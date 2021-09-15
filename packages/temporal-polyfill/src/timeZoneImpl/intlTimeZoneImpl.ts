import { hashIntlFormatParts } from '../dateUtils/intlFormat'
import { epochMinsToISOYear, isoToEpochMilli, isoYearToEpochMins } from '../dateUtils/isoMath'
import { milliInMin } from '../dateUtils/units'
import { compareValues, numSign } from '../utils/math'
import { PossibleOffsetInfo, RawTransition, TimeZoneImpl } from './timeZoneImpl'

// [epochMins, offsetMinsDiff]
type YearTransition = [number, number]

const MAX_YEAR_TRAVEL = 5
const ISLAND_SEARCH_DAYS = [
  182, // 50% through year
  91, // 25% through year
  273, // 75% through year
]

export class IntlTimeZoneImpl implements TimeZoneImpl {
  public id: string
  private format: Intl.DateTimeFormat

  // a cache of minute offsets at the last minute of each year
  private yearEndOffsets: { [year: string]: number } = {}

  private yearTransitions: { [year: string]: YearTransition[] } = {}

  constructor(id: string) {
    this.format = new Intl.DateTimeFormat('en-GB', { // gives 24-hour clock
      era: 'narrow', // 'B' or 'A'
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      timeZone: id,
    })
    this.id = this.format.resolvedOptions().timeZone
  }

  // `zoneMinutes` is like epochMinutes, but to zone's pseudo-epoch
  getPossibleOffsets(zoneMinutes: number): PossibleOffsetInfo {
    const prevTransition = this.getTransition(zoneMinutes, -1)
    const nextTransition = this.getTransition(zoneMinutes, 1)
    const anyTransition = prevTransition || nextTransition

    // determine if overall named timezone has a positive or negative leaning.
    // even with DST, if the offsets are +00:00 and +01:00, will be positive.
    // if unable to compute, will set to zero.
    const zoneLean = anyTransition ? numSign(anyTransition[1] + anyTransition[2]) : 0

    const relevantTransition = zoneLean > 0 ? nextTransition : prevTransition
    // If transition in the relevant direction, use the offset of the future/past year
    if (!relevantTransition) {
      const utcYear = epochMinsToISOYear(zoneMinutes) + zoneLean
      return [this.getYearEndOffset(utcYear), 0]
    }

    // try the two different hypotheses for the offset
    const [transitionEpochMins, offsetMinsBefore, offsetMinsDiff] = relevantTransition
    const offsetMinsAfter = offsetMinsBefore + offsetMinsDiff
    const epochSecs0 = zoneMinutes + offsetMinsBefore
    const epochSecs1 = zoneMinutes + offsetMinsAfter

    // both are before the transition, use the offset before
    if (epochSecs0 < transitionEpochMins && epochSecs1 < transitionEpochMins) {
      return [offsetMinsBefore, 0]
    }
    // both are after the transition, use the offset after
    if (epochSecs0 >= transitionEpochMins && epochSecs1 >= transitionEpochMins) {
      return [offsetMinsAfter, 0]
    }
    // otherwise, we're stuck within a transition
    return [offsetMinsBefore, offsetMinsDiff]
  }

  /*
  NOTE: if Intl.DateTimeFormat's timeZoneName:'shortOffset' option were available,
  we could parse that.
  */
  getOffset(epochMins: number): number {
    const map = hashIntlFormatParts(this.format, epochMins * milliInMin)
    let year = parseInt(map.year)

    if (map.era === 'B') {
      year = -(year - 1)
    }

    const zoneMinutes = isoToEpochMilli(
      year,
      parseInt(map.month),
      parseInt(map.day),
      parseInt(map.hour),
      parseInt(map.minute),
    ) / (1000 * 60)

    return zoneMinutes - epochMins
  }

  getTransition(epochMins: number, direction: -1 | 1): RawTransition | undefined {
    const startYear = epochMinsToISOYear(epochMins)

    for (let yearTravel = 0; yearTravel < MAX_YEAR_TRAVEL; yearTravel++) {
      const year = startYear + yearTravel * direction
      const transitions = this.getYearTransitions(year)
      const len = transitions.length
      const startIndex = direction < 0 ? len - 1 : 0

      for (let travel = 0; travel < len; travel++) {
        const [transEpochMins, offsetMinsDiff] = transitions[startIndex + travel * direction]

        // does the current transition overtake epochMins in the direction of travel?
        if (compareValues(transEpochMins, epochMins) === direction) {
          return [
            transEpochMins,
            this.getYearEndOffset(year - 1),
            offsetMinsDiff,
          ]
        }
      }
    }
  }

  private getYearEndOffset(utcYear: number): number {
    const { yearEndOffsets } = this
    return yearEndOffsets[utcYear] ||
      (yearEndOffsets[utcYear] = this.getOffset(
        isoYearToEpochMins(utcYear + 1) - 1,
      ))
  }

  private getYearTransitions(utcYear: number): YearTransition[] {
    const { yearTransitions } = this
    return yearTransitions[utcYear] ||
      (yearTransitions[utcYear] = this.computeYearTransitions(utcYear))
  }

  private computeYearTransitions(utcYear: number): YearTransition[] {
    const enteringOffset = this.getYearEndOffset(utcYear - 1)
    const exitingOffset = this.getYearEndOffset(utcYear)
    const startMins = isoYearToEpochMins(utcYear - 1)
    const endMins = isoYearToEpochMins(utcYear)

    if (enteringOffset !== exitingOffset) {
      return [this.searchTransition(startMins, endMins, enteringOffset, exitingOffset)]
    }

    const island = this.searchIsland(enteringOffset, startMins)
    if (island != null) {
      return [
        this.searchTransition(startMins, island[0], enteringOffset, island[1]),
        this.searchTransition(island[0], endMins, island[1], exitingOffset),
      ]
    }

    return []
  }

  // assumes the offset changes at some point between startMins -> endMins.
  // finds the point where it switches over to the new offset.
  private searchTransition(
    startEpochMins: number,
    endEpochMins: number,
    startOffsetMin: number,
    endOffsetMins: number,
  ): YearTransition {
    // keep doing binary search until start/end are 1 minute apart
    while (endEpochMins - startEpochMins > 1) {
      const middleEpochMins = Math.floor(startEpochMins + (endEpochMins - startEpochMins) / 2)
      const middleOffsetMins = this.getOffset(middleEpochMins)

      if (middleOffsetMins === startOffsetMin) {
        // middle is same as start. move start to the middle
        startEpochMins = middleEpochMins
      } else {
        // middle is same as end. move end to the middle
        endEpochMins = middleOffsetMins
      }
    }
    return [endEpochMins, endOffsetMins]
  }

  // assumes the offset is the same at startMins and endMins.
  // pokes around the time in-between to see if there's a temporary switchover.
  private searchIsland(
    outerOffsetMins: number,
    startEpochMins: number,
  ): [number, number] | undefined { // [epochMins, offsetMins]
    for (const days of ISLAND_SEARCH_DAYS) {
      const epochMins = startEpochMins + days * 24 * 60
      const offsetMins = this.getOffset(epochMins)
      if (offsetMins !== outerOffsetMins) {
        return [epochMins, offsetMins]
      }
    }
  }
}
