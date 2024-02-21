import { createPropDescriptors } from '../internal/utils'
import { DateTimeFormat } from './intlDateTimeFormat'

export const IntlExtended = Object.defineProperties(
  Object.create(Intl),
  createPropDescriptors({ DateTimeFormat }),
)
