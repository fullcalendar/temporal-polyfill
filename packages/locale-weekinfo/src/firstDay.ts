/* eslint-disable */

export const getFirstDay = (locale: string): number => {
  if (locale.match(/^((?:af|ar-ma|ar-tn|az|be|bg|bm|br|bs|ca|cs|cv|cy|da|de-at|de-ch|de|el|en-gb|en-ie|en-nz|en-sg|eo|es-do|es|et|eu|fi|fil|fo|fr-ch|fr|fy|ga|gd|gl|hr|hu|hy-am|is|it-ch|it|jv|ka|kk|km|ky|lb|lt|lv|me|mi|mk|ms-my|ms|mt|my|nb|nl-be|nl|nn|oc-lnc|pl|pt|ro|ru|sd|se|sk|sl|sq|sr-cyrl|sr|ss|sv|sw|tet|tg|tk|tl-ph|tlh|tr|tzl|ug-cn|uk|ur|uz-latn|uz|vi|x-pseudo|yo|zh-cn)(?:-\w{2})?)$/)) {
    return 2
  } else if (locale.match(/^((?:ar-ly|ar|fa|ku|tzm-latn|tzm)(?:-\w{2})?)$/)) {
    return 7
  } else if (locale.match(/^((?:dv)(?:-\w{2})?)$/)) {
    return 8
  }

  return 1
}
