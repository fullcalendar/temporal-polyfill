
export interface ISOYearFields {
  isoYear: number;
}

export interface ISOYearMonthFields extends ISOYearFields {
  isoMonth: number;
}

export interface ISODateFields extends ISOYearMonthFields {
  isoDay: number;
}

export interface ISOTimeFieldsMilli {
  isoHour: number;
  isoMinute: number;
  isoSecond: number;
  isoMillisecond: number;
}

export interface ISOTimeFields extends ISOTimeFieldsMilli {
  isoMicrosecond: number;
  isoNanosecond: number;
}

export type ISODateTimeFields = ISODateFields & ISOTimeFields
export type ISODateTimeFieldsMilli = ISODateFields & ISOTimeFieldsMilli
