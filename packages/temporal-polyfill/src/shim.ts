import { toTemporalInstant } from './native/date'
import { DateTimeFormat } from './native/intlTemporal'
import { Temporal } from './public/temporal'
import { getGlobalThis } from './utils/dom'

// TODO: better way to extend already-polyfilled rootObj
// somehow WRAP the whole lib, UMD-style?

export function shim(): void {
  const theGlobalThis = getGlobalThis()

  // TODO: when Temporal is in stage 4, make polyfill conditional
  // if (!theGlobalThis.Temporal) {

  theGlobalThis.Temporal = Temporal
  Intl.DateTimeFormat = DateTimeFormat
  // eslint-disable-next-line no-extend-native
  Date.prototype.toTemporalInstant = toTemporalInstant

  // }
}
