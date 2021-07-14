import { existsSync, readdirSync } from 'fs'
import { readFile, writeFile } from 'fs/promises'
import { resolve } from 'path'
import { merge } from './lib/deepmerge.mjs'

const momentLocaleRoot = resolve(process.argv[1], '..', 'data/moment/locale')
const fullcalendarLocaleRoot = resolve(
  process.argv[1],
  '..',
  'data/fullcalendar/packages/core/src/locales'
)

const verbose = process.argv.includes('-v')

const writeLocale = async (localeStr) => {
  // Used for specific parsing nuances, intlStr represents the locale with the suffix capitalized
  const [prefix, suffix] = localeStr.split('-')
  const intlStr = suffix ? `${prefix}-${suffix.toUpperCase()}` : prefix

  let localeData = {}

  // Get File Content for Moment
  const momentContent = await readFile(
    resolve(momentLocaleRoot, `${localeStr}.js`),
    { encoding: 'utf8' }
  ).catch(() => {
    if (verbose) {
      console.error(`'${intlStr}' does not exist in Moment`)
    }
  })

  if (momentContent) {
    // First Day and Minimal Days
    const matchfirstDay = momentContent.match(/dow:\s*(\d)/)
    const matchMinimalDays = momentContent.match(/doy:\s*(\d)/)

    localeData = merge(localeData, {
      week: {
        // Moment has 0-based firstDays, need to convert to 1-based
        firstDay: matchfirstDay ? parseInt(matchfirstDay[1]) + 1 : 1,
        minimalDays: matchMinimalDays ? parseInt(matchMinimalDays[1]) : 6,
      },
    })

    // Ordinals
    const matchOrdinal = momentContent.match(
      /ordinal: (?:(function)|'%d(\S*)',)\s/
    )

    if (matchOrdinal) {
      if (matchOrdinal[1] === 'function') {
        if (verbose) {
          console.error(`Ordinals for '${intlStr}' are not handled by Moment`)
        }
      } else {
        localeData.ordinal = matchOrdinal[2]
      }
    }
  }

  // Get File Content for FullCalendar
  const fullcalendarContent = await readFile(
    resolve(fullcalendarLocaleRoot, `${localeStr}.ts`),
    { encoding: 'utf8' }
  ).catch(() => {
    if (verbose) {
      console.error(
        `'${intlStr}' does not exist in FullCalendar, direction value will be 'null'`
      )
    }
  })

  // FullCalendar file overwrite
  if (fullcalendarContent) {
    // Direction
    const directionMatch = fullcalendarContent.match(
      /direction:\s*['"](ltr|rtl)['"]/
    )

    localeData = merge(localeData, {
      text: {
        direction: directionMatch ? directionMatch[1] : 'ltr',
      },
    })
  }

  const workspaceLocalePath = resolve(
    process.argv[1],
    '../../locales',
    `${intlStr}.json`
  )

  // Read existing file if it exists
  if (existsSync(workspaceLocalePath)) {
    const workspaceContent = JSON.parse(
      await readFile(workspaceLocalePath, { encoding: 'utf8' })
    )

    // Merge into localeData
    localeData = merge(workspaceContent, localeData)
  }

  // Ensure properties exist (Lowest fallback layer)
  const emptyData = {
    text: {
      direction: null,
    },
    week: {
      firstDay: null,
      minimalDays: null,
    },
    ordinal: null,
  }
  localeData = merge(emptyData, localeData)

  // Write to file
  await writeFile(
    resolve(process.argv[1], '../../locales', `${intlStr}.json`),
    JSON.stringify(localeData, null, 2),
    { encoding: 'utf8', flag: 'w' }
  )

  if (verbose) {
    console.log(`Wrote Locale '${intlStr}'.`)
  }
}

// Read in arguments
let locales =
  process.argv[process.argv.length - 1] &&
  process.argv[process.argv.length - 1] !== 'all' &&
  process.argv[process.argv.length - 1] !== '-v'
    ? process.argv[2]?.split(',')
    : undefined

// Case of All
if (!locales) {
  const momentLocaleArr = readdirSync(momentLocaleRoot).map((val) => {
    return val.replace('.js', '')
  })
  const fullcalendarLocaleArr = readdirSync(fullcalendarLocaleRoot).map(
    (val) => {
      return val.replace('.ts', '')
    }
  )

  // Remove duplicates
  locales = [...new Set(momentLocaleArr, fullcalendarLocaleArr)]

  // If the array is empty, it means submodules weren't checked out
  if (locales.length === 0) {
    console.error('Please check out Git Submodules')
    process.exit()
  }
}

// Iterate through array, setting off async functions
let promiseArr = []

for (const localeStr of locales) {
  promiseArr = [...promiseArr, writeLocale(localeStr)]
}

Promise.allSettled(promiseArr).then(() => {
  console.log('Completed scraping of Moment and Fullcalendar Locale files.')
})
