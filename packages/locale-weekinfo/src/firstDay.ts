/* eslint-disable */

export const getFirstDay = (locale: string): number => {
  if (locale.match(/^((?:ar-DZ|ar-KW|ar-SA|bn|bo|en|es-MX|es-US|fr-CA|gom-DEVA|gom-LATN|gu|he|hi|id|ja|kn|ko|lo|ml|mn|mr|ne|pa-IN|pt-BR|si|ta|te|th|zh-HK|zh-MO|zh-TW)(?:-\w{2})?)$/)) {
    return 1
  } else if (locale.match(/^((?:ar|fa|ku|tzm)(?:-\w{2})?)$/)) {
    return 7
  } else if (locale.match(/^((?:dv)(?:-\w{2})?)$/)) {
    return 8
  }

  return 2
}
