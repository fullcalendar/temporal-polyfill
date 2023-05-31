import { mapHash } from '../utils/obj'
import { strictInstanceOf } from './cast'
import { identityFunc, noop } from './lang'
import { createGetterDescriptors, createPropDescriptors } from './obj'

export const internalsMap = new WeakMap()
export const getInternals = internalsMap.get.bind(internalsMap)

// TODO: rename to 'wrapper' class?

export function createInternalClass(
  getters,
  methods,
  constructorToInternals = identityFunc,
  extraPrototypeDescriptors = {},
  staticMembers = {},
  handleInstance = noop,
) {
  function InternalObj(...args) {
    internalsMap.set(this, constructorToInternals(...args))
    handleInstance(this)
  }

  function curryMethod(method) {
    return /* Object.setPrototypeOf( */ function(...args) {
      if (!(this instanceof InternalObj)) {
        throw new TypeError('Invalid receiver')
      }
      return method.call(this, getInternals(this), ...args)
    } /* , null) */
  }

  Object.defineProperties(InternalObj.prototype, {
    ...createGetterDescriptors(mapHash(getters, curryMethod)),
    ...createPropDescriptors(mapHash(methods, curryMethod)),
    ...extraPrototypeDescriptors,
  })

  Object.defineProperties(InternalObj, createPropDescriptors(staticMembers))

  return InternalObj
}

export function neverValueOf() {
  throw new TypeError('Cannot convert object using valueOf')
}

export function transformInternalMethod(transformRes, methodName) {
  return (impl, ...args) => {
    return transformRes(impl[methodName](...args))
  }
}

export function returnId(internals) {
  return internals.id
}

export const internalIdGetters = { id: returnId }

export function createInternalGetter(Class) {
  return (res) => getInternals(strictInstanceOf(Class), res)
}
