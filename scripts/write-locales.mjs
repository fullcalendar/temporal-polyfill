import { readdirSync } from 'fs'
import { readFile, writeFile } from 'fs/promises'
import { resolve } from 'path'

const momentLocaleRoot = resolve(process.argv[1], '..', 'data/moment/locale')
const fullcalendarLocaleRoot = resolve(
  process.argv[1],
  '..',
  'data/fullcalendar/packages/core/src/locales'
)

const writeLocale = async (localeStr) => {
  let localeData = {
    text: { direction: null },
    week: { firstDay: null, minimalDays: null },
  }

  // Get File Content for Moment
  const momentContent = await readFile(
    resolve(momentLocaleRoot, `${localeStr}.js`),
    { encoding: 'utf8' }
  ).catch(() => {
    console.error(`'${localeStr}' does not exist in Moment`)
  })

  if (momentContent) {
    // First Day and Minimal Days
    const matchfirstDay = momentContent.match(/dow:\s*(\d)/)
    const matchMinimalDays = momentContent.match(/doy:\s*(\d)/)

    if (!matchfirstDay && !matchMinimalDays) {
      console.error(
        `Could not find moment values for '${localeStr}'. Skipping this locale.`
      )
      return
    }

    if (matchfirstDay) {
      // Moment is 0-based, need to convert to 1-based
      localeData.week.firstDay = parseInt(matchfirstDay[1]) + 1
    }

    if (matchMinimalDays) {
      // Moment is 0-based, need to convert to 1-based
      localeData.week.minimalDays = parseInt(matchMinimalDays[1]) + 1
    }
  }

  // Get File Content for FullCalendar
  const fullcalendarContent = await readFile(
    resolve(fullcalendarLocaleRoot, `${localeStr}.ts`),
    { encoding: 'utf8' }
  ).catch(() => {
    console.error(
      `'${localeStr}' does not exist in FullCalendar, direction value will be 'null'`
    )
  })

  // FullCalendar file overwrite
  if (fullcalendarContent) {
    // Direction
    const directionMatch = fullcalendarContent.match(
      /direction:\s*['"](ltr|rtl)['"]/
    )

    if (directionMatch) {
      localeData.text.direction = directionMatch[1]
    } else {
      localeData.text.direction = 'ltr'
    }
  }

  // Read existing file
  const temporalLiteContent = JSON.parse(
    await readFile(
      resolve(process.argv[1], '../../locales', `${localeStr}.json`),
      { encoding: 'utf8' }
    )
  )

  // Merge data together
  if (temporalLiteContent) {
    localeData = { ...temporalLiteContent, ...localeData }
  }

  // Write to file
  await writeFile(
    resolve(process.argv[1], '../../locales', `${localeStr}.json`),
    JSON.stringify(localeData, null, 2),
    { encoding: 'utf8', flag: 'w' }
  )
  console.log(`Wrote Locale '${localeStr}'.`)
}

// Read in arguments
let locales =
  process.argv[2] && process.argv[2] !== 'all'
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

// Iterate through array
for (const localeStr of locales) {
  writeLocale(localeStr)
}
