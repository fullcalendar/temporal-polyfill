/* eslint-disable */

import { Ordinals } from './ordinals'

const ordinals = {
  "cv": "-мӗш",
  "el": "η",
  "en": {
    "one": "st",
    "two": "nd",
    "few": "rd",
    "other": "th"
  },
  "eo": "a",
  "fa": "م",
  "fr": {
    "m": "er",
    "f": "re"
  },
  "es-DO|es-MX|es-US|es|gl|it-CH|it|mi|mt|pt-BR|pt": "º",
  "te": "వ",
  "bs|cs|da|de-AT|de-CH|de|et|eu|fi|fo|hr|hu|is|lb|lv|me|nb|nn|pl|se|sk|sl|sq|sr-CYRL|sr|tlh|tzl": "."
}

const expandOrdinals = (): { [key: string]: Ordinals } => {
  const obj = {}

  for (const key in ordinals) {
    const val = ordinals[key]

    for (const locale of key.split('|')) {
      obj[locale] = val
    }
  }

  return obj
}

export const localeOrdinals = expandOrdinals()
