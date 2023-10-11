import { IsoTimeFields, isoTimeFieldDefaults } from './isoFields'
import { PlainTimeArg, toPlainTimeSlots } from './plainTime'
import { hasAllPropsByName } from './utils'

export function createProtocolChecker(
  propNames: string[]
) {
  propNames = propNames.concat('id')
  propNames.sort() // TODO: order matters?

  return (obj: any) => {
    if (!hasAllPropsByName(obj, propNames)) {
      throw new TypeError('Invalid protocol')
    }
  }
}

export function optionalToPlainTimeFields(timeArg: PlainTimeArg | undefined): IsoTimeFields {
  return timeArg === undefined ? isoTimeFieldDefaults : toPlainTimeSlots(timeArg)
}
