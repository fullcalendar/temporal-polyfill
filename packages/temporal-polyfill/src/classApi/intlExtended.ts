import { createPropDescriptors } from '../internal/utils'

/*
An extended version of the Intl global namespace
*/
export function createIntlExtended(DateTimeFormat: typeof Intl.DateTimeFormat) {
  return Object.defineProperties(
    Object.create(Intl),
    createPropDescriptors({ DateTimeFormat }),
  )
}
