import { createWeakMap } from '../utils/obj'

// weird to have this here
// to prevent circular reference
export const formatFactoryFactorySymbol = Symbol()

// Functions

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
  ObjClass: { prototype: Obj },
): void {
  ObjClass.prototype.toJSON = function(this: Obj) {
    return this.toString()
  }
}

export interface NoValueMethods extends JsonMethods {
  valueOf(): never
}

export function mixinNoValueMethods<Obj extends NoValueMethods>(
  ObjClass: { prototype: Obj },
): void {
  mixinJsonMethods(ObjClass)

  ObjClass.prototype.valueOf = function(this: Obj) {
    throw new Error('Cannot convert object using valueOf')
  }
}

export interface IsoMasterMethods<ISOFields> extends NoValueMethods {
  getISOFields(): ISOFields
}

const [getISOFields, setISOFields] = createWeakMap<IsoMasterMethods<unknown>, any>()

export function mixinIsoMasterMethods<ISOFields, Obj extends IsoMasterMethods<ISOFields>>(
  ObjClass: { prototype: Obj },
): void {
  mixinNoValueMethods(ObjClass)

  ObjClass.prototype.getISOFields = function(this: Obj) {
    return getISOFields(this)
  }
}

// must be called from constructor
export function initIsoMaster<ISOFields>(
  obj: IsoMasterMethods<ISOFields>,
  isoFields: ISOFields,
): void {
  setISOFields(obj, Object.freeze(isoFields))
}
