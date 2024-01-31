import * as errorMessages from '../internal/errorMessages'
import { IsoTimeFields } from '../internal/isoFields'
import { hasAllPropsByName } from '../internal/utils'
import { PlainTimeArg, toPlainTimeSlots } from './plainTime'
import { getSlots } from './slotClass'

// TODO: return type
export function createProtocolValidator(propNames: string[]): any {
  propNames = propNames.concat('id').sort()

  return (obj: any) => {
    if (!hasAllPropsByName(obj, propNames)) {
      throw new TypeError(errorMessages.invalidProtocol)
    }
    return obj
  }
}

// Input-processing
// -----------------------------------------------------------------------------

export function optionalToPlainTimeFields(
  timeArg: PlainTimeArg | undefined,
): IsoTimeFields | undefined {
  return timeArg === undefined ? undefined : toPlainTimeSlots(timeArg)
}

export function rejectInvalidBag<B>(bag: B): B {
  if (
    getSlots(bag) ||
    (bag as any).calendar !== undefined ||
    (bag as any).timeZone !== undefined
  ) {
    throw new TypeError(errorMessages.invalidBag)
  }
  return bag
}
