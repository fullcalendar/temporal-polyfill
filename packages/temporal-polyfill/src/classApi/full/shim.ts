import { createPropDescriptors } from '../../internal/utils'
import { NativeTemporal } from '../../nativeSwitch'
import { toTemporalInstant } from './instant'
import { DateTimeFormat } from './intlDateTimeFormat'
import { Temporal } from './temporal'

export function installImplementation() {
  Object.defineProperties(globalThis, createPropDescriptors({ Temporal }))
  Object.defineProperties(Intl, createPropDescriptors({ DateTimeFormat }))
  Object.defineProperties(
    Date.prototype,
    createPropDescriptors({ toTemporalInstant }),
  )
}

export function install() {
  if (!NativeTemporal) {
    installImplementation()
  }
}
