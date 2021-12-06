import {
  DISAMBIG_EARLIER,
  DISAMBIG_LATER,
  DISAMBIG_REJECT,
  parseDisambigOption,
} from '../argParse/disambig'
import { extractTimeZone, isTimeZoneArgBag } from '../argParse/timeZone'
import { AbstractObj, ensureObj } from '../dateUtils/abstract'
import { createDateTime } from '../dateUtils/dateTime'
import { formatOffsetISO } from '../dateUtils/isoFormat'
import { epochNanoToISOFields, isoFieldsToEpochMins } from '../dateUtils/isoMath'
import { tryParseDateTimeISO } from '../dateUtils/parse'
import {
  nanoInMicroBI,
  nanoInMilliBI,
  nanoInMinute,
  nanoInMinuteBI,
  nanoInSecondBI,
} from '../dateUtils/units'
import { TimeZoneImpl } from '../timeZoneImpl/timeZoneImpl'
import { queryTimeZoneImpl } from '../timeZoneImpl/timeZoneImplQuery'
import { createWeakMap } from '../utils/obj'
import { Calendar, createDefaultCalendar } from './calendar'
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
    setImpl(this, queryTimeZoneImpl(id))
  }

  static from(arg: TimeZoneArg): TimeZone {
    if (typeof arg === 'object') {
      if (isTimeZoneArgBag(arg)) {
        return extractTimeZone(arg)
      } else {
        return arg as TimeZone // treat TimeZoneProtocols as TimeZones internally
      }
    }
    const dateTimeParse = tryParseDateTimeISO(String(arg))
    return new TimeZone(
      (dateTimeParse && (
        dateTimeParse.timeZone ||
        (dateTimeParse.offset !== undefined && formatOffsetISO(dateTimeParse.offset))
      )) || arg, // consider arg the literal time zone ID string
    )
  }

  get id(): string { return getImpl(this).id }

  getOffsetStringFor(instantArg: InstantArg): string {
    return formatOffsetISO(this.getOffsetNanosecondsFor(instantArg))
  }

  getOffsetNanosecondsFor(instantArg: InstantArg): number {
    const instant = ensureObj(Instant, instantArg)
    return getImpl(this).getOffset(
      Number(instant.epochNanoseconds / nanoInMinuteBI),
    ) * nanoInMinute
  }

  getPlainDateTimeFor(
    instantArg: InstantArg,
    calendarArg: CalendarArg = createDefaultCalendar(),
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
      const disambig = parseDisambigOption(options)
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
    BigInt(epochMinutes) * nanoInMinuteBI + (
      otherISOFields
        // TODO: use a common util for this?
        ? BigInt(otherISOFields.isoSecond) * nanoInSecondBI +
          BigInt(otherISOFields.isoMillisecond) * nanoInMilliBI +
          BigInt(otherISOFields.isoMicrosecond) * nanoInMicroBI +
          BigInt(otherISOFields.isoNanosecond)
        : 0n
    ),
  )
}
