import { Moment } from 'jalali-moment';

export interface ICalendar {
    locale?: string;
    min?: SingleCalendarValue;
    max?: Moment | string;
}

export interface ICalendarInternal {
    locale?: string;
    min?: Moment;
    max?: Moment;
}

export interface IDate {
    date: Moment;
    selected?: boolean;
}

export interface INavEvent {
    from: Moment;
    to: Moment;
}

export enum ECalendarMode {
    Day,
    DayTime,
    Month,
    Time
}

export enum ECalendarValue {
    Moment = 1,
    MomentArr,
    String,
    StringArr
}

export type DateValidator = (inputVal: CalendarValue) => {[key: string]: any};
export type WeekDays = 'su' | 'mo' | 'tu' | 'we' | 'th' | 'fr' | 'sa';
export type CalendarValue = Moment | Moment[] | string | string[];
export type CalendarMode = 'day' | 'month' | 'daytime' | 'time';
export type SingleCalendarValue = Moment | string;
export type TOpens = 'right' | 'left';
export type TDrops = 'up' | 'down';
