#!/usr/bin/env node

const { existsSync, readdirSync } = require('fs')
const { readFile, writeFile } = require('fs/promises')
const { resolve } = require('path')
const merge = require('deepmerge')
const yargs = require('yargs')
const { hideBin } = require('yargs/helpers')

require('colors')
const args = yargs(hideBin(process.argv)).boolean('v').argv

const momentLocaleRoot = resolve(args.$0, '../data/moment/locale')
const fullcalendarLocaleRoot = resolve(args.$0, '../data/fullcalendar/packages/core/src/locales')

async function writeLocale(localeStr) {
  // Used for specific parsing nuances, intlStr represents the locale with the suffix capitalized
  const [prefix, suffix] = localeStr.split('-')
  const intlStr = suffix ? `${prefix}-${suffix.toUpperCase()}` : prefix

  let localeData = {}

  // Get File Content for Moment
  const momentContent = await readFile(
    resolve(momentLocaleRoot, `${localeStr.toLowerCase()}.js`),
    { encoding: 'utf8' },
  ).catch(() => {
    if (args.v) {
      console.error(`'${intlStr}' does not exist in ${'Moment'.bold}`.red)
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
      /ordinal:\s*(?:(function)|['"]%d(\S*)['"],)\s/,
    )

    if (matchOrdinal) {
      if (matchOrdinal[1] === 'function') {
        if (args.v) {
          console.error(
            `'${intlStr}' ordinals are not handled by ${'Moment'.bold}`.red,
          )
        }
      } else {
        localeData.ordinal = matchOrdinal[2]
      }
    }
  }

  // Get File Content for FullCalendar
  const fullcalendarContent = await readFile(
    resolve(fullcalendarLocaleRoot, `${localeStr.toLowerCase()}.ts`),
    { encoding: 'utf8' },
  ).catch(() => {
    if (args.v) {
      console.error(`'${intlStr}' does not exist in ${'FullCalendar'.bold}`.red)
    }
  })

  // FullCalendar file overwrite
  if (fullcalendarContent) {
    // Direction
    const directionMatch = fullcalendarContent.match(
      /direction:\s*['"](ltr|rtl)['"]/,
    )

    localeData = merge(localeData, {
      text: {
        direction: directionMatch ? directionMatch[1] : 'ltr',
      },
    })
  }

  const workspaceLocalePath = resolve(
    args.$0,
    '../locales',
    `${intlStr}.json`,
  )

  // Read existing file if it exists
  if (existsSync(workspaceLocalePath)) {
    const workspaceContent = JSON.parse(
      await readFile(workspaceLocalePath, { encoding: 'utf8' }),
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
    resolve(args.$0, '../locales', `${intlStr}.json`),
    JSON.stringify(localeData, null, 2),
    { encoding: 'utf8', flag: 'w' },
  )

  if (args.v) {
    console.log(`${'Wrote Locale:'.bgGreen} '${intlStr}'`.blue)
  }
}

// Read in arguments
let locales = args._[0] !== 'all' ? args._[0]?.split(',') : undefined

// Case of All
if (!locales) {
  const momentLocaleArr = readdirSync(momentLocaleRoot).map((val) => {
    return val.replace('.js', '')
  })
  const fullcalendarLocaleArr = readdirSync(fullcalendarLocaleRoot).map(
    (val) => {
      return val.replace('.ts', '')
    },
  )

  // Remove duplicates
  locales = [...new Set(momentLocaleArr, fullcalendarLocaleArr)]

  // If the array is empty, it means submodules weren't checked out
  if (locales.length === 0) {
    console.error('Please check out Git Submodules'.red)
    process.exit()
  }
}

// Iterate through array, setting off async functions
const promiseArr = []

for (const localeStr of locales) {
  promiseArr.push(writeLocale(localeStr))
}

Promise.allSettled(promiseArr).then(() => {
  console.log(
    `Completed scraping of ${'Moment'.bold} and ${
      'Fullcalendar'.bold
    } Locale files.`.green,
  )
})
