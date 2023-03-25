import { createWeakMap } from '../utils/obj'

// weird to have this here
// to prevent circular reference
export const formatFactoryFactorySymbol = Symbol()

// Functions

export function needReceiver<Obj>(
  ObjClass: { new(...constructorArgs: any[]): Obj },
  arg: Obj,
): void {
  if (!(arg instanceof ObjClass)) {
    throw new TypeError('Invalid receiver')
  }
}

export function ensureObj<Obj, ObjArg, OtherArgs extends any[]>(
  ObjClass: {
    new(...constructorArgs: any[]): Obj
    from(fromArg: ObjArg, ...otherArgs: OtherArgs): Obj
  },
  arg: ObjArg,
  ...otherArgs: OtherArgs
): Obj {
  if (arg instanceof ObjClass) {
    return arg
  }
  return ObjClass.from(arg, ...otherArgs)
}

// Mixins
// use this technique instead of class inheritance because spec demands no intermediate prototypes

export interface JsonMethods {
  toJSON(): string
}

export function mixinJsonMethods<Obj extends JsonMethods>(
  ObjClass: { new(...constructorArgs: any[]): Obj },
): void {
  class JsonMixin {
    toJSON(this: Obj) {
      needReceiver(ObjClass, this)
      return String(this) // better than .toString, looks at [Symbol.toPrimitive]
    }
  }
  Object.defineProperty(ObjClass.prototype, 'toJSON', {
    value: JsonMixin.prototype.toJSON,
    writable: true,
    configurable: true,
  })
}

export interface NoValueMethods extends JsonMethods {
  valueOf(): never
}

export function mixinNoValueMethods<Obj extends NoValueMethods>(
  ObjClass: { new(...constructorArgs: any[]): Obj },
): void {
  mixinJsonMethods(ObjClass)

  class NoValueMixin {
    valueOf(this: Obj): never {
      needReceiver(ObjClass, this)
      throw new Error('Cannot convert object using valueOf')
    }
  }
  Object.defineProperty(ObjClass.prototype, 'valueOf', {
    value: NoValueMixin.prototype.valueOf,
    writable: true,
    configurable: true,
  })
}

export interface IsoMasterMethods<ISOFields> extends NoValueMethods {
  getISOFields(): ISOFields
}

const [getISOFields, setISOFields] = createWeakMap<IsoMasterMethods<unknown>, any>()
export { getISOFields }

export function mixinIsoMasterMethods<ISOFields, Obj extends IsoMasterMethods<ISOFields>>(
  ObjClass: { new(...constructorArgs: any[]): Obj },
): void {
  mixinNoValueMethods(ObjClass)

  class IsoMasterMixin {
    getISOFields(this: Obj) {
      needReceiver(ObjClass, this)
      return getISOFields(this)
    }
  }
  Object.defineProperty(ObjClass.prototype, 'getISOFields', {
    value: IsoMasterMixin.prototype.getISOFields,
    writable: true,
    configurable: true,
  })
}

// must be called from constructor
export function initIsoMaster<ISOFields>(
  obj: IsoMasterMethods<ISOFields>,
  isoFields: ISOFields,
): void {
  setISOFields(obj, Object.freeze(isoFields))
}
