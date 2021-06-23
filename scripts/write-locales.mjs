import { readdirSync } from 'fs'
import { readFile, writeFile } from 'fs/promises'
import { resolve } from 'path'

const momentLocaleRoot = resolve(process.argv[1], '..', 'data/moment/locale')
const fullcalendarLocaleRoot = resolve(
  process.argv[1],
  '..',
  'data/fullcalendar/packages/core/src/locales'
)
const outputRoot = resolve(process.argv[1], '../../locales')

const parseValues = (str, add) => {
  let direction = null
  let firstDay = null
  let minimalDays = null

  // Early short circuit if no content
  if (!str) {
    return { text: { direction }, week: { firstDay, minimalDays } }
  }

  // Direction
  const directionMatch = str.match(/direction: (ltr|rtl)/)

  if (directionMatch) {
    direction = directionMatch[1]
  } else {
    direction = 'ltr'
  }

  // First Day
  const firstDayMatch = str.match(/dow: (\d)/)

  if (firstDayMatch) {
    firstDay = parseInt(firstDayMatch[1]) + (add?.firstDay ?? 0)
  }

  // Minimal Days
  const minimalDaysMatch = str.match(/doy: (\d)/)

  if (minimalDaysMatch) {
    minimalDays = parseInt(minimalDaysMatch[1]) + (add?.minimalDays ?? 0)
  }

  return { text: { direction }, week: { firstDay, minimalDays } }
}

const writeLocale = async (localeStr) => {
  // Get File Content for Moment
  const momentContent = await readFile(
    resolve(momentLocaleRoot, `${localeStr}.js`),
    { encoding: 'utf8' }
  ).catch(() => {
    console.error(`'${localeStr}' does not exist in Moment`)
  })

  let localeData = parseValues(momentContent, { firstDay: 1 }) // Moment is 0-based, need to convert to 1-based
  console.log(localeData)

  // Get File Content for FullCalendar
  const fullcalendarContent = await readFile(
    resolve(fullcalendarLocaleRoot, `${localeStr}.ts`),
    { encoding: 'utf8' }
  ).catch(() => {
    console.error(`'${localeStr}' does not exist in FullCalendar`)
    // If there's no FullCalendar file, make direction null so we know to fix it
    localeData.text.direction = null
  })

  // FullCalendar files will overwrite
  localeData = parseValues(fullcalendarContent)
  console.log(localeData)

  // Write to file
  await writeFile(
    resolve(outputRoot, `${localeStr}.json`),
    JSON.stringify(localeData),
    { encoding: 'utf8', flag: 'w' }
  )
  console.log(`Wrote Locale '${localeStr}'`)
  console.log()
}

// Read in arguments
const locales =
  process.argv[2] && process.argv[2] !== 'all'
    ? process.argv[2]?.split(',')
    : undefined

// Case of arguments
if (locales) {
  for (const localeStr of locales) {
    writeLocale(localeStr)
  }
}
// Case of All
else {
  const momentLocaleArr = readdirSync(momentLocaleRoot).map((val) => {
    return val.replace('.js', '')
  })
  const fullcalendarLocaleArr = readdirSync(fullcalendarLocaleRoot).map(
    (val) => {
      return val.replace('.ts', '')
    }
  )

  // Remove duplicates
  const combinedArr = [...new Set(momentLocaleArr, fullcalendarLocaleArr)]

  // If the array is empty, it means submodules weren't checked out
  if (combinedArr.length === 0) {
    console.error('Please check out Git Submodules')
    process.exit()
  }

  for (const localeStr of combinedArr) {
    writeLocale(localeStr)
  }
}
