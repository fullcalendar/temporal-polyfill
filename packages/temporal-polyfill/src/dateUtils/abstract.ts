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

// Classes

export abstract class AbstractObj {
  abstract toString(): string

  toJSON(): string {
    return this.toString()
  }
}

export abstract class AbstractNoValueObj extends AbstractObj {
  valueOf(): never {
    throw new Error('Cannot convert object using valueOf')
  }
}

const [getISOFields, setISOFields] = createWeakMap<AbstractISOObj<unknown>, any>()

export abstract class AbstractISOObj<ISOFields> extends AbstractNoValueObj {
  constructor(isoFields: ISOFields) {
    super()
    setISOFields(this, Object.freeze(isoFields))
  }

  getISOFields(): ISOFields {
    return getISOFields(this)
  }
}
