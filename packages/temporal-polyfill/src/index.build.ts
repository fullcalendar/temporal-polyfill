import * as Spec from 'temporal-spec'
import {
  Intl as IntlImpl,
  Temporal as TemporalImpl,
  toTemporalInstant as toTemporalInstantImpl,
} from './impl'

const TemporalNative = globalThis.Temporal
const IntlNative = globalThis.Intl as any
// `any` because of DateTimeFormatOptions shortcoming temporal-spec/global

export const Temporal: typeof Spec.Temporal = TemporalNative || TemporalImpl
export const Intl: typeof Spec.Intl = TemporalNative ? IntlNative : IntlImpl
export const toTemporalInstant = TemporalNative
  ? globalThis.Date.prototype.toTemporalInstant
  : toTemporalInstantImpl
