const { writeFileSync } = require('fs')
const { resolve } = require('path')
const { getAllLocalesData } = require('../../../scripts/lib/localesList.cjs')

const locales = getAllLocalesData()
const rtlArr = []

for (const locale in locales) {
  const direction = locales[locale].text.direction

  if (direction === 'rtl') {
    const prefix = locale.split('-')[0]

    // Checks if either value is a prefix or if the values direction is 'rtl'
    // as compared to the prefix's 'ltr'
    if (locale === prefix || locales[prefix].text.direction !== direction) {
      rtlArr.push(locale)
    }
  }
}

writeFileSync(resolve('src/direction.ts'), templateCode(rtlArr), {
  encoding: 'utf8',
  flag: 'w',
})

console.log('Wrote direction.ts')

function templateCode(arr) {
  return `
export function getDirection(locale: string): 'ltr' | 'rtl' {
  return locale.match(/^((?:${arr.join('|')})(?:-\\w{2})?)$/)
    ? 'rtl'
    : 'ltr'
}
`
}
