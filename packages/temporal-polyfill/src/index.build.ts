import type * as Spec from 'temporal-spec'
import {
  Intl as IntlImpl,
  Temporal as TemporalImpl,
  toTemporalInstant as toTemporalInstantImpl,
} from './impl'

const TemporalNative = globalThis.Temporal

export const Temporal: typeof Spec.Temporal = TemporalNative || TemporalImpl
export const Intl: typeof Spec.Intl = TemporalNative
  ? (globalThis.Intl as any) // because of DateTimeFormatOptions shortcoming temporal-spec/global
  : IntlImpl
export const toTemporalInstant = TemporalNative
  ? globalThis.Date.prototype.toTemporalInstant
  : toTemporalInstantImpl
