import {
	gregoryCalendarId,
	isoCalendarId,
	japaneseCalendarId,
} from './calendarConfig'
import {
	WeekParts,
	formatMonthCode,
} from './calendarNative'
import {
	computeIntlDateParts,
	computeIntlDay,
	computeIntlDaysInMonth,
	computeIntlDaysInYear,
	computeIntlEpochMilli,
	computeIntlEraParts,
	computeIntlInLeapYear,
	computeIntlLeapMonth,
	computeIntlMonthCodeParts,
	computeIntlMonthsInYear,
	computeIntlYearMonthForMonthDay,
	computeIsoFieldsFromIntlParts,
	queryIntlCalendar,
} from './intlMath'
import {
	computeIsoDateParts,
	computeIsoDay,
	computeIsoDaysInMonth,
	computeIsoDaysInYear,
	computeIsoEraParts,
	computeIsoFieldsFromParts,
	computeIsoInLeapYear,
	computeIsoMonthCodeParts,
	computeIsoMonthsInYear,
	computeIsoWeekParts,
	computeIsoYearMonthForMonthDay,
} from './isoMath'
import {
	diffEpochMilliByDay,
	intlMonthAdd,
	isoMonthAdd,
	nativeYearMonthAdd,
} from './calendarNativeMath'
import { isoArgsToEpochMilli, isoToEpochMilli } from './timeMath'

export function queryNativeDateParts(
	calendarId: string,
	isoFields: Parameters<typeof computeIsoDateParts>[0],
): ReturnType<typeof computeIsoDateParts> {
	return isIsoBasedCalendarId(calendarId)
		? computeIsoDateParts(isoFields)
		: computeIntlDateParts(queryIntlCalendar(calendarId), isoFields)
}

export function queryNativeDay(
	calendarId: string,
	isoFields: Parameters<typeof computeIsoDay>[0],
): ReturnType<typeof computeIsoDay> {
	return isIsoBasedCalendarId(calendarId)
		? computeIsoDay(isoFields)
		: computeIntlDay(queryIntlCalendar(calendarId), isoFields)
}

export function queryNativeEpochMilli(
	calendarId: string,
	year: number,
	month?: number,
	day?: number,
): number {
	return isIsoBasedCalendarId(calendarId)
		? isoArgsToEpochMilli(year, month, day)!
		: computeIntlEpochMilli(queryIntlCalendar(calendarId), year, month, day)
}

export function queryNativeMonthAdd(
	calendarId: string,
	year: number,
	month: number,
	monthDelta: number,
): ReturnType<typeof isoMonthAdd> {
	return isIsoBasedCalendarId(calendarId)
		? isoMonthAdd(year, month, monthDelta)
		: intlMonthAdd(queryIntlCalendar(calendarId), year, month, monthDelta)
}

export function queryNativeYearMonthAdd(
	calendarId: string,
	isoFields: Parameters<typeof nativeYearMonthAdd>[1],
	years: Parameters<typeof nativeYearMonthAdd>[2],
	months: Parameters<typeof nativeYearMonthAdd>[3],
	overflow: Parameters<typeof nativeYearMonthAdd>[4],
): ReturnType<typeof nativeYearMonthAdd> {
	return nativeYearMonthAdd(calendarId, isoFields, years, months, overflow)
}

export function queryNativeEraParts(
	calendarId: string,
	isoFields: Parameters<typeof computeIsoEraParts>[1],
): ReturnType<typeof computeIsoEraParts> {
	return isIsoBasedCalendarId(calendarId)
		? computeIsoEraParts(queryIsoCalendarId(calendarId), isoFields)
		: computeIntlEraParts(queryIntlCalendar(calendarId), isoFields)
}

export function queryNativeMonthCodeParts(
	calendarId: string,
	year: Parameters<typeof computeIsoMonthCodeParts>[0],
	month: Parameters<typeof computeIsoMonthCodeParts>[1],
): ReturnType<typeof computeIsoMonthCodeParts> {
	return isIsoBasedCalendarId(calendarId)
		? computeIsoMonthCodeParts(year, month)
		: computeIntlMonthCodeParts(queryIntlCalendar(calendarId), year, month)
}

export function queryNativeMonthCode(
	calendarId: string,
	isoFields: Parameters<typeof computeIsoDateParts>[0],
): string {
	const [year, month] = queryNativeDateParts(calendarId, isoFields)
	const [monthCodeNumber, isLeapMonth] = queryNativeMonthCodeParts(
		calendarId,
		year,
		month,
	)
	return formatMonthCode(monthCodeNumber, isLeapMonth)
}

export function queryNativeYearMonthForMonthDay(
	calendarId: string,
	monthCodeNumber: Parameters<typeof computeIsoYearMonthForMonthDay>[0],
	isLeapMonth: Parameters<typeof computeIsoYearMonthForMonthDay>[1],
	day: Parameters<typeof computeIsoYearMonthForMonthDay>[2],
): ReturnType<typeof computeIsoYearMonthForMonthDay> {
	return isIsoBasedCalendarId(calendarId)
		? computeIsoYearMonthForMonthDay(monthCodeNumber, isLeapMonth, day)
		: computeIntlYearMonthForMonthDay(
				queryIntlCalendar(calendarId),
				monthCodeNumber,
				isLeapMonth,
				day,
			)
}

export function queryNativeIsoFieldsFromParts(
	calendarId: string,
	year: Parameters<typeof computeIsoFieldsFromParts>[0],
	month: Parameters<typeof computeIsoFieldsFromParts>[1],
	day: Parameters<typeof computeIsoFieldsFromParts>[2],
): ReturnType<typeof computeIsoFieldsFromParts> {
	return isIsoBasedCalendarId(calendarId)
		? computeIsoFieldsFromParts(year, month, day)
		: computeIsoFieldsFromIntlParts(queryIntlCalendar(calendarId), year, month, day)
}

export function queryNativeInLeapYear(
	calendarId: string,
	isoFields: Parameters<typeof computeIsoDateParts>[0],
): boolean {
	const [year] = queryNativeDateParts(calendarId, isoFields)
	return isIsoBasedCalendarId(calendarId)
		? computeIsoInLeapYear(year)
		: computeIntlInLeapYear(queryIntlCalendar(calendarId), year)
}

export function queryNativeMonthsInYear(
	calendarId: string,
	isoFields: Parameters<typeof computeIsoDateParts>[0],
): number {
	const [year] = queryNativeDateParts(calendarId, isoFields)
	return queryNativeMonthsInYearPart(calendarId, year)
}

export function queryNativeMonthsInYearPart(
	calendarId: string,
	year: number,
): number {
	return isIsoBasedCalendarId(calendarId)
		? computeIsoMonthsInYear(year)
		: computeIntlMonthsInYear(queryIntlCalendar(calendarId), year)
}

export function queryNativeDaysInMonth(
	calendarId: string,
	isoFields: Parameters<typeof computeIsoDateParts>[0],
): number {
	const [year, month] = queryNativeDateParts(calendarId, isoFields)
	return queryNativeDaysInMonthPart(calendarId, year, month)
}

export function queryNativeDaysInMonthPart(
	calendarId: string,
	year: number,
	month: number,
): number {
	return isIsoBasedCalendarId(calendarId)
		? computeIsoDaysInMonth(year, month)
		: computeIntlDaysInMonth(queryIntlCalendar(calendarId), year, month)
}

export function queryNativeDaysInYear(
	calendarId: string,
	isoFields: Parameters<typeof computeIsoDateParts>[0],
): number {
	const [year] = queryNativeDateParts(calendarId, isoFields)
	return isIsoBasedCalendarId(calendarId)
		? computeIsoDaysInYear(year)
		: computeIntlDaysInYear(queryIntlCalendar(calendarId), year)
}

export function queryNativeLeapMonth(
	calendarId: string,
	year: number,
): number | undefined {
	return isIsoBasedCalendarId(calendarId)
		? undefined
		: computeIntlLeapMonth(queryIntlCalendar(calendarId), year)
}

export function queryNativeDayOfYear(
	calendarId: string,
	isoFields: Parameters<typeof computeIsoDateParts>[0],
): number {
	const [year] = queryNativeDateParts(calendarId, isoFields)
	const milli0 = isIsoBasedCalendarId(calendarId)
		? isoArgsToEpochMilli(year)
		: computeIntlEpochMilli(queryIntlCalendar(calendarId), year)
	const milli1 = isoToEpochMilli(isoFields)!
	return diffEpochMilliByDay(milli0!, milli1) + 1
}

export function queryNativeWeekParts(
	calendarId: string,
	isoFields: Parameters<typeof computeIsoWeekParts>[2],
): WeekParts {
	if (!isIsoBasedCalendarId(calendarId)) {
		return [] as unknown as WeekParts
	}

	return computeIsoWeekParts(
		queryIsoCalendarId(calendarId),
		(innerIsoFields) => queryNativeDayOfYear(calendarId, innerIsoFields),
		isoFields,
	)
}

export function queryNativeWeekOfYear(
	calendarId: string,
	isoFields: Parameters<typeof computeIsoWeekParts>[2],
): number | undefined {
	return queryNativeWeekParts(calendarId, isoFields)[0]
}

export function queryNativeYearOfWeek(
	calendarId: string,
	isoFields: Parameters<typeof computeIsoWeekParts>[2],
): number | undefined {
	return queryNativeWeekParts(calendarId, isoFields)[1]
}

function isIsoBasedCalendarId(calendarId: string): boolean {
	return (
		calendarId === isoCalendarId ||
		calendarId === gregoryCalendarId ||
		calendarId === japaneseCalendarId
	)
}

function queryIsoCalendarId(calendarId: string): string | undefined {
	return calendarId === isoCalendarId ? undefined : calendarId
}
