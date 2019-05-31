import { ECalendarValue } from '../common/types/calendar-value-enum';
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
import { IMonth } from './month.model';
import { MonthCalendarService } from './month-calendar.service';
import * as momentNs from 'jalali-moment';
import { Moment } from 'jalali-moment';
import { IMonthCalendarConfig, IMonthCalendarConfigInternal } from './month-calendar-config';
import {
    ControlValueAccessor,
    FormControl,
    NG_VALIDATORS,
    NG_VALUE_ACCESSOR,
    ValidationErrors,
    Validator
} from '@angular/forms';
import { CalendarValue } from '../common/types/calendar-value';
import { UtilsService } from '../common/services/utils/utils.service';
import { DateValidator } from '../common/types/validator.type';
import { SingleCalendarValue } from '../common/types/single-calendar-value';
const moment = momentNs;

@Component({
    selector: 'dp-month-calendar',
    templateUrl: 'month-calendar.component.html',
    styleUrls: ['month-calendar.component.less'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        MonthCalendarService,
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MonthCalendarComponent),
            multi: true
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => MonthCalendarComponent),
            multi: true
        }
    ]
})
export class MonthCalendarComponent implements OnInit, OnChanges, ControlValueAccessor, Validator {
    @Input() config: IMonthCalendarConfig;
    @Input() displayDate: Moment;
    @Input() minDate: Moment;
    @Input() maxDate: Moment;
    @HostBinding('class') @Input() theme: string;

    @Output() onSelect: EventEmitter<IMonth> = new EventEmitter();

    isInited: boolean = false;
    componentConfig: IMonthCalendarConfigInternal;
    _selected: Moment[];
    yearMonths: IMonth[][];
    _currentDateView: Moment;
    inputValue: CalendarValue;
    inputValueType: ECalendarValue;
    validateFn: DateValidator;

    api = {
        moveCalendarTo: this.moveCalendarTo.bind(this)
    };

    set selected(selected: Moment[]) {
        this._selected = selected;
        this.onChangeCallback(this.processOnChangeCallback(selected));
    }

    get selected(): Moment[] {
        return this._selected;
    }

    set currentDateView(current: Moment) {
        this._currentDateView = current.clone();
        this.yearMonths = this.monthCalendarService
            .generateYear(this.componentConfig, this._currentDateView, this.selected);
    }

    get currentDateView(): Moment {
        return this._currentDateView;
    }

    constructor(public readonly monthCalendarService: MonthCalendarService,
        public readonly utilsService: UtilsService,
        public readonly cd: ChangeDetectorRef) {
    }

    ngOnInit() {
        this.isInited = true;
        this.init();
        this.initValidators();
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

    init() {
        this.componentConfig = this.monthCalendarService.getConfig(this.config);
        this.selected = this.selected || [];
        this.currentDateView = this.displayDate
            ? this.displayDate
            : this.utilsService
                .getDefaultDisplayDate(
                    this.currentDateView,
                    this.selected,
                    this.componentConfig.allowMultiSelect,
                    this.componentConfig.min,
                    this.componentConfig.locale
                );
        this.inputValueType = this.utilsService.getInputType(this.inputValue, this.componentConfig.allowMultiSelect);
    }

    writeValue(value: CalendarValue): void {
        this.inputValue = value;

        if (value) {
            this.selected = this.utilsService
                .convertToMomentArray(value,
                    this.componentConfig.format,
                    this.componentConfig.allowMultiSelect,
                    this.componentConfig.locale);
            this.yearMonths = this.monthCalendarService
                .generateYear(this.componentConfig, this.currentDateView, this.selected);
            this.inputValueType = this.utilsService.getInputType(this.inputValue, this.componentConfig.allowMultiSelect);
        }

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
    
    isFarsi() {
        return this.componentConfig.locale === 'fa';
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
        this.validateFn = this.validateFn = this.utilsService.createValidator(
            { minDate: this.minDate, maxDate: this.maxDate },
            this.componentConfig.format,
            'month',
            this.componentConfig.locale
        );

        this.onChangeCallback(this.processOnChangeCallback(this.selected));
    }

    monthClicked(month: IMonth) {
        if (month.selected && !this.componentConfig.unSelectOnClick) {
            return;
        }

        this.selected = this.utilsService
            .updateSelected(this.componentConfig.allowMultiSelect, this.selected, month, 'month');
        this.yearMonths = this.monthCalendarService
            .generateYear(this.componentConfig, this.currentDateView, this.selected);
        this.onSelect.emit(month);
    }

    getMonthBtnCssClass(month: IMonth): { [klass: string]: boolean } {
        const cssClass: { [klass: string]: boolean } = {
            'dp-selected': month.selected,
            'dp-current-month': month.currentMonth
        };
        const customCssClass: string = this.monthCalendarService.getMonthBtnCssClass(this.componentConfig, month.date);

        if (customCssClass) {
            cssClass[customCssClass] = true;
        }

        return cssClass;
    }

    moveCalendarTo(to: SingleCalendarValue) {
        if (to) {
            this.currentDateView = this.utilsService.convertToMoment(to, this.componentConfig.format, this.componentConfig.locale);
            this.cd.markForCheck();
        }
    }

    handleConfigChange(config: SimpleChange) {
        if (config) {
            const prevConf: IMonthCalendarConfigInternal = this.monthCalendarService.getConfig(config.previousValue);
            const currentConf: IMonthCalendarConfigInternal = this.monthCalendarService.getConfig(config.currentValue);

            if (this.utilsService.shouldResetCurrentView(prevConf, currentConf)) {
                this._currentDateView = null;
            }
        }
    }
}
