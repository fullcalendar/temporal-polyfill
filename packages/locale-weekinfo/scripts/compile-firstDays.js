import { writeFileSync } from 'fs'
import { resolve } from 'path'
import { mapLocaleProperty } from '../../../scripts/lib/locales-list.mjs'

const fdObj = mapLocaleProperty((_locale, json) => {
  return json.week.firstDay
})

const sortedFirstDays = Object.entries(fdObj).sort(([, a], [, b]) => {
  return b.length - a.length
})
const largest = sortedFirstDays[0][0]
const condArr = []

for (const [day, locales] of sortedFirstDays) {
  // Short circuit for largest firstDay
  if (day === largest) {
    continue
  }

  // Filter out locales that are the same as prefix
  const noRepeatLocales = locales.filter((val) => {
    const prefix = val.split('-')[0]
    return val === prefix || !locales.includes(prefix)
  })

  condArr.push(templateConditional(day, noRepeatLocales))
}

writeFileSync(resolve('src/firstDay.ts'), templateCode(condArr, largest), {
  encoding: 'utf8',
  flag: 'w',
})
console.log('Wrote firstDay.ts')

function templateCode(conditionals, largest) {
  return `/* eslint-disable */

export const getFirstDay = (locale: string): number => {
  ${conditionals.join('  } else ')}  }

  return ${largest}
}
`
}

function templateConditional(day, locales) {
  return `if (locale.match(/^((?:${locales.join('|')})(?:-\\w{2})?)$/)) {
    return ${day}
`
}
