import * as Native from './native/duration'
import { Temporal } from './nativeSwitch'
import * as Shim from './shim/duration'

export const create = Temporal ? Native.create : Shim.create
export const fromFields = Temporal ? Native.fromFields : Shim.fromFields
export const fromString = Temporal ? Native.fromString : Shim.fromString
export const sign = Temporal ? Native.sign : Shim.sign
export const blank = Temporal ? Native.blank : Shim.blank
export const withFields = Temporal ? Native.withFields : Shim.withFields
export const negated = Temporal ? Native.negated : Shim.negated
export const abs = Temporal ? Native.abs : Shim.abs
export const add = Temporal ? Native.add : Shim.add
export const subtract = Temporal ? Native.subtract : Shim.subtract
export const round = Temporal ? Native.round : Shim.round
export const total = Temporal ? Native.total : Shim.total
export const compare = Temporal ? Native.compare : Shim.compare
export const toLocaleString = Temporal
  ? Native.toLocaleString
  : Shim.toLocaleString
export const toString = Temporal ? Native.toString : Shim.toString
