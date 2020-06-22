import * as momentNs from 'jalali-moment';
const moment = momentNs;
import {
    IDate,
    INavEvent,
    CalendarMode,
    DateValidator,
    ECalendarMode,
    CalendarValue,
    ECalendarValue,
    SingleCalendarValue
} from '../common/models/calendar.model';
import { DomHelper } from '../common/services/dom-appender/dom-appender.service';
import { UtilsService } from '../common/services/utils/utils.service';
import { IDayCalendarConfig } from '../day-calendar/day-calendar-config.model';
import { DayCalendarComponent } from '../day-calendar/day-calendar.component';
import { DayCalendarService } from '../day-calendar/day-calendar.service';
import { ITimeSelectConfig } from '../time-select/time-select-config.model';
import { TimeSelectService } from '../time-select/time-select.service';
import { IDatePickerConfig, IDatePickerConfigInternal } from './date-picker-config.model';
import { IDpDayPickerApi } from './date-picker.api';
import { DatePickerService } from './date-picker.service';
import { Moment, unitOfTime } from 'jalali-moment';
import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    forwardRef,
    HostBinding,
    HostListener,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    SimpleChanges,
    ViewChild,
    ViewEncapsulation,
    Renderer2
} from '@angular/core';
import {
    ControlValueAccessor,
    FormControl,
    NG_VALIDATORS,
    NG_VALUE_ACCESSOR,
    ValidationErrors,
    Validator
} from '@angular/forms';

@Component({
    selector: 'ngx-jdatepicker',
    templateUrl: 'date-picker.component.html',
    styleUrls: ['date-picker.component.less'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        DatePickerService,
        DayCalendarService,
        TimeSelectService,
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DatePickerComponent),
            multi: true
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => DatePickerComponent),
            multi: true
        }
    ]
})
export class DatePickerComponent implements OnChanges,
    OnInit,
    AfterViewInit,
    ControlValueAccessor,
    Validator,
    OnDestroy {
    isInitialized: boolean = false;
    @Input() config: IDatePickerConfig;
    @Input() mode: CalendarMode = 'day';
    @Input() placeholder: string = '';
    @Input() disabled: boolean = false;
    @Input() displayDate: SingleCalendarValue;
    @HostBinding('class') @Input() theme: string;
    @Input() minDate: SingleCalendarValue;
    @Input() maxDate: SingleCalendarValue;
    @Input() minTime: SingleCalendarValue;
    @Input() maxTime: SingleCalendarValue;

    @Output() open = new EventEmitter<void>();
    @Output() close = new EventEmitter<void>();
    @Output() onChange = new EventEmitter<CalendarValue>();
    @Output() onGoToCurrent: EventEmitter<ECalendarMode> = new EventEmitter();
    @Output() onSwitchLocale: EventEmitter<string> = new EventEmitter();
    @Output() onTimeView: EventEmitter<ECalendarMode> = new EventEmitter();
    @Output() onLeftNav: EventEmitter<INavEvent> = new EventEmitter();
    @Output() onRightNav: EventEmitter<INavEvent> = new EventEmitter();
    @Output() onLeftSecondaryNav: EventEmitter<INavEvent> = new EventEmitter();
    @Output() onRightSecondaryNav: EventEmitter<INavEvent> = new EventEmitter();

    @ViewChild('container', {static: false}) calendarContainer: ElementRef;
    @ViewChild('dayCalendar', {static: false}) dayCalendarRef: DayCalendarComponent;

    CalendarMode: ECalendarMode;
    componentConfig: IDatePickerConfigInternal;
    dayCalendarConfig: IDayCalendarConfig;
    timeSelectConfig: ITimeSelectConfig;
    _areCalendarsShown: boolean = false;
    hideStateHelper: boolean = false;
    _mode: CalendarMode = 'day';
    _selected: Moment[] = [];
    inputValue: CalendarValue;
    inputValueType: ECalendarValue;
    isFocusedTrigger: boolean = false;
    _currentDateView: Moment;
    inputElementValue: string;
    calendarWrapper: HTMLElement;
    appendToElement: HTMLElement;
    inputElementContainer: HTMLElement;
    popupElem: HTMLElement;
    handleInnerElementClickUnlisteners: Function[] = [];
    globalListnersUnlisteners: Function[] = [];
    validateFn: DateValidator;
    api: IDpDayPickerApi = {
        open: this.showCalendars.bind(this),
        close: this.hideCalendar.bind(this),
        moveCalendarTo: this.moveCalendarTo.bind(this)
    };

    set selected(selected: Moment[]) {
        this._selected = selected;
        this.inputElementValue = (<string[]>this.utilsService
            .convertFromMomentArray(this.componentConfig.format, selected, ECalendarValue.StringArr, this.componentConfig.locale))
            .join(' | ');
        const val = this.processOnChangeCallback(selected);
        this.onChangeCallback(val, false);
        this.onChange.emit(val);
    }

    get selected(): Moment[] {
        return this._selected;
    }

    get areCalendarsShown(): boolean {
        return this._areCalendarsShown;
    }

    get openOnFocus(): boolean {
        return this.componentConfig.openOnFocus;
    }

    get openOnClick(): boolean {
        return this.componentConfig.openOnClick;
    }

    set areCalendarsShown(value: boolean) {
        if (value) {
            this.startGlobalListeners();
            this.domHelper.appendElementToPosition({
                container: this.appendToElement,
                element: this.calendarWrapper,
                anchor: this.inputElementContainer,
                dimElem: this.popupElem,
                drops: this.componentConfig.drops,
                opens: this.componentConfig.opens
            });
        } else {
            this.stopGlobalListeners();
            this.dayPickerService.pickerClosed();
        }

        this._areCalendarsShown = value;
    }

    get currentDateView(): Moment {
        return this._currentDateView;
    }

    set currentDateView(date: Moment) {
        this._currentDateView = date;

        if (this.dayCalendarRef) {
            this.dayCalendarRef.moveCalendarTo(date);
        }

        // if (this.monthCalendarRef) {
        //     this.monthCalendarRef.moveCalendarTo(date);
        // }
    }

    constructor(private readonly dayPickerService: DatePickerService,
        private readonly domHelper: DomHelper,
        private readonly elemRef: ElementRef,
        private readonly renderer: Renderer2,
        private readonly utilsService: UtilsService,
        public readonly cd: ChangeDetectorRef) {
    }

    @HostListener('click')
    onClick() {
        if (!this.openOnClick) {
            return;
        }

        if (!this.isFocusedTrigger && !this.disabled) {
            this.hideStateHelper = true;
            if (!this.areCalendarsShown) {
                this.showCalendars();
            }
        }
    }

    onBodyClick() {
        if (this.componentConfig.hideOnOutsideClick) {
            if (!this.hideStateHelper && this.areCalendarsShown) {
                this.hideCalendar();
            }

            this.hideStateHelper = false;
        }
    }

    @HostListener('window:resize')
    onScroll() {
        if (this.areCalendarsShown) {
            this.domHelper.setElementPosition({
                container: this.appendToElement,
                element: this.calendarWrapper,
                anchor: this.inputElementContainer,
                dimElem: this.popupElem,
                drops: this.componentConfig.drops,
                opens: this.componentConfig.opens
            });
        }
    }

    writeValue(value: CalendarValue): void {
        this.inputValue = value;

        if (value || value === '') {
            this.selected = this.utilsService
                .convertToMomentArray(value, this.componentConfig.format, this.componentConfig.allowMultiSelect, this.componentConfig.locale);
            this.currentDateView = this.selected.length
                ? this.utilsService.getDefaultDisplayDate(null, this.selected, this.componentConfig.allowMultiSelect,
                    this.componentConfig.min, this.componentConfig.locale)
                : this.currentDateView;
            this.init();
        } else {
            this.selected = [];
        }

        this.cd.markForCheck();
    }

    registerOnChange(fn: any): void {
        this.onChangeCallback = fn;
    }

    onChangeCallback(_: any, changedByInput: boolean) {
    };

    registerOnTouched(fn: any): void {
    }

    validate(formControl: FormControl): ValidationErrors {
        return this.validateFn(formControl.value);
    }

    processOnChangeCallback(selected: Moment[] | string): CalendarValue {
        if (typeof selected === 'string') {
            return selected;
        } else {
            return this.utilsService.convertFromMomentArray(
                this.componentConfig.format,
                selected,
                this.componentConfig.returnedValueType || this.inputValueType,
                this.componentConfig.locale
            );
        }
    }

    initValidators() {
        this.validateFn = this.utilsService.createValidator(
            {
                minDate: this.minDate,
                maxDate: this.maxDate,
                minTime: this.minTime,
                maxTime: this.maxTime
            }, this.componentConfig.format, this._mode, this.componentConfig.locale);
        this.onChangeCallback(this.processOnChangeCallback(this.selected), false);
    }

    ngOnInit() {
        this.isInitialized = true;
        this.init();
        this.initValidators();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (this.isInitialized) {
            const { minDate, maxDate, minTime, maxTime } = changes;

            this.init();

            if (minDate || maxDate || minTime || maxTime) {
                this.initValidators();
            }
        }
    }

    ngAfterViewInit() {
        this.setElementPositionInDom();
    }

    setDisabledState(isDisabled: boolean) {
        this.disabled = isDisabled;
    }

    setElementPositionInDom() {
        this.calendarWrapper = <HTMLElement>this.calendarContainer.nativeElement;
        this.setInputElementContainer();
        this.popupElem = this.elemRef.nativeElement.querySelector('.dp-popup');
        this.handleInnerElementClick(this.popupElem);

        const { appendTo } = this.componentConfig;
        if (appendTo) {
            if (typeof appendTo === 'string') {
                this.appendToElement = <HTMLElement>document.querySelector(<string>appendTo);
            } else {
                this.appendToElement = <HTMLElement>appendTo;
            }
        } else {
            this.appendToElement = this.elemRef.nativeElement;
        }

        this.appendToElement.appendChild(this.calendarWrapper);
    }

    setInputElementContainer() {
        this.inputElementContainer = this.utilsService.getNativeElement(this.componentConfig.inputElementContainer)
            || this.elemRef.nativeElement.querySelector('.dp-input-container')
            || document.body;
    }

    handleInnerElementClick(element: HTMLElement) {
        this.handleInnerElementClickUnlisteners.push(
            this.renderer.listen(element, 'click', () => {
                this.hideStateHelper = true;
            })
        );
    }

    init() {
        this.componentConfig = this.dayPickerService.getConfig(this.config, this._mode);
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
        this.inputValueType = this.utilsService.getInputType(this.inputValue, this.componentConfig.allowMultiSelect);
        this.dayCalendarConfig = this.dayPickerService.getDayConfigService(this.componentConfig);
        this.timeSelectConfig = this.dayPickerService.getTimeConfigService(this.componentConfig);
        this._mode = this.mode;
    }

    inputFocused() {
        if (!this.openOnFocus) {
            return;
        }

        this.isFocusedTrigger = true;
        setTimeout(() => {
            this.hideStateHelper = false;

            if (!this.areCalendarsShown) {
                this.showCalendars();
            }

            this.isFocusedTrigger = false;
        }, this.componentConfig.onOpenDelay);
    }

    showCalendars() {
        this.hideStateHelper = true;
        this.areCalendarsShown = true;

        // if (this.timeSelectRef) {
        //     this.timeSelectRef.api.triggerChange();
        // }

        this.open.emit();
        this.cd.markForCheck();
    }

    hideCalendar() {
        this.hideStateHelper = false;
        this.areCalendarsShown = false;
        // if (this.dayCalendarRef) {
        //     this.dayCalendarRef.api.toggleCalendarMode(ECalendarMode.Day);
        // }

        this.close.emit();
        this.cd.markForCheck();
    }

    onViewDateChange(value: CalendarValue) {
        let strVal = value ? this.utilsService.convertToString(value, this.componentConfig.format, this.componentConfig.locale) : '';
        if (this.dayPickerService.isValidInputDateValue(strVal, this.componentConfig)) {
            if (strVal && this.componentConfig.locale === 'fa') {
                // convert jalali to gregorian
                strVal = moment.from(strVal, 'fa', this.componentConfig.format).format(this.componentConfig.format);
            }
            this.selected = this.dayPickerService.convertInputValueToMomentArray(strVal, this.componentConfig);
            this.currentDateView = this.selected.length
                ? this.utilsService.getDefaultDisplayDate(
                    null,
                    this.selected,
                    this.componentConfig.allowMultiSelect,
                    this.componentConfig.min,
                    this.componentConfig.locale
                )
                : this.currentDateView;
        } else {
            this._selected = this.utilsService
                .getValidMomentArray(strVal, this.componentConfig.format, this.componentConfig.locale);
            this.onChangeCallback(this.processOnChangeCallback(strVal), true);
        }
    }

    dateSelected(date: IDate, granularity: unitOfTime.Base, close: boolean = false) {
        this.selected = this.utilsService
            .updateSelected(this.componentConfig.allowMultiSelect, this.selected, date, granularity);
        if (close && this.onViewDateChange) {
            this.onDateClick();
        }
        // console.log(this._mode);
        
        // if (close) this.hideCalendar();
    }

    modeChange(mode: CalendarMode) {
        this._mode = mode;
    }

    onDateClick() {
        if (this.componentConfig.closeOnSelect) {
            setTimeout(this.hideCalendar.bind(this), this.componentConfig.closeOnSelectDelay);
        }
    }

    onKeyPress(event: KeyboardEvent) {
        switch (event.keyCode) {
            case (9):
            case (27):
                this.hideCalendar();
                break;
        }
    }

    moveCalendarTo(date: SingleCalendarValue) {
        const momentDate = this.utilsService.convertToMoment(date, this.componentConfig.format, this.componentConfig.locale);
        this.currentDateView = momentDate;
    }

    onLeftNavClick(change: INavEvent) {
        this.onLeftNav.emit(change);
    }
    onRightNavClick(change: INavEvent) {
        this.onRightNav.emit(change);
    }

    onLeftSecondaryNavClick(change) {
        this.onLeftSecondaryNav.emit(change);
    }
    onRightSecondaryNavClick(change) {
        this.onRightSecondaryNav.emit(change);
    }

    startGlobalListeners() {
        this.globalListnersUnlisteners.push(
            this.renderer.listen(document, 'keydown', (e: KeyboardEvent) => {
                this.onKeyPress(e);
            }),
            this.renderer.listen(document, 'scroll', () => {
                this.onScroll();
            }),
            this.renderer.listen(document, 'click', () => {
                this.onBodyClick();
            })
        );
    }

    switchLocale(event) {
        this.changeLocale(this.componentConfig.locale === 'fa' ? 'en' : 'fa');
        this.onSwitchLocale.emit(this.componentConfig.locale);
    }

    changeLocale(locale) {
        this.dayCalendarConfig = { ...this.dayCalendarConfig, ...{ locale } };
        this.componentConfig.locale = locale;
    }

    stopGlobalListeners() {
        this.globalListnersUnlisteners.forEach((ul) => ul());
        this.globalListnersUnlisteners = [];
    }

    ngOnDestroy() {
        this.handleInnerElementClickUnlisteners.forEach(ul => ul());

        if (this.appendToElement) {
            this.appendToElement.removeChild(this.calendarWrapper);
        }
    }
}
