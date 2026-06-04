import { readFileSync, readdirSync } from 'fs'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

// Get localeRoot relative to this file
const localeRoot = resolve(fileURLToPath(import.meta.url), '../../../locales')

export function listLocales() {
  const localeList = readdirSync(localeRoot)

  // Error out if no locales
  if (localeList.length === 0) {
    console.error('Locales have not been generated')
    process.exit()
  }

  return localeList
}

export function getAllLocalesData() {
  const obj = {}

  for (const fileName of listLocales()) {
    const json = JSON.parse(
      readFileSync(resolve(localeRoot, fileName), {
        encoding: 'utf8',
      }),
    )

    obj[fileName.replace('.json', '')] = json
  }

  return obj
}

/**
 * Creates a map of locales with a property as keys
 * @param getProp {(locale: string, json: unknown) => string} Function to fetch property from json
 */
export function mapLocaleProperty(
  getProp = (locale) => locale,
) {
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
