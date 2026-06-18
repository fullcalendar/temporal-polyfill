
export function getMinimalDays(locale: string): number {
  if (locale.match(/^((?:ar-SA|bn|bo|en-CA|en-IL|en-IN|es-US|fr-CA|gu|he|hi|id|ja|kn|ko|lo|ml|mn|mr|ne|pa-IN|pt-BR|si|ta|te|th|zh-HK|zh-MO|zh-TW)(?:-\w{2})?)$/)) {
    return 6
  } else if (locale.match(/^((?:az|be|bg|bs|cv|eo|eu|hr|hy-AM|jv|ka|kk|ky|me|mk|ms|ro|sl|sr|sw|tg|tk|tr|ug-CN|uk|uz)(?:-\w{2})?)$/)) {
    return 7
  } else if (locale.match(/^((?:ar|dv|fa|ku|tzm)(?:-\w{2})?)$/)) {
    return 1
  } else if (locale.match(/^((?:gom-DEVA|gom-LATN)(?:-\w{2})?)$/)) {
    return 3
  }

  return 4
}
