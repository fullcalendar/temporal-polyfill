import { LocaleId } from 'temporal-ponyfill/dist/utils'
import { localeOrdinals } from './localeOrdinals'
import { localOrdinalsSpecial } from './localeOrdinalsSpecial'

export type SymbolOrdinals = string

export type NumberOrdinals = {
  one: string
  two: string
  few: string
  other: string
}

export type SpecialOrdinals = {
  [key: string]: string
}

export type Ordinals = SymbolOrdinals | NumberOrdinals | SpecialOrdinals

export const isSymbolOrdinals = (
  ordinals: Ordinals
): ordinals is SymbolOrdinals => {
  return typeof ordinals === 'string'
}

export const isNumberOrdinals = (
  ordinals: Ordinals
): ordinals is NumberOrdinals => {
  if (typeof ordinals === 'string') {
    return false
  }
  const fakeNumberOrdinals = ordinals as NumberOrdinals
  return (
    typeof fakeNumberOrdinals.one === 'string' &&
    typeof fakeNumberOrdinals.two === 'string' &&
    typeof fakeNumberOrdinals.few === 'string' &&
    typeof fakeNumberOrdinals.other === 'string'
  )
}

export const isSpecialOrdinals = (
  ordinals: Ordinals
): ordinals is SpecialOrdinals => {
  return typeof ordinals === 'object' && !isNumberOrdinals(ordinals)
}

export const getOrdinalForValue = (
  num: number,
  unit: string,
  locale: LocaleId
): string => {
  // Use prefix as backup if specific locale cannot be found
  const prefix = locale.split('-')[0]
  const ordinals: Ordinals = localeOrdinals[locale] ?? localeOrdinals[prefix]

  // Short circuit to avoid PluralRules call in case of string
  if (isSymbolOrdinals(ordinals)) {
    return ordinals
  }

  // Gets one of 'one', 'two', 'few', 'many', 'other'
  const count = new Intl.PluralRules(locale, { type: 'ordinal' }).select(num)

  if (isSpecialOrdinals(ordinals)) {
    // In this case ordinals refers only to the data part
    // Use prefix as backup if specific locale cannot be found
    return (
      localOrdinalsSpecial[locale](ordinals, unit, count) ??
      localOrdinalsSpecial[prefix](ordinals, unit, count)
    )
  }

  // Default to a NumberOrdinal using PluralRules
  return ordinals[count]
}
