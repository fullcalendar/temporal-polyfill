/* eslint-disable */

export const getMinimalDays = (locale: string): number => {
  if (locale.match(/^((?:ar-KW|ar-LY|ar|dv|fa|ku|tzm-LATN|tzm)(?:-\w{2})?)$/)) {
    return 1
  } else if (locale.match(/^((?:gom-DEVA|gom-LATN)(?:-\w{2})?)$/)) {
    return 3
  } else if (locale.match(/^((?:af|ar-DZ|ar-MA|ar-TN|bm|br|ca|cs|cy|da|de-AT|de-CH|de|el|en-AU|en-GB|en-IE|en-NZ|en-SG|en|es-DO|es-MX|es|et|fi|fil|fo|fr-CH|fr|fy|ga|gd|gl|hu|is|it-CH|it|km|lb|lt|lv|mi|mt|my|nb|nl-BE|nl|nn|oc-LNC|pl|pt|ru|sd|se|sk|sq|ss|sv|tet|tl-PH|tlh|tzl|ur|vi|x-PSEUDO|yo|zh-CN)(?:-\w{2})?)$/)) {
    return 4
  } else if (locale.match(/^((?:az|be|bg|bs|cv|eo|eu|hr|hy-AM|jv|ka|kk|ky|me|mk|ms-MY|ms|ro|sl|sr-CYRL|sr|sw|tg|tk|tr|ug-CN|uk|uz-LATN|uz)(?:-\w{2})?)$/)) {
    return 7
  }

  return 6
}
