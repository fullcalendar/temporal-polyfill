import { DateTimeFormat } from './intlFormat'
import { ensureInstanceOf, toString } from './options'
import {
  createGetterDescriptors, createPropDescriptors, createTemporalNameDescriptors,
  defineProps,
  hasAllMatchingProps,
  identityFunc,
  isObjectlike,
  mapProps,
  noop,
} from './utils'

// Wrapper Class
// -------------------------------------------------------------------------------------------------

const internalsMap = new WeakMap()
export const getInternals = internalsMap.get.bind(internalsMap)

export function createWrapperClass(
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
    ...createGetterDescriptors(mapProps(getters, curryMethod)),
    ...createPropDescriptors(mapProps(methods, curryMethod)),
    ...extraPrototypeDescriptors,
  })

  defineProps(InternalObj, staticMembers)

  return InternalObj
}

export function getStrictInternals(Class, res) { // rename: getInternalsStrict?
  return getInternals(ensureInstanceOf(Class, res))
}

// Temporal Class
// -------------------------------------------------------------------------------------------------

const temporaNameMap = WeakMap()
export const getTemporalName = temporaNameMap.get.bind(temporaNameMap)

export function createTemporalClass(
  temporalName,
  constructorToInternals,
  internalsConversionMap,
  bagToInternals,
  stringToInternals,
  handleUnusedOptions,
  getters,
  methods,
  staticMembers = {},
) {
  methods.toJSON = function() {
    return String(this)
  }
  staticMembers.from = function(arg, options) {
    return createInstance(toInternals(arg, options))
  }

  const TemporalObj = createWrapperClass(
    getters,
    methods,
    constructorToInternals,
    createTemporalNameDescriptors(temporalName), // extraPrototypeDescriptors
    staticMembers,
    setTemporalName, // handleInstance
  )

  function createInstance(internals) {
    const instance = Object.create(TemporalObj.prototype)
    internalsMap.set(instance, internals)
    setTemporalName(instance)
    return instance
  }

  function toInternals(arg, options) {
    let argInternals = getInternals(arg)
    const argTemporalName = getTemporalName(arg)

    if (argInternals && argTemporalName !== temporalName) {
      argInternals = (internalsConversionMap[argTemporalName] || noop)(argInternals)
    }

    return (!argInternals && isObjectlike(arg) && bagToInternals(arg, options)) ||
      (handleUnusedOptions(options), argInternals || stringToInternals(toString(arg)))
  }

  function setTemporalName(instance) {
    temporaNameMap.set(instance, temporalName)
  }

  return [TemporalObj, createInstance, toInternals]
}

// Utils for Specific Classes
// -------------------------------------------------------------------------------------------------

export function toLocaleStringMethod(internals, locales, options) {
  /*
  Will create two internal Intl.DateTimeFormats :(
  Create just one instead
  */
  const format = new DateTimeFormat(locales, options)
  return format.format(this)
}

export function neverValueOf() {
  throw new TypeError('Cannot convert object using valueOf')
}

// Complex Objects with IDs
// -------------------------------------------------------------------------------------------------

export function createProtocolChecker(protocolMethods) {
  const propNames = Object.keys(protocolMethods)
  propNames.push('id')
  propNames.sort() // TODO: order matters?

  return (obj) => {
    if (!hasAllMatchingProps(obj, propNames)) {
      throw new TypeError('Invalid protocol')
    }
  }
}

export function getCommonInnerObj(propName, obj0, obj1) {
  const internal0 = obj0[propName]
  const internal1 = obj1[propName]

  if (!isObjIdsEqual(internal0, internal1)) {
    throw new TypeError(`${propName} not equal`)
  }

  return internal0
}

export function isObjIdsEqual(obj0, obj1) {
  return obj0 === obj1 || // short-circuit
    obj0.id === obj1.id // .id could be getter with logic / side-effects (during testing)
}

export function getObjId(internals) {
  return internals.id
}

function getObjIdStrict(internals) {
  return toString(internals.id)
}

export const idGetters = { id: getObjId }
export const idGettersStrict = { id: getObjIdStrict }
