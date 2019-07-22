import {
    INavEvent,
    ECalendarMode,
    ECalendarValue,
    CalendarValue,
    DateValidator,
    SingleCalendarValue,
    CalendarMode
} from '../common/models/calendar.model';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    EventEmitter,
    forwardRef,
    HostBinding,
    Input,
    OnChanges,
    OnInit,
    Output,
    SimpleChange,
    SimpleChanges,
    ViewEncapsulation
} from '@angular/core';
import { DayCalendarService } from './day-calendar.service';
import * as momentNs from 'jalali-moment';
import { Moment, MomentInput, unitOfTime } from 'jalali-moment';
import { IDayCalendarConfig, IDayCalendarConfigInternal } from './day-calendar-config.model';
import { IDay } from './day.model';
import {
    ControlValueAccessor,
    FormControl,
    NG_VALIDATORS,
    NG_VALUE_ACCESSOR,
    ValidationErrors,
    Validator
} from '@angular/forms';
import { UtilsService } from '../common/services/utils/utils.service';
import { IMonthCalendarConfig } from '../month-calendar/month-calendar-config';
import { ITimeSelectConfig } from '../time-select/time-select-config.model';
import { DatePickerService } from '../date-picker/date-picker.service';
import { IMonth } from '../month-calendar/month.model';
const moment = momentNs;

@Component({
    selector: 'dp-day-calendar',
    templateUrl: 'day-calendar.component.html',
    styleUrls: ['day-calendar.component.less'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        DayCalendarService,
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DayCalendarComponent),
            multi: true
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => DayCalendarComponent),
            multi: true
        }
    ]
})
export class DayCalendarComponent implements OnInit, OnChanges, ControlValueAccessor, Validator {

    @Input() config: IDayCalendarConfig;
    @Input() displayDate: SingleCalendarValue;
    @Input() mode: CalendarMode;
    @Input() minDate: Moment;
    @Input() maxDate: Moment;
    @HostBinding('class') @Input() theme: string;

    @Output() onModeChange: EventEmitter<CalendarMode> = new EventEmitter();
    @Output() onSelect: EventEmitter<IDay> = new EventEmitter();
    @Output() onMonthSelect: EventEmitter<IMonth> = new EventEmitter();
    @Output() onGoToCurrent: EventEmitter<ECalendarMode> = new EventEmitter();
    @Output() onSwitchLocale: EventEmitter<string> = new EventEmitter();
    @Output() onTimeView: EventEmitter<ECalendarMode> = new EventEmitter();
    @Output() onTimeChange: EventEmitter<any> = new EventEmitter();
    @Output() onLeftNav: EventEmitter<INavEvent> = new EventEmitter();
    @Output() onRightNav: EventEmitter<INavEvent> = new EventEmitter();
    @Output() onLeftSecondaryNav: EventEmitter<INavEvent> = new EventEmitter();
    @Output() onRightSecondaryNav: EventEmitter<INavEvent> = new EventEmitter();

    CalendarMode = ECalendarMode;
    isInited: boolean = false;
    componentConfig: IDayCalendarConfigInternal;
    timeSelectConfig: ITimeSelectConfig;
    _selected: Moment[];
    months = [];
    weekdays: Moment[];
    _currentDateView: Moment;
    inputValue: CalendarValue;
    inputValueType: ECalendarValue;
    validateFn: DateValidator;
    currentCalendarMode: ECalendarMode;
    monthCalendarConfig: IMonthCalendarConfig;
    _shouldShowCurrent: boolean = true;
    _showSwitchLocale: boolean = true;
    _showTimeView: boolean = true;
    navLabel: string[];
    showLeftNav: boolean;
    showRightNav: boolean;
    showLeftSecondaryNav: boolean;
    showRightSecondaryNav: boolean;

    api = {
        moveCalendarsBy: this.moveCalendarsBy.bind(this),
        moveCalendarTo: this.moveCalendarTo.bind(this),
        toggleCalendarMode: this.toggleCalendarMode.bind(this)
    };

    set selected(selected: Moment[]) {
        this._selected = selected;
        this.onChangeCallback(this.processOnChangeCallback(selected));
    }

    get selected(): Moment[] {
        return this._selected;
    }

    set currentDateView(current: Moment) {
        let ismonth = this.currentCalendarMode === this.CalendarMode.Month;
        this._currentDateView = current.clone();
        this.setMonths(this._currentDateView);
        this.navLabel = this.utilsService.getHeaderLabel(this.componentConfig, this._currentDateView, ismonth ? 'year' : 'month');
        this.showLeftNav = this.dayCalendarService.shouldShowLeft(this.componentConfig.min, this.currentDateView);
        this.showRightNav = this.dayCalendarService.shouldShowRight(this.componentConfig.max, this.currentDateView);
        this.secondaryNavVisibility();
    }

    get currentDateView(): Moment {
        return this._currentDateView;
    }

    constructor(public readonly dayCalendarService: DayCalendarService,
        public readonly dayPickerService: DatePickerService,
        public readonly utilsService: UtilsService,
        public readonly cd: ChangeDetectorRef) {
    }

    ngOnInit() {
        this.isInited = true;
        this.init();
        this.initValidators();
    }

    init() {
        this.componentConfig = this.dayCalendarService.getConfig(this.config);
        this.selected = this.selected || [moment()];
        this.currentDateView = this.displayDate
            ? this.utilsService.convertToMoment(this.displayDate, this.componentConfig.format, this.componentConfig.locale).clone()
            : this.utilsService
                .getDefaultDisplayDate(
                    this.currentDateView,
                    this.selected,
                    this.componentConfig.allowMultiSelect,
                    this.componentConfig.min,
                    this.componentConfig.locale
                );
        this.weekdays = this.dayCalendarService
            .generateWeekdays(this.componentConfig.firstDayOfWeek, this.componentConfig.locale);
        this.inputValueType = this.utilsService.getInputType(this.inputValue, this.componentConfig.allowMultiSelect);
        this.monthCalendarConfig = this.dayCalendarService.getMonthCalendarConfig(this.componentConfig);
        this.timeSelectConfig = this.dayPickerService.getTimeConfigService(this.componentConfig);
        this._shouldShowCurrent = this.shouldShowCurrent();
        this._showSwitchLocale = this.componentConfig.showSwitchLocale && this._showSwitchLocale;
        this._showTimeView = this.componentConfig.showTimeView && this._showTimeView;
        this.toggleCalendarMode(this.modeToEcalendarMode(this.mode));
        this.secondaryNavVisibility();
    }

    isFarsi() {
        return this.componentConfig.locale === 'fa';
    }

    setMonths(current: Moment) {
        this.months = [];
        
        for (let i = 0; i < this.componentConfig.months; i++) {
            let next = current.clone().add(i , 'month');
            let val = i === 0 ? current : next;
            this.months.push({
                name: val.format('MMM YYYY'),
                items: this.dayCalendarService.generateMonthArray(this.componentConfig, val, this.selected)
            });
        }
    }

    modeToEcalendarMode(mode: CalendarMode): ECalendarMode {
        let _result: ECalendarMode;
        switch (mode) {
            case 'day': _result = ECalendarMode.Day; break;
            case 'daytime': _result = ECalendarMode.DayTime; break;
            case 'month': _result = ECalendarMode.Month; break;
            case 'time': _result = ECalendarMode.Time; break;
        }
        return _result;
    }
    
    ecalendarModeToMode(mode: ECalendarMode): CalendarMode {
        let _result: CalendarMode;
        switch (mode) {
            case ECalendarMode.Day: _result = 'day'; break;
            case ECalendarMode.DayTime: _result = 'daytime'; break;
            case ECalendarMode.Month: _result = 'month'; break;
            case ECalendarMode.Time: _result = 'time'; break;
        }
        return _result;
    }

    secondaryNavVisibility() {
        this.showLeftSecondaryNav = (this.componentConfig.showMultipleYearsNavigation === 'all' ||
             this.componentConfig.showMultipleYearsNavigation === this.currentCalendarMode) && this.showLeftNav;
        this.showRightSecondaryNav = (this.componentConfig.showMultipleYearsNavigation === 'all' ||
             this.componentConfig.showMultipleYearsNavigation === this.currentCalendarMode) && this.showRightNav;
    }

    ngOnChanges(changes: SimpleChanges) {
        if (this.isInited) {
            const { minDate, maxDate, config } = changes;

            this.handleConfigChange(config);
            this.init();

            if (minDate || maxDate) {
                this.initValidators();
            }
        }
    }

    writeValue(value: CalendarValue): void {
        if (value === this.inputValue ||
            (this.inputValue && (moment.isMoment(this.inputValue)) &&
            (this.inputValue as Moment).isSame(<MomentInput>value))) {
            return;
        }

        this.inputValue = value;
        if (value) {
            this.selected = this.utilsService.convertToMomentArray(value, this.componentConfig.format, this.componentConfig.allowMultiSelect, this.componentConfig.locale);
            this.inputValueType = this.utilsService.getInputType(this.inputValue, this.componentConfig.allowMultiSelect);
        } else this.selected = [];

        this.setMonths(this.currentDateView);
        this.cd.markForCheck();
    }

    registerOnChange(fn: any): void {
        this.onChangeCallback = fn;
    }

    onChangeCallback(_: any) {
    };

    registerOnTouched(fn: any): void {
    }

    validate(formControl: FormControl): ValidationErrors | any {
        if (this.minDate || this.maxDate) {
            return this.validateFn(formControl.value);
        } else {
            return () => null;
        }
    }

    processOnChangeCallback(value: Moment[]): CalendarValue {
        return this.utilsService.convertFromMomentArray(
            this.componentConfig.format,
            value,
            this.componentConfig.returnedValueType || this.inputValueType,
            this.componentConfig.locale
        );
    }

    initValidators() {
        this.validateFn = this.utilsService.createValidator(
            { minDate: this.minDate, maxDate: this.maxDate },
            this.componentConfig.format,
            'day',
            this.componentConfig.locale
        );

        this.onChangeCallback(this.processOnChangeCallback(this.selected));
    }

    dayClicked(day: IDay) {
        if (day.selected && !this.componentConfig.unSelectOnClick) return;

        this.selected = this.utilsService.updateSelected(this.componentConfig.allowMultiSelect, this.selected, day);
        this.setMonths(this.currentDateView);
        this.onSelect.emit(day);
    }

    getDayBtnText(day: IDay): string {
        return this.dayCalendarService.getDayBtnText(this.componentConfig, day.date);
    }

    getDayBtnCssClass(day: IDay): { [klass: string]: boolean } {
        const cssClasses: { [klass: string]: boolean } = {
            'dp-selected': day.selected,
            'dp-current-month': day.currentMonth,
            'dp-prev-month': day.prevMonth,
            'dp-next-month': day.nextMonth,
            'dp-current-day': day.currentDay
        };
        const customCssClass: string = this.dayCalendarService.getDayBtnCssClass(this.componentConfig, day.date);
        if (customCssClass) {
            cssClasses[customCssClass] = true;
        }

        return cssClasses;
    }
    
    onNavClick(side: string) {
        let _side = side.charAt(0).toUpperCase() + side.slice(1).toLowerCase();
        const from = this.currentDateView.clone();
        const isday = this.currentCalendarMode === ECalendarMode.Day;
        this.moveCalendarsBy(this.currentDateView, _side === 'Left' ? -1 : 1, isday ? 'month' : 'year');
        const to = this.currentDateView.clone();
        this[`on${_side}Nav`].emit({ from, to });
    }

    onLeftSecondaryNavClick() {
        let navigateBy = this.componentConfig.multipleYearsNavigateBy;
        const isOutsideRange = this.componentConfig.min &&
            this.currentDateView.year() - this.componentConfig.min.year() < navigateBy;

        if (isOutsideRange) {
            navigateBy = this.currentDateView.year() - this.componentConfig.min.year();
        }

        const from = this.currentDateView.clone();
        this.currentDateView = this.currentDateView.clone().subtract(navigateBy, 'year');
        const to = this.currentDateView.clone();
        this.onLeftSecondaryNav.emit({ from, to });
    }

    onRightSecondaryNavClick() {
        let navigateBy = this.componentConfig.multipleYearsNavigateBy;
        const isOutsideRange = this.componentConfig.max &&
            this.componentConfig.max.year() - this.currentDateView.year() < navigateBy;

        if (isOutsideRange) {
            navigateBy = this.componentConfig.max.year() - this.currentDateView.year();
        }

        const from = this.currentDateView.clone();
        this.currentDateView = this.currentDateView.clone().add(navigateBy, 'year');
        const to = this.currentDateView.clone();
        this.onRightSecondaryNav.emit({ from, to });
    }

    getWeekdayName(weekday: Moment): string {
        if (this.componentConfig.weekDayFormatter) {
            return this.componentConfig.weekDayFormatter(weekday.day());
        }
        return weekday.format(this.componentConfig.weekDayFormat);
    }

    monthSelected(month: IMonth) {
        this.currentDateView = month.date.clone();
        this.navLabel = this.utilsService.getHeaderLabel(this.componentConfig, this.currentDateView, 'month');
        this.onMonthSelect.emit(month);
        this.toggleCalendarMode(ECalendarMode.Day);
    }

    LabelClicked() {
        let ismonth = this.currentCalendarMode === ECalendarMode.Month;
        this.navLabel = this.utilsService.getHeaderLabel(this.componentConfig,
            this.currentDateView, ismonth ? 'month' : 'year');
            this.toggleCalendarMode(ismonth ? ECalendarMode.Day : ECalendarMode.Month);
        this.secondaryNavVisibility();
    }

    moveCalendarsBy(current: Moment, amount: number, granularity: unitOfTime.Base = 'month') {
        this.currentDateView = current.clone().add(amount, granularity);
        this.cd.markForCheck();
    }

    moveCalendarTo(to: SingleCalendarValue) {
        if (to && this.componentConfig) {
            this.currentDateView = this.utilsService.convertToMoment(to, this.componentConfig.format, this.componentConfig.locale);
        }

        this.cd.markForCheck();
    }

    shouldShowCurrent(): boolean {
        return this.utilsService.shouldShowCurrent(
            this.componentConfig.showGoToCurrent,
            'day',
            this.componentConfig.min,
            this.componentConfig.max
        );
    }

    goToCurrent() {
        if (this.currentCalendarMode === ECalendarMode.Time) {
            this._selected[0].set({
                'hour' : moment().hour(),
                'minute'  : moment().minute(), 
                'second' : moment().second()
            });
            this.selected = this._selected;
            
        } else this.currentDateView = moment().locale(this.componentConfig.locale);
        this.onGoToCurrent.emit(this.currentCalendarMode);
    }

    switchLocale() {
        if (this.currentCalendarMode === ECalendarMode.Time) this.currentCalendarMode = ECalendarMode.Day;
        this.onSwitchLocale.emit(this.componentConfig.locale);
    }

    toggleCalendarMode(mode: ECalendarMode) {
        if (this.currentCalendarMode !== mode) {
            this.currentCalendarMode = mode;
        }

        this.onModeChange.emit(this.ecalendarModeToMode(this.currentCalendarMode));
        this.cd.markForCheck();
    }

    TimeViewClicked() {
        let _result = this.currentCalendarMode === ECalendarMode.Time ? ECalendarMode.Day : ECalendarMode.Time;
        this.toggleCalendarMode(_result);
        this.onTimeView.emit(this.currentCalendarMode);
    }

    TimeChanged(evt) {
        this.onTimeChange.emit(evt);
    }

    handleConfigChange(config: SimpleChange) {
        if (config) {
            const prevConf: IDayCalendarConfigInternal = this.dayCalendarService.getConfig(config.previousValue);
            const currentConf: IDayCalendarConfigInternal = this.dayCalendarService.getConfig(config.currentValue);

            if (this.utilsService.shouldResetCurrentView(prevConf, currentConf)) {
                this._currentDateView = null;
            }
        }
    }
}
