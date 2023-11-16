import { defineProps } from './internal/utils'
import { DateTimeFormat, Temporal, toTemporalInstant } from './impl'

defineProps(globalThis, { Temporal })
defineProps(Intl, { DateTimeFormat })
defineProps(Date.prototype, { toTemporalInstant })
