import { DateTimeFormat } from './dateTimeFormat'
import { createInternalClass, getInternals, internalsMap } from './internalClass'
import { noop } from './lang'
import { createTemporalNameDescriptors, isObjectLike } from './obj'

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

  const TemporalObj = createInternalClass(
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
  const format = new DateTimeFormat(locales, options)
  return format.format(this)
}
