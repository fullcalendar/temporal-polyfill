/* eslint-disable */

export const getMinimalDays = (locale: string): number => {
  if (locale.match(/^((?:ar-kw|ar-ly|ar|dv|fa|ku|tzm-latn|tzm)(?:-\w{2})?)$/)) {
    return 1
  } else if (locale.match(/^((?:gom-deva|gom-latn)(?:-\w{2})?)$/)) {
    return 3
  } else if (locale.match(/^((?:af|ar-dz|ar-ma|ar-tn|bm|br|ca|cs|cy|da|de-at|de-ch|de|el|en-au|en-gb|en-ie|en-nz|en-sg|es-do|es-mx|es|et|fi|fil|fo|fr-ch|fr|fy|ga|gd|gl|hu|is|it-ch|it|km|lb|lt|lv|mi|mt|my|nb|nl-be|nl|nn|oc-lnc|pl|pt|ru|sd|se|sk|sq|ss|sv|tet|tl-ph|tlh|tzl|ur|vi|x-pseudo|yo|zh-cn)(?:-\w{2})?)$/)) {
    return 4
  } else if (locale.match(/^((?:az|be|bg|bs|cv|eo|eu|hr|hy-am|jv|ka|kk|ky|me|mk|ms-my|ms|ro|sl|sr-cyrl|sr|sw|tg|tk|tr|ug-cn|uk|uz-latn|uz)(?:-\w{2})?)$/)) {
    return 7
  }

  return 6
}
