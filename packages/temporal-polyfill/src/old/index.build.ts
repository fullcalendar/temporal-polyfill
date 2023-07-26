
/* CONDITIONAL, based on presence of native implementation. disable until Stage 4

import type * as Spec from 'temporal-spec'
import { getGlobalThis } from './utils/dom'
import {
  Intl as IntlImpl,
  Temporal as TemporalImpl,
  toTemporalInstant as toTemporalInstantImpl,
} from './impl'

const theGlobalThis = getGlobalThis()
const TemporalNative = theGlobalThis.Temporal

export const Temporal: typeof Spec.Temporal = TemporalNative || TemporalImpl
export const Intl: typeof Spec.Intl = TemporalNative
  ? (theGlobalThis.Intl as any) // because of DateTimeFormatOptions shortcoming temporal-spec/global
  : IntlImpl
export const toTemporalInstant = TemporalNative
  ? theGlobalThis.Date.prototype.toTemporalInstant
  : toTemporalInstantImpl
*/

export { Intl, Temporal, toTemporalInstant } from './impl'
