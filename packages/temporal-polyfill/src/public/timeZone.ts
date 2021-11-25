import {
  DISAMBIG_EARLIER,
  DISAMBIG_LATER,
  DISAMBIG_REJECT,
  parseDisambig,
} from '../argParse/disambig'
import { extractTimeZone, isTimeZoneArgBag } from '../argParse/timeZone'
import { AbstractObj, ensureObj } from '../dateUtils/abstract'
import { createDateTime } from '../dateUtils/dateTime'
import { formatOffsetISO } from '../dateUtils/isoFormat'
import { epochNanoToISOFields, isoFieldsToEpochMins } from '../dateUtils/isoMath'
import { nanoInMicro, nanoInMilli, nanoInMinute, nanoInSecond } from '../dateUtils/units'
import { TimeZoneImpl } from '../timeZoneImpl/timeZoneImpl'
import { getTimeZoneImpl } from '../timeZoneImpl/timeZoneImplCache'
import { createWeakMap } from '../utils/obj'
import { Calendar, isoCalendar } from './calendar'
import { Instant } from './instant'
import { PlainDateTime } from './plainDateTime'
import {
  CalendarArg,
  DateTimeArg,
  DateTimeISOFields,
  Disambiguation,
  InstantArg,
  TimeZoneArg,
  TimeZoneProtocol,
} from './types'

const [getImpl, setImpl] = createWeakMap<TimeZone, TimeZoneImpl>()

export class TimeZone extends AbstractObj implements TimeZoneProtocol {
  constructor(id: string) {
    if (!id) {
      throw new Error('Invalid timezone ID')
    }
    super()
    setImpl(this, getTimeZoneImpl(id))
  }

  static from(arg: TimeZoneArg): TimeZone {
    if (typeof arg === 'object') {
      if (isTimeZoneArgBag(arg)) {
        return extractTimeZone(arg)
      } else {
        return arg as TimeZone // treat TimeZoneProtocols as TimeZones internally
      }
    }
    return new TimeZone(arg) // arg is a string
  }

  get id(): string { return getImpl(this).id }

  getOffsetStringFor(instantArg: InstantArg): string {
    return formatOffsetISO(this.getOffsetNanosecondsFor(instantArg))
  }

  getOffsetNanosecondsFor(instantArg: InstantArg): number {
    const instant = ensureObj(Instant, instantArg)
    return getImpl(this).getOffset(
      Number(instant.epochNanoseconds / BigInt(nanoInMinute)),
    ) * nanoInMinute
  }

  getPlainDateTimeFor(
    instantArg: InstantArg,
    calendarArg: CalendarArg = isoCalendar,
  ): PlainDateTime {
    const instant = ensureObj(Instant, instantArg)
    const isoFields = epochNanoToISOFields(
      instant.epochNanoseconds - BigInt(this.getOffsetNanosecondsFor(instant)),
    )
    return createDateTime({
      ...isoFields,
      calendar: ensureObj(Calendar, calendarArg),
    })
  }

  getInstantFor(dateTimeArg: DateTimeArg, options?: { disambiguation?: Disambiguation }): Instant {
    const isoFields = ensureObj(PlainDateTime, dateTimeArg).getISOFields()
    const zoneMins = isoFieldsToEpochMins(isoFields)
    let [offsetMins, offsetMinsDiff] = getImpl(this).getPossibleOffsets(zoneMins)

    if (offsetMinsDiff) {
      const disambig = parseDisambig(options?.disambiguation)
      if (disambig === DISAMBIG_REJECT) {
        throw new Error('Ambiguous offset')
      }
      if (disambig === DISAMBIG_EARLIER) {
        offsetMins += (offsetMinsDiff < 0 ? offsetMinsDiff : 0)
      } else if (disambig === DISAMBIG_LATER) {
        offsetMins += (offsetMinsDiff > 0 ? offsetMinsDiff : 0)
      }
      // Otherwise, 'compatible', which boils down to not using diff
    }

    return epochMinsToInstant(zoneMins + offsetMins, isoFields)
  }

  getPossibleInstantsFor(dateTimeArg: DateTimeArg): Instant[] {
    const isoFields = ensureObj(PlainDateTime, dateTimeArg).getISOFields()
    const zoneMins = isoFieldsToEpochMins(isoFields)
    const [offsetMinsBase, offsetMinsDiff] = getImpl(this).getPossibleOffsets(zoneMins)
    const instants: Instant[] = []

    // Since a negative diff means "forward" transition ("lost" an hour),
    // yield no results, because plainDateTime is stuck in this lost hour
    if (offsetMinsDiff >= 0) {
      instants.push(epochMinsToInstant(zoneMins + offsetMinsBase, isoFields))
      if (offsetMinsDiff > 0) {
        instants.push(epochMinsToInstant(zoneMins + offsetMinsBase + offsetMinsDiff, isoFields))
      }
    }

    return instants
  }

  getPreviousTransition(instantArg: InstantArg): Instant | null {
    const instant = ensureObj(Instant, instantArg)
    const rawTransition = getImpl(this).getTransition(Math.floor(instant.epochSeconds / 60), -1)
    if (rawTransition) {
      return epochMinsToInstant(rawTransition[0])
    }
    return null
  }

  getNextTransition(instantArg: InstantArg): Instant | null {
    const instant = ensureObj(Instant, instantArg)
    const rawTransition = getImpl(this).getTransition(Math.floor(instant.epochSeconds / 60), 1)
    if (rawTransition) {
      return epochMinsToInstant(rawTransition[0])
    }
    return null
  }

  toString(): string { return this.id }
}

function epochMinsToInstant(epochMinutes: number, otherISOFields?: DateTimeISOFields): Instant {
  return new Instant(
    BigInt(epochMinutes) * BigInt(nanoInMinute) +
    BigInt(
      otherISOFields
        ? otherISOFields.isoSecond * nanoInSecond +
          otherISOFields.isoMillisecond * nanoInMilli +
          otherISOFields.isoMicrosecond * nanoInMicro +
          otherISOFields.isoNanosecond
        : 0,
    ),
  )
}
