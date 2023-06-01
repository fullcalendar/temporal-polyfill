import { DateTimeFormat, Temporal, toTemporalInstant } from './index'
import { defineProps } from './util'

defineProps(globalThis, { Temporal })
defineProps(Intl, { DateTimeFormat })
defineProps(Date.prototype, { toTemporalInstant })
