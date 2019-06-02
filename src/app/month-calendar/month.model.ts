import { IDate } from '../common/models/calendar.model';

export interface IMonth extends IDate {
    currentMonth: boolean;
    disabled: boolean;
    text: string;
}
