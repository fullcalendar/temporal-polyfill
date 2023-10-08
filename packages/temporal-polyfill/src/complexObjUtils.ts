import { hasAllPropsByName } from './utils'

// Complex Objects with IDs
// -------------------------------------------------------------------------------------------------

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
