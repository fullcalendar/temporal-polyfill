import { writeFileSync } from 'fs'
import { resolve } from 'path'
import { localesReduceAsync } from '../../../scripts/list-locales.mjs'

// localesReduceAsync((accum, locale, json) => {
//   return json.text.direction !== 'rtl'
//     ? accum // Leave as is if ltr or null
//     : `${accum !== '' ? `${accum}|` : ''}${locale}` // Format into string
// }).then((rtlLocales) => {
//   const code = `export const getDirection = (locale: string): 'ltr' | 'rtl' => {
//   return locale.match(/^(${rtlLocales})$/)
//     ? 'rtl'
//     : 'ltr'
// }
// `

//   writeFileSync(resolve('src/direction.ts'), code, {
//     encoding: 'utf8',
//     flag: 'w',
//   })
//   console.log('Wrote direction.ts')
// })

localesReduceAsync().then((locales) => {
  const rtlLocales = Object.keys(locales).reduce((accum, val) => {
    const direction = locales[val].text.direction

    if (direction === 'rtl') {
      const prefix = val.split('-')[0]
      const differentFromPrefix =
        val === prefix || locales[prefix].text.direction !== direction

      return differentFromPrefix
        ? `${accum !== '' ? `${accum}|` : ''}${val}`
        : accum
    }

    return accum
  }, '')
  console.log(rtlLocales)
  const code = `export const getDirection = (locale: string): 'ltr' | 'rtl' => {
  return locale.match(/^((?:${rtlLocales})-?\\w*)$/)
    ? 'rtl'
    : 'ltr'
}
`
  writeFileSync(resolve('src/direction.ts'), code, {
    encoding: 'utf8',
    flag: 'w',
  })
})
