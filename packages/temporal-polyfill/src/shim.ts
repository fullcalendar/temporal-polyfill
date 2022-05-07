import { toTemporalInstant } from './native/date'
import { DateTimeFormat } from './native/intlTemporal'
import { Temporal } from './public/temporal'
import { NanoWrap, ensureNanoWrap } from './utils/nanoWrap'

// TODO: better way to extend already-polyfilled rootObj

export function shim(): void {
  if (!globalThis.Temporal) {
    globalThis.Temporal = Temporal
    Intl.DateTimeFormat = DateTimeFormat
    // eslint-disable-next-line no-extend-native
    Date.prototype.toTemporalInstant = toTemporalInstant
  }

  (globalThis as any).NanoWrap = NanoWrap
  ;(globalThis as any).ensureNanoWrap = ensureNanoWrap
}
