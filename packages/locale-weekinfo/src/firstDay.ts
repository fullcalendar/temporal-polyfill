/* eslint-disable */

export const getFirstDay = (locale: string): number => {
  if (locale.match(/^((?:af|ar-MA|ar-TN|az|be|bg|bm|br|bs|ca|cs|cv|cy|da|de-AT|de-CH|de|el|en-GB|en-IE|en-NZ|en-SG|eo|es-DO|es|et|eu|fi|fil|fo|fr-CH|fr|fy|ga|gd|gl|hr|hu|hy-AM|is|it-CH|it|jv|ka|kk|km|ky|lb|lt|lv|me|mi|mk|ms-MY|ms|mt|my|nb|nl-BE|nl|nn|oc-LNC|pl|pt|ro|ru|sd|se|sk|sl|sq|sr-CYRL|sr|ss|sv|sw|tet|tg|tk|tl-PH|tlh|tr|tzl|ug-CN|uk|ur|uz-LATN|uz|vi|x-PSEUDO|yo|zh-CN)(?:-\w{2})?)$/)) {
    return 2
  } else if (locale.match(/^((?:ar-LY|ar|fa|ku|tzm-LATN|tzm)(?:-\w{2})?)$/)) {
    return 7
  } else if (locale.match(/^((?:dv)(?:-\w{2})?)$/)) {
    return 8
  }

  return 1
}
