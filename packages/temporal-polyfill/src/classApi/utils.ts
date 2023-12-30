import { IsoTimeFields } from '../internal/calendarIsoFields'
import { hasAllPropsByName } from '../internal/utils'
import { PlainTimeArg, toPlainTimeSlots } from './plainTime'

export function createProtocolChecker(
  propNames: string[]
) {
  propNames = propNames
    .concat('id')
    .sort()

  return (obj: any) => {
    if (!hasAllPropsByName(obj, propNames)) {
      throw new TypeError('Invalid protocol')
    }
  }
}

export function optionalToPlainTimeFields(timeArg: PlainTimeArg | undefined): IsoTimeFields | undefined {
  return timeArg === undefined ? undefined : toPlainTimeSlots(timeArg)
}
