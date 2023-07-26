import { DateTimeFormat, Temporal, toTemporalInstant } from './impl'
import { defineProps } from './utils'

defineProps(globalThis, { Temporal })
defineProps(Intl, { DateTimeFormat })
defineProps(Date.prototype, { toTemporalInstant })
