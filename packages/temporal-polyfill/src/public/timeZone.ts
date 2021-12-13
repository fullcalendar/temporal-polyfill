import {
  DISAMBIG_COMPATIBLE,
  DISAMBIG_EARLIER,
  DISAMBIG_REJECT,
  parseDisambigOption,
} from '../argParse/disambig'
import { extractTimeZone, isTimeZoneArgBag } from '../argParse/timeZone'
import { AbstractObj, ensureObj } from '../dateUtils/abstract'
import { createDateTime } from '../dateUtils/dateTime'
import { formatOffsetISO } from '../dateUtils/isoFormat'
import { epochNanoToISOFields, isoFieldsToEpochSecs } from '../dateUtils/isoMath'
import { tryParseDateTimeISO } from '../dateUtils/parse'
import {
  nanoInMicroBI,
  nanoInMilliBI,
  nanoInSecond,
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
  Disambiguation,
  InstantArg,
  TimeZoneArg,
  TimeZoneProtocol,
} from './types'

const [getImpl, setImpl] = createWeakMap<TimeZone, TimeZoneImpl>()

export class TimeZone extends AbstractObj implements TimeZoneProtocol {
  constructor(id: string) {
    if (!id) {
      throw new RangeError('Invalid timezone ID')
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
    return getImpl(this).getOffset(instant.epochSeconds) * nanoInSecond
  }

  getPlainDateTimeFor(
    instantArg: InstantArg,
    calendarArg: CalendarArg = createDefaultCalendar(),
  ): PlainDateTime {
    const instant = ensureObj(Instant, instantArg)
    const isoFields = epochNanoToISOFields(
      instant.epochNanoseconds + BigInt(this.getOffsetNanosecondsFor(instant)),
    )
    return createDateTime({
      ...isoFields,
      calendar: ensureObj(Calendar, calendarArg),
    })
  }

  getInstantFor(dateTimeArg: DateTimeArg, options?: { disambiguation?: Disambiguation }): Instant {
    const disambig = parseDisambigOption(options)
    const isoFields = ensureObj(PlainDateTime, dateTimeArg).getISOFields()
    const zoneSecs = isoFieldsToEpochSecs(isoFields)
    const possibleOffsetSecs = getImpl(this).getPossibleOffsets(zoneSecs)
    let offsetSecs: number

    if (possibleOffsetSecs.length === 1 || disambig === DISAMBIG_COMPATIBLE) {
      offsetSecs = possibleOffsetSecs[0]
    } else if (disambig === DISAMBIG_REJECT) {
      throw new RangeError('Ambiguous offset')
    } else {
      offsetSecs = Math[
        disambig === DISAMBIG_EARLIER
          ? 'max' // (results in an earlier epochNano, because offsetSecs is subtracted)
          : 'min' // DISAMBIG_LATER
      ](...(possibleOffsetSecs as [number, number]))
    }

    return epochSecsToInstant(zoneSecs - offsetSecs, isoFields)
  }

  getPossibleInstantsFor(dateTimeArg: DateTimeArg): Instant[] {
    const isoFields = ensureObj(PlainDateTime, dateTimeArg).getISOFields()
    const zoneSecs = isoFieldsToEpochSecs(isoFields)
    let possibleOffsetSecs = getImpl(this).getPossibleOffsets(zoneSecs)

    // A forward transition looses an hour.
    // dateTimeArg is stuck in this lost hour, so return not results
    if (
      possibleOffsetSecs.length === 2 &&
      possibleOffsetSecs[0] < possibleOffsetSecs[1]
    ) {
      possibleOffsetSecs = []
    }

    return possibleOffsetSecs.map((offsetSecs) => (
      epochSecsToInstant(zoneSecs + offsetSecs, isoFields)
    ))
  }

  getPreviousTransition(instantArg: InstantArg): Instant | null {
    const instant = ensureObj(Instant, instantArg)
    const rawTransition = getImpl(this).getTransition(instant.epochSeconds, -1)
    if (rawTransition) {
      return epochSecsToInstant(rawTransition[0])
    }
    return null
  }

  getNextTransition(instantArg: InstantArg): Instant | null {
    const instant = ensureObj(Instant, instantArg)
    const rawTransition = getImpl(this).getTransition(instant.epochSeconds, 1)
    if (rawTransition) {
      return epochSecsToInstant(rawTransition[0])
    }
    return null
  }

  toString(): string { return this.id }
}

function epochSecsToInstant(
  epochSecs: number,
  otherISOFields?: { isoMillisecond: number, isoMicrosecond: number, isoNanosecond: number },
): Instant {
  return new Instant(
    BigInt(epochSecs) * nanoInSecondBI + (
      otherISOFields
        // TODO: use a common util for this?
        ? BigInt(otherISOFields.isoMillisecond) * nanoInMilliBI +
          BigInt(otherISOFields.isoMicrosecond) * nanoInMicroBI +
          BigInt(otherISOFields.isoNanosecond)
        : 0n
    ),
  )
}
