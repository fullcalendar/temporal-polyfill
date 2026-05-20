import { toTemporalInstant } from '../classApiFull/instant'
import { DateTimeFormat } from '../classApiFull/intlDateTimeFormat'
import { Temporal } from '../classApiFull/temporal'
import { createPropDescriptors } from '../internal/utils'

Object.defineProperties(globalThis, createPropDescriptors({ Temporal }))
Object.defineProperties(Intl, createPropDescriptors({ DateTimeFormat }))
Object.defineProperties(
  Date.prototype,
  createPropDescriptors({ toTemporalInstant }),
)
