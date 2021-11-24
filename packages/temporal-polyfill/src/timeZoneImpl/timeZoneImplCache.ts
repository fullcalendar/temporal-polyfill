import { tryParseOffsetNano } from '../dateUtils/parse'
import { nanoInMinute } from '../dateUtils/units'
import { FixedTimeZoneImpl } from './fixedTimeZoneImpl'
import { IntlTimeZoneImpl } from './intlTimeZoneImpl'
import { TimeZoneImpl } from './timeZoneImpl'

const implCache: { [zoneName: string]: TimeZoneImpl } = {
  UTC: new FixedTimeZoneImpl(0),
}

export function getTimeZoneImpl(id: string): TimeZoneImpl {
  const key = String(id).toLocaleUpperCase() // uppercase is better for 'UTC'

  if (implCache[key]) {
    return implCache[key]
  }

  const offsetNano = tryParseOffsetNano(id) // parse a literal time zone offset
  if (offsetNano != null) {
    return new FixedTimeZoneImpl( // don't store fixed-offset zones in cache
      Math.trunc(offsetNano / nanoInMinute), // convert to minutes
    )
  }

  return (implCache[key] = new IntlTimeZoneImpl(id))
}
