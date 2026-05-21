import { createPropDescriptors } from '../internal/utils'
import { DateTimeFormat } from './intlDateTimeFormat'

/*
An extended version of the Intl global namespace
*/
export const IntlExtended = Object.defineProperties(
  Object.create(Intl),
  createPropDescriptors({ DateTimeFormat }),
)
