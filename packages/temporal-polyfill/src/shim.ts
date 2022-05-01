import { DateTimeFormat, Temporal, toTemporalInstant } from './internals'

// TODO: better way to extend already-polyfilled rootObj

export default function(): void {
  if (!globalThis.Temporal) {
    globalThis.Temporal = Temporal
    Intl.DateTimeFormat = DateTimeFormat
    // eslint-disable-next-line no-extend-native
    Date.prototype.toTemporalInstant = toTemporalInstant
  }
}
