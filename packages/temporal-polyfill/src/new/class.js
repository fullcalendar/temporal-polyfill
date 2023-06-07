import { DateTimeFormat } from './intlFormat'
import { strictInstanceOf } from './options'
import {
  createGetterDescriptors, createPropDescriptors, createTemporalNameDescriptors,
  defineProps,
  identityFunc,
  isObjectLike,
  mapProps,
  noop,
} from './util'

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

// TODO: make a versoin that casts the id to string? For adapters
export const internalIdGetters = { id: returnId }

// TODO: createStrictInternalGetter
export function getStrictInternals(Class) {
  return (res) => getInternals(strictInstanceOf(Class), res)
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

    return (!argInternals && isObjectLike(arg) && bagToInternals(arg, options)) ||
      (handleUnusedOptions(options), argInternals || stringToInternals(toString(arg)))
  }

  function setTemporalName(instance) {
    temporaNameMap.set(instance, temporalName)
  }

  return [TemporalObj, createInstance, toInternals]
}

export function toLocaleStringMethod(internals, locales, options) {
  /*
  Will create two internal Intl.DateTimeFormats :(
  Create just one instead
  */
  const format = new DateTimeFormat(locales, options)
  return format.format(this)
}

// Adapter Utils
// -------------------------------------------------------------------------------------------------

// TODO: rethink this. too meta
export function createAdapterMethods() {

}
