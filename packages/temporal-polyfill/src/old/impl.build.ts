import type * as Spec from 'temporal-spec'
import { toTemporalInstant as toTemporalInstantImpl } from './native/date'
import { DateTimeFormat } from './native/intlTemporal'
import { Temporal as TemporalImpl } from './public/temporal'
import { getGlobalThis } from './utils/dom'

export const Temporal: typeof Spec.Temporal = TemporalImpl
export const Intl: typeof Spec.Intl = { ...getGlobalThis().Intl, DateTimeFormat }
export const toTemporalInstant = toTemporalInstantImpl
