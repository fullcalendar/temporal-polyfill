import * as Spec from 'temporal-spec'
import {
  DateTimeFormat,
  Temporal as TemporalImpl,
  toTemporalInstant as toTemporalInstantImpl,
} from './internals'

export const Temporal: typeof Spec.Temporal = TemporalImpl
export const Intl: typeof Spec.Intl = { ...globalThis.Intl, DateTimeFormat }
export const toTemporalInstant = toTemporalInstantImpl
