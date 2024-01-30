import * as errorMessages from '../internal/errorMessages'
import { IsoTimeFields } from '../internal/isoFields'
import { hasAllPropsByName } from '../internal/utils'
import { PlainTimeArg, toPlainTimeSlots } from './plainTime'

// TODO: return type
export function createProtocolChecker(propNames: string[]) {
  propNames = propNames.concat('id').sort()

  return (obj: any) => {
    if (!hasAllPropsByName(obj, propNames)) {
      throw new TypeError(errorMessages.invalidProtocol)
    }
  }
}

export function optionalToPlainTimeFields(
  timeArg: PlainTimeArg | undefined,
): IsoTimeFields | undefined {
  return timeArg === undefined ? undefined : toPlainTimeSlots(timeArg)
}
