import { IDate } from '../common/models/calendar.model';

export interface IDay extends IDate {
    currentMonth?: boolean;
    prevMonth?: boolean;
    nextMonth?: boolean;
    currentDay?: boolean;
    disabled?: boolean;
}

export interface IDayEvent {
    day: IDay;
    event: MouseEvent;
}
