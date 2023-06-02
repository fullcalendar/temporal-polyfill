import { DateTimeFormat, Temporal, toTemporalInstant } from './impl'
import { defineProps } from './util'

defineProps(globalThis, { Temporal })
defineProps(Intl, { DateTimeFormat })
defineProps(Date.prototype, { toTemporalInstant })
