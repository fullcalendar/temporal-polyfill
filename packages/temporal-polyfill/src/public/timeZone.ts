import { Temporal } from 'temporal-spec'
import { parseDisambigOption } from '../argParse/disambig'
import { isObjectLike } from '../argParse/refine'
import { timeZoneFromObj } from '../argParse/timeZone'
import { AbstractObj, ensureObj } from '../dateUtils/abstract'
import { epochNanoSymbol, epochNanoToISOFields, isoFieldsToEpochNano } from '../dateUtils/epoch'
import { formatOffsetISO } from '../dateUtils/isoFormat'
import { attachStringTag } from '../dateUtils/mixins'
import { checkInvalidOffset } from '../dateUtils/offset'
import { tryParseZonedDateTime } from '../dateUtils/parse'
import { refineZonedObj } from '../dateUtils/parseRefine'
import { getInstantFor } from '../dateUtils/timeZone'
import { TimeZoneImpl } from '../timeZoneImpl/timeZoneImpl'
import { queryTimeZoneImpl } from '../timeZoneImpl/timeZoneImplQuery'
import { createWeakMap } from '../utils/obj'
import { Calendar, createDefaultCalendar } from './calendar'
import { Instant, InstantArg } from './instant'
import { PlainDateTime, PlainDateTimeArg, createDateTime } from './plainDateTime'

// FYI: the Temporal.TimeZoneLike type includes `string`
// unlike many other object types

const [getImpl, setImpl] = createWeakMap<TimeZone, TimeZoneImpl>()

export class TimeZone extends AbstractObj implements Temporal.TimeZone {
  constructor(id: string) {
    if (!id) {
      throw new RangeError('Invalid timezone ID')
    }
    super()
    setImpl(this, queryTimeZoneImpl(id))
  }

  static from(arg: Temporal.TimeZoneLike): Temporal.TimeZoneProtocol {
    if (isObjectLike(arg)) {
      return timeZoneFromObj(arg)
    }

    const parsed = tryParseZonedDateTime(String(arg))

    if (parsed) {
      if (parsed.timeZone) {
        const refined = refineZonedObj(parsed) // TODO: we don't need the calendar
        checkInvalidOffset(refined)
        return refined.timeZone
      } else if (parsed.Z) {
        return new TimeZone('UTC')
      } else if (parsed.offsetNanoseconds !== undefined) {
        return new TimeZone(formatOffsetISO(parsed.offsetNanoseconds))
      }
    }

    return new TimeZone(String(arg)) // consider arg the literal time zone ID string
  }

  get id(): string {
    return this.toString()
  }

  getOffsetStringFor(instantArg: InstantArg): string {
    return formatOffsetISO(this.getOffsetNanosecondsFor(instantArg))
  }

  getOffsetNanosecondsFor(instantArg: InstantArg): number {
    const instant = ensureObj(Instant, instantArg)
    return getImpl(this).getOffset(instant[epochNanoSymbol])
  }

  getPlainDateTimeFor(
    instantArg: InstantArg,
    calendarArg: Temporal.CalendarLike = createDefaultCalendar(),
  ): Temporal.PlainDateTime {
    const instant = ensureObj(Instant, instantArg)
    const isoFields = epochNanoToISOFields(
      instant[epochNanoSymbol].add(this.getOffsetNanosecondsFor(instant)),
    )
    return createDateTime({
      ...isoFields,
      calendar: ensureObj(Calendar, calendarArg),
    })
  }

  getInstantFor(
    dateTimeArg: PlainDateTimeArg,
    options?: Temporal.ToInstantOptions,
  ): Temporal.Instant {
    return getInstantFor(this, ensureObj(PlainDateTime, dateTimeArg), parseDisambigOption(options))
  }

  getPossibleInstantsFor(dateTimeArg: PlainDateTimeArg): Temporal.Instant[] {
    const isoFields = ensureObj(PlainDateTime, dateTimeArg).getISOFields()
    const zoneNano = isoFieldsToEpochNano(isoFields)
    const possibleOffsetNanos = getImpl(this).getPossibleOffsets(zoneNano)

    return possibleOffsetNanos.map((offsetNano) => (
      new Instant(zoneNano.sub(offsetNano))
    ))
  }

  getPreviousTransition(instantArg: InstantArg): Temporal.Instant | null {
    const instant = ensureObj(Instant, instantArg)
    const rawTransition = getImpl(this).getTransition(instant[epochNanoSymbol], -1)
    if (rawTransition) {
      return new Instant(rawTransition[0])
    }
    return null
  }

  getNextTransition(instantArg: InstantArg): Temporal.Instant | null {
    const instant = ensureObj(Instant, instantArg)
    const rawTransition = getImpl(this).getTransition(instant[epochNanoSymbol], 1)
    if (rawTransition) {
      return new Instant(rawTransition[0])
    }
    return null
  }

  toString(): string {
    return getImpl(this).id
  }
}

// mixins
export interface TimeZone { [Symbol.toStringTag]: 'Temporal.TimeZone' }
attachStringTag(TimeZone, 'TimeZone')
