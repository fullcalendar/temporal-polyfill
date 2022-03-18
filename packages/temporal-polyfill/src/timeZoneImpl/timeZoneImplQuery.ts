import { formatOffsetISO } from '../dateUtils/isoFormat'
import { tryParseOffsetNano } from '../dateUtils/parse'
import { nanoInDay } from '../dateUtils/units'
import { FixedTimeZoneImpl } from './fixedTimeZoneImpl'
import { IntlTimeZoneImpl } from './intlTimeZoneImpl'
import { TimeZoneImpl } from './timeZoneImpl'

const implCache: { [zoneName: string]: TimeZoneImpl } = {
  UTC: new FixedTimeZoneImpl('UTC', 0),
}

export function queryTimeZoneImpl(id: string): TimeZoneImpl {
  id = String(id)
  const key = id.toLocaleUpperCase() // uppercase is better for 'UTC'

  if (implCache[key]) {
    return implCache[key]
  }

  // parse a literal time zone offset
  const offsetNano = tryParseOffsetNano(id)
  if (offsetNano !== undefined) {
    if (Math.abs(offsetNano) > nanoInDay) {
      throw new RangeError('Offset out of bounds')
    }
    // don't store fixed-offset zones in cache. there could be many
    return new FixedTimeZoneImpl(
      formatOffsetISO(offsetNano),
      offsetNano,
    )
  }

  return (implCache[key] = new IntlTimeZoneImpl(id))
}
