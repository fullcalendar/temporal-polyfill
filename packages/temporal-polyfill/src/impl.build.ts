import type * as Spec from 'temporal-spec'
import { toTemporalInstant as toTemporalInstantImpl } from './native/date'
import { DateTimeFormat } from './native/intlTemporal'
import { Temporal as TemporalImpl } from './public/temporal'

export const Temporal: typeof Spec.Temporal = TemporalImpl
export const Intl: typeof Spec.Intl = { ...globalThis.Intl, DateTimeFormat }
export const toTemporalInstant = toTemporalInstantImpl
