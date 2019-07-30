import {
    CalendarValue,
    ECalendarValue,
    IDate,
    CalendarMode,
    DateValidator,
    SingleCalendarValue
} from '../../models/calendar.model';
import { Injectable } from '@angular/core';
import * as momentNs from 'jalali-moment';
import { Moment, unitOfTime } from 'jalali-moment';
import { ICalendarInternal } from '../../models/calendar.model';
import { IDayCalendarConfigInternal } from '../../../day-calendar/day-calendar-config.model';
const moment = momentNs;

export interface DateLimits {
    minDate?: SingleCalendarValue;
    maxDate?: SingleCalendarValue;
    minTime?: SingleCalendarValue;
    maxTime?: SingleCalendarValue;
}

@Injectable()
export class UtilsService {
    static debounce(func: Function, wait: number) {
        let timeout;
        return function () {
            const context = this, args = arguments;
            timeout = clearTimeout(timeout);
            setTimeout(() => {
                func.apply(context, args);
            }, wait);
        };
    };

    createArray(size: number): number[] {
        return new Array(size).fill(1);
    }

    convertToMoment(date: SingleCalendarValue, format: string, locale?: string): Moment {
        let m;
        if (!date) {
            m = null;
        } else if (typeof date === 'string') {
            m = moment(date, format);
        } else {
            m = date.clone();
        }
        if (m && locale) {
            m.locale(locale);
        }
        return m;
    }

    isDateValid(date: string, format: string, locale?: string): boolean {
        if (date === '') {
            return true;
        }
        // return moment(date, format, true, locale).isValid();
        return moment(date, format, true).isValid();
    }

    // todo:: add unit test
    getDefaultDisplayDate(current: Moment,
        selected: Moment[],
        allowMultiSelect: boolean,
        minDate: Moment,
        locale: string): Moment {
        let m = moment();
        if (current) {
            m = current.clone();
        } else if (minDate && minDate.isAfter(moment())) {
            m = minDate.clone();
        } else if (allowMultiSelect) {
            if (selected && selected[selected.length]) {
                m = selected[selected.length].clone();
            }
        } else if (selected && selected[0]) {
            m = selected[0].clone();
        }
        if (locale) {
            m.locale(locale);
        }
        return m;
    }

    // todo:: add unit test
    getInputType(value: CalendarValue, allowMultiSelect: boolean): ECalendarValue {
        if (Array.isArray(value)) {
            if (!value.length) {
                return ECalendarValue.MomentArr;
            } else if (typeof value[0] === 'string') {
                return ECalendarValue.StringArr;
            } else if (moment.isMoment(value[0])) {
                return ECalendarValue.MomentArr;
            }
        } else {
            if (typeof value === 'string') {
                return ECalendarValue.String;
            } else if (moment.isMoment(value)) {
                return ECalendarValue.Moment;
            }
        }

        return allowMultiSelect ? ECalendarValue.MomentArr : ECalendarValue.Moment;
    }

    // todo:: add unit test
    convertToMomentArray(value: CalendarValue, format: string, allowMultiSelect: boolean, locale: string): Moment[] {
        switch (this.getInputType(value, allowMultiSelect)) {
            case (ECalendarValue.String):
                return value ? [moment(<string>value, format, true).locale(locale)] : [];
            case (ECalendarValue.StringArr):
                return (<string[]>value).map(v => v ? moment(v, format, true).locale(locale) : null).filter(Boolean);
            case (ECalendarValue.Moment):
                return value ? [(<Moment>value).clone().locale(locale)] : [];
            case (ECalendarValue.MomentArr):
                return (<Moment[]>value || []).map(v => v.clone().locale(locale));
            default:
                return [];
        }
    }

    // todo:: add unit test
    convertFromMomentArray(format: string,
        value: Moment[],
        convertTo: ECalendarValue,
        locale: string): CalendarValue {
        switch (convertTo) {
            case (ECalendarValue.String):
                return value[0] && value[0].locale(locale).format(format);
            case (ECalendarValue.StringArr):
                return value.filter(Boolean).map(v => v.locale(locale).format(format));
            case (ECalendarValue.Moment):
                return value[0] ? value[0].clone().locale(locale) : value[0];
            case (ECalendarValue.MomentArr):
                return value ? value.map(v => v.clone().locale(locale)) : value;
            default:
                return value;
        }
    }

    convertToString(value: CalendarValue, format: string, locale?: string): string {
        let tmpVal: string[];

        if (typeof value === 'string') {
            tmpVal = [value];
        } else if (Array.isArray(value)) {
            if (value.length) {
                tmpVal = (<SingleCalendarValue[]>value).map((v) => {
                    return this.convertToMoment(v, format, locale).format(format);
                });
            } else {
                tmpVal = <string[]>value;
            }
        } else if (moment.isMoment(value)) {
            tmpVal = [value.format(format)];
        } else {
            return '';
        }

        return tmpVal.filter(Boolean).join(' | ');
    }

    // todo:: add unit test
    clearUndefined<T>(obj: T): T {
        if (!obj) {
            return obj;
        }

        Object.keys(obj).forEach((key) => (obj[key] === undefined) && delete obj[key]);
        return obj;
    }

    updateSelected(isMultiple: boolean,
        currentlySelected: Moment[],
        date: IDate,
        granularity: unitOfTime.Base = 'day'): Moment[] {
        const isSelected = !date.selected;
        if (isMultiple) {
            return isSelected
                ? currentlySelected.concat([date.date])
                : currentlySelected.filter(d => !d.isSame(date.date, granularity));
        } else {
            return isSelected ? [date.date] : [];
        }
    }

    closestParent(element: HTMLElement, selector: string): HTMLElement {
        if (!element) {
            return undefined;
        }
        const match = <HTMLElement>element.querySelector(selector);
        return match || this.closestParent(element.parentElement, selector);
    }

    onlyTime(m: Moment): Moment {
        return m && moment.isMoment(m) && moment(m.format('HH:mm:ss'), 'HH:mm:ss');
    }

    granularityFromType(calendarType: CalendarMode): unitOfTime.Base {
        switch (calendarType) {
            case 'time':
                return 'second';
            case 'daytime':
                return 'second';
            default:
                return calendarType;
        }
    }

    createValidator({ minDate, maxDate, minTime, maxTime }: DateLimits,
        format: string,
        calendarType: CalendarMode,
        locale: string): DateValidator {
        let isValid: boolean;
        let value: Moment[];
        const validators = [];
        const granularity = this.granularityFromType(calendarType);

        if (minDate) {
            const md = this.convertToMoment(minDate, format, locale);
            validators.push({
                key: 'minDate',
                isValid: () => {
                    const _isValid = value.every(val => val.isSameOrAfter(md, granularity));
                    isValid = isValid ? _isValid : false;
                    return _isValid;
                }
            });
        }

        if (maxDate) {
            const md = this.convertToMoment(maxDate, format, locale);
            validators.push({
                key: 'maxDate',
                isValid: () => {
                    const _isValid = value.every(val => val.isSameOrBefore(md, granularity));
                    isValid = isValid ? _isValid : false;
                    return _isValid;
                }
            });
        }

        if (minTime) {
            const md = this.onlyTime(this.convertToMoment(minTime, format, locale));
            validators.push({
                key: 'minTime',
                isValid: () => {
                    const _isValid = value.every(val => this.onlyTime(val).isSameOrAfter(md));
                    isValid = isValid ? _isValid : false;
                    return _isValid;
                }
            });
        }

        if (maxTime) {
            const md = this.onlyTime(this.convertToMoment(maxTime, format, locale));
            validators.push({
                key: 'maxTime',
                isValid: () => {
                    const _isValid = value.every(val => this.onlyTime(val).isSameOrBefore(md));
                    isValid = isValid ? _isValid : false;
                    return _isValid;
                }
            });
        }

        return (inputVal: CalendarValue) => {
            isValid = true;

            value = this.convertToMomentArray(inputVal, format, true, locale).filter(Boolean);

            if (!value.every(val => val.isValid())) {
                return {
                    format: {
                        given: inputVal
                    }
                };
            }

            const errors = validators.reduce((map, err) => {
                if (!err.isValid()) {
                    map[err.key] = {
                        given: value
                    };
                }

                return map;
            }, {});

            return !isValid ? errors : null;
        };
    }

    datesStringToStringArray(value: string): string[] {
        return (value || '').split('|').map(m => m.trim()).filter(Boolean);
    }

    getValidMomentArray(value: string, format: string, locale: string): Moment[] {
        return this.datesStringToStringArray(value)
            .filter(d => this.isDateValid(d, format, locale))
            .map(d => moment(d, format));
    }

    shouldShowCurrent(showGoToCurrent: boolean,
        mode: CalendarMode,
        min: Moment,
        max: Moment): boolean {
        return showGoToCurrent &&
            mode !== 'time' &&
            this.isDateInRange(moment(), min, max);
    }

    isDateInRange(date: Moment, from: Moment, to: Moment): boolean {
        return date.isBetween(from, to, 'day', '[]');
    }

    convertPropsToMoment(obj: { [key: string]: any }, format: string, props: string[], locale?: string) {
        props.forEach((prop) => {
            if (obj.hasOwnProperty(prop)) {
                obj[prop] = this.convertToMoment(obj[prop], format, locale);
            }
        });
    }

    shouldResetCurrentView<T extends ICalendarInternal>(prevConf: T, currentConf: T): boolean {
        if (prevConf && currentConf) {
            if (!prevConf.min && currentConf.min) {
                return true;
            } else if (prevConf.min && currentConf.min && !prevConf.min.isSame(currentConf.min, 'd')) {
                return true;
            } else if (!prevConf.max && currentConf.max) {
                return true;
            } else if (prevConf.max && currentConf.max && !prevConf.max.isSame(currentConf.max, 'd')) {
                return true;
            }

            return false;
        }

        return false;
    }

    getNativeElement(elem: HTMLElement | string): HTMLElement {
        if (!elem) {
            return null;
        } else if (typeof elem === 'string') {
            return <HTMLElement>document.querySelector(elem);
        } else {
            return elem;
        }
    }

    getHeaderLabel(config: IDayCalendarConfigInternal, year: Moment, type: string): string[] {
        if (config[`${type}Formatter`]) return config[`${type}Formatter`](year);
        year.locale(config.locale);

        let labels = [];
        for (let i = 0; i < config.months; i++) {
            let _year = config.months > 1 ? year.clone().add(i, 'month') : year;
            let val = config.locale === 'fa' ?
                this.toPersian(_year.format(config[`${type}Format`])) :
                _year.format(config[`${type}Format`]);
            labels.push(val);
        }

        return type === 'year' ? [labels[0]] : labels;
    }

    toPersian(value: string | number): string {
        const persianNumbersTable = ['\u06F0', '\u06F1', '\u06F2', '\u06F3', '\u06F4', '\u06F5', '\u06F6', '\u06F7', '\u06F8', '\u06F9'];
        const englishNumbersTable = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        const arabicToPersian = (value: string): string => value.replace(/٤/g, persianNumbersTable[4]).replace(/٥/g, persianNumbersTable[5]).replace(/٦/g, persianNumbersTable[6]);

        if (value === undefined || value === null) { throw 'invalid input number'; }
        value = value.toString();
        value = arabicToPersian(value);
        let regex: RegExp;
        for (let i = 0; i < persianNumbersTable.length; i++) {
            // language=JSRegexp
            regex = new RegExp(`[${englishNumbersTable[i]}]`, 'g');
            value = value.replace(regex, persianNumbersTable[i]);
        }
        return value;
    }
}
