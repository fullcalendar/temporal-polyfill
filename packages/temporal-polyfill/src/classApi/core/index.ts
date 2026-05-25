import { NativeTemporal } from '../../nativeSwitch'
import * as Impl from './implementation'

export const Temporal = NativeTemporal || Impl.Temporal

const IntlExport = NativeTemporal ? Intl : Impl.Intl
export { IntlExport as Intl }

export const toTemporalInstant = NativeTemporal
  ? (Date.prototype as any).toTemporalInstant
  : Impl.toTemporalInstant
