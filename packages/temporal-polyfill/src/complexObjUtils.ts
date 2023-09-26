import { ensureString } from './cast'
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

export function getCommonInnerObj<
  P,
  K extends (keyof P & string),
  R extends (P[K] & { id: string })
>(
  propName: K,
  obj0: P,
  obj1: P,
): R {
  const internal0 = obj0[propName] as R
  const internal1 = obj1[propName] as R

  if (!isObjIdsEqual(internal0, internal1)) {
    throw new RangeError(`${propName} not equal`)
  }

  return internal0
}

export function isObjIdsEqual(
  obj0: { id: string },
  obj1: { id: string }
): boolean {
  return obj0 === obj1 || // short-circuit
    obj0.id === obj1.id // .id could be getter with logic / side-effects (during testing)
}

export function getObjId(obj: { id: string }): string {
  return obj.id
}

function getObjIdStrict(obj: { id: string }): string {
  return ensureString(obj.id)
}

// used anymore?
export const idGetters = { id: getObjId }
export const idGettersStrict = { id: getObjIdStrict }
