import { IsoTimeFields, isoTimeFieldDefaults } from '../internal/calendarIsoFields'
import { hasAllPropsByName } from '../internal/utils'

// public
import { PlainTimeArg, toPlainTimeSlots } from './plainTime'

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

// kill?
export function optionalToPlainTimeFields(timeArg: PlainTimeArg | undefined): IsoTimeFields {
  return timeArg === undefined ? isoTimeFieldDefaults : toPlainTimeSlots(timeArg)
}
