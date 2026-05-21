import { DateTimeFormat } from '../apiHelpers/intlDateTimeFormat'
import { createPropDescriptors } from '../internal/utils'

/*
An extended version of the Intl global namespace
*/
export const IntlExtended = Object.defineProperties(
  Object.create(Intl),
  createPropDescriptors({ DateTimeFormat }),
)
