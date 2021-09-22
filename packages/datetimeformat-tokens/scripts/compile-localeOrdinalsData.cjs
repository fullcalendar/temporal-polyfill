const { writeFileSync } = require('fs')
const { resolve } = require('path')
const { getAllLocalesData } = require('../../../scripts/lib/localesList.cjs')

const ordinals = {}

for (const [locale, { ordinal }] of Object.entries(getAllLocalesData())) {
  if (ordinal) {
    const existingKey = Object.keys(ordinals).find((key) => {
      return ordinals[key] === ordinal
    })

    if (existingKey) {
      ordinals[`${existingKey}|${locale}`] = ordinal
      delete ordinals[existingKey]
    } else {
      ordinals[locale] = ordinal
    }
  }
}

writeFileSync(resolve('src/localeOrdinalsData.ts'), templateCode(ordinals), {
  encoding: 'utf8',
  flag: 'w',
})

console.log('Wrote localeOrdinalsData.ts')

function templateCode(obj) {
  return `/* eslint-disable */
export const localeOrdinalsData = ${JSON.stringify(obj, null, 2)}
`
}
