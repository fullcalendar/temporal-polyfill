/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { readdirSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

// Get localeRoot relative to this file
const localeRoot = resolve(fileURLToPath(import.meta.url), '../../../locales')

export const listLocales = () => {
  const localeList = readdirSync(localeRoot)

  // Error out if no locales
  if (localeList.length === 0) {
    console.error('Locales have not been generated')
    process.exit()
  }

  return localeList
}

export const getAllLocalesData = () => {
  const obj = {}

  for (const fileName of listLocales()) {
    const json = JSON.parse(
      readFileSync(resolve(localeRoot, fileName), {
        encoding: 'utf8',
      })
    )

    obj[fileName.replace('.json', '')] = json
  }

  return obj
}

/**
 * Creates a map of locales with a property as keys
 * @param getProp {(locale: string, json: unknown) => string} Function to fetch property from json
 */
export const mapLocaleProperty = (
  getProp = (locale) => {
    return locale
  }
) => {
  const obj = {}

  for (const [locale, json] of Object.entries(getAllLocalesData())) {
    const prop = getProp(locale, json)

    if (obj[prop]) {
      obj[prop].push(locale)
    } else {
      obj[prop] = [locale]
    }
  }

  return obj
}
