/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { FocusMonitor } from '@angular/cdk/a11y';
import { BooleanInput, coerceBooleanProperty } from '@angular/cdk/coercion';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  Injector,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  Self,
  ViewChild,
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  NgControl,
  ReactiveFormsModule,
  UntypedFormControl,
  Validators,
} from '@angular/forms';
import {
  MAT_FORM_FIELD,
  MatFormField,
  MatFormFieldControl,
} from '@angular/material/form-field';
import { PhoneNumberType, PhoneNumberUtil } from 'google-libphonenumber';
import { BehaviorSubject, NEVER, ReplaySubject, Subject } from 'rxjs';
import { catchError, map, take, takeUntil, tap } from 'rxjs/operators';
import { COUNTRY_CODES } from './country-codes';
import { QQMAT_TELEPHONE_INPUT_CONFIG_PROVIDER } from './providers';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import {
  MatSelect,
  MatSelectChange,
  MatSelectModule,
} from '@angular/material/select';

interface CountryInfo {
  name: string;
  code: string;
  callingCode: number;
}

const ALL_COUNTRIES_CALLING_CODES = '.*';

/** Data structure for holding telephone number. */
export class ISOTelNumber {
  constructor(public country: string, public national: string) {}
}

@Component({
  standalone: true,
  selector: 'qq-mat-telephone-input',
  template: `
    <!--
    <div
      rol="group"
      class="tel-input-wrapper"
      [formGroup]="parts"
      [attr.aria-labelledby]="_formField?.getLabelId()"
      (focusin)="onFocusIn($event)"
      (focusout)="onFocusOut($event)"
    >
      <select
        #countryCodeSelector
        title="Country Code"
        formControlName="country"
        (change)="onCountryChange($event)"
      >
        <option
          *ngFor="let c of filteredCountries | async"
          value="{{ c.code }}"
          [attr.data-descr]="c.name + '.' + c.callingCode"
        >
          {{ c.name }} +{{ c.callingCode }}
        </option>
      </select>
      <input
        #nationalNumberInput
        formControlName="national"
        type="tel"
        (input)="onNationalNumberChange($event)"
      />
    </div>
-->
    <div class="tel-input-wrapper" [formGroup]="parts">
      <mat-select
        #countryCodeSelector
        formControlName="country"
        (selectionChange)="onCountryChange($event)"
      >
        <mat-option>
          <ngx-mat-select-search
            [placeholderLabel]="searchText"
            [noEntriesFoundLabel]="noEntriesFoundLabel"
            [formControl]="countryFilterCtrl"
          ></ngx-mat-select-search>
        </mat-option>
        <mat-option
          *ngFor="let c of filteredCountries | async"
          [value]="c"
          [attr.data-descr]="c.name + '.' + c.callingCode"
        >
          {{ c.name }} +{{ c.callingCode }}
        </mat-option>
      </mat-select>
      <input
        style="padding-left: 4px"
        #nationalNumberInput
        formControlName="national"
        type="tel"
        (input)="onNationalNumberChange($event)"
      />
    </div>
  `,
  styleUrls: ['./tel-input.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatSelectModule,
    NgxMatSelectSearchModule,
  ],
  providers: [
    { provide: MatFormFieldControl, useExisting: QQMatTelephoneInputComponent },
    // {
    //   provide: NG_VALUE_ACCESSOR,
    //   useExisting: forwardRef(() => QQWebTelInputComponent),
    //   multi: true,
    // },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QQMatTelephoneInputComponent
  implements
    OnInit,
    OnDestroy,
    ControlValueAccessor,
    MatFormFieldControl<ISOTelNumber>
{
  static nextId = 0;

  @ViewChild('countryCodeSelector', { static: true }) countrySelect: MatSelect;
  @ViewChild('nationalNumberInput') nationalInput: ElementRef;

  @Input() mobile = false;
  // A regular expression specified as a string. This will be used to
  // construct a RegExp object, by passing it as the argument.
  @Input() allowedCountries: string;
  @Input() defaultCountry: string = '';

  filter$ = new BehaviorSubject<string>('');
  countries$ = this.filter$.pipe(
    map((searchStr) => {
      const countries = new Array<CountryInfo>();
      const searchStrLower = searchStr.toLocaleLowerCase();
      this.countries.forEach((country) => {
        if (
          `${country.callingCode} ${country.code} ${country.name}`
            .toLocaleLowerCase()
            .includes(searchStrLower)
        ) {
          countries.push(country);
        }
      });
      return countries;
    })
  );

  countries: Array<CountryInfo> = [];
  public filteredCountries: ReplaySubject<CountryInfo[]> = new ReplaySubject<
    CountryInfo[]
  >(1);

  isDisabled = false;

  private _onChange = (_: any) => {};
  private control: UntypedFormControl;
  private onCountrySelectFocus: () => void;
  private onCountrySelectBlur: () => void;

  phoneUtil: any = PhoneNumberUtil.getInstance();

  parts: FormGroup<{
    country: FormControl<CountryInfo | null>;
    national: FormControl<string | null>;
  }>;
  stateChanges = new Subject<void>();
  focused = false;
  touched = false;
  controlType = 'qq-tel-input';
  id = `qq-tel-input-${QQMatTelephoneInputComponent.nextId++}`;
  onChange = (_: any) => {};
  onTouched = () => {};

  public telForm = new FormGroup({});
  /** control for the MatSelect filter keyword */
  public countryFilterCtrl: FormControl<string> = new FormControl<string>('');

  get empty() {
    const {
      value: { country, national },
    } = this.parts;

    return !country && !national;
  }

  get shouldLabelFloat() {
    return this.focused || !this.empty;
  }

  @Input('aria-describedby') userAriaDescribedBy: string;

  @Input()
  get placeholder(): string {
    return this._placeholder;
  }
  set placeholder(value: string) {
    this._placeholder = value;
    this.stateChanges.next();
  }
  private _placeholder: string;

  @Input()
  get required(): boolean {
    return this._required;
  }
  set required(value: BooleanInput) {
    this._required = coerceBooleanProperty(value);
    this.stateChanges.next();
  }
  private _required = false;

  @Input() searchText = '';
  @Input() noEntriesFoundLabel = 'Not found';
  @Input()
  get disabled(): boolean {
    return this._disabled;
  }
  set disabled(value: BooleanInput) {
    this._disabled = coerceBooleanProperty(value);
    this._disabled ? this.parts.disable() : this.parts.enable();
    this.stateChanges.next();
  }
  private _disabled = false;
  destroy = new Subject<void>();

  @Input()
  get value(): ISOTelNumber | null {
    if (this.parts.valid) {
      const {
        value: { country, national },
      } = this.parts;
      return new ISOTelNumber(`${country.callingCode}`, national!);
    }
    return null;
  }
  set value(tel: ISOTelNumber | null) {
    const { country, national } = tel || new ISOTelNumber('', '');
    let ci: CountryInfo = undefined;
    if (country) {
      ci = this.countries.find(
        (ci: CountryInfo) => `${ci.callingCode}` == country
      );
    }
    // this.phoneUtil.
    this.parts.setValue({ country: ci, national });
    this.stateChanges.next();
  }

  get errorState(): boolean {
    return this.parts.invalid && this.touched;
  }

  onFocusIn(event: FocusEvent) {
    if (!this.focused) {
      this.focused = true;
      this.stateChanges.next();
    }
  }

  onFocusOut(event: FocusEvent) {
    if (
      !this._elementRef.nativeElement.contains(event.relatedTarget as Element)
    ) {
      this.touched = true;
      this.focused = false;
      this.onTouched();
      this.stateChanges.next();
    }
  }

  autoFocusNext(
    control: AbstractControl,
    nextElement?: HTMLInputElement
  ): void {
    if (!control.errors && nextElement) {
      this._focusMonitor.focusVia(nextElement, 'program');
    }
  }

  autoFocusPrev(control: AbstractControl, prevElement: HTMLInputElement): void {
    if (control.value.length < 1) {
      this._focusMonitor.focusVia(prevElement, 'program');
    }
  }

  setDescribedByIds(ids: string[]) {
    const controlElement = this._elementRef.nativeElement.querySelector(
      '.qq-tel-input-container'
    )!;
    if (controlElement) {
      controlElement.setAttribute('aria-describedby', ids.join(' '));
    }
  }

  onContainerClick() {
    // this._focusMonitor.focusVia(this.countrySelect, 'program');
    // if (this.parts.controls.national.valid) {
    //   this._focusMonitor.focusVia(this.nationalInput, 'program');
    // } else if (this.parts.controls.country.valid) {
    //   this._focusMonitor.focusVia(this.nationalInput, 'program');
    // // } else if (this.parts.controls.national.valid) {
    // //   this._focusMonitor.focusVia(this.nationalInput, 'program');
    // } else {
    //   this._focusMonitor.focusVia(this.countrySelect, 'program');
    // }
  }

  constructor(
    private injector: Injector,
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
    private _focusMonitor: FocusMonitor,
    private _elementRef: ElementRef<HTMLElement>,
    @Optional() @Inject(MAT_FORM_FIELD) public _formField: MatFormField,
    @Optional() @Self() public ngControl: NgControl,
    formBuilder: FormBuilder
  ) {
    if (this.ngControl != null) {
      this.ngControl.valueAccessor = this;
    }

    this.parts = formBuilder.group({
      country: [undefined as CountryInfo, Validators.required],
      national: ['', Validators.required],
    });

    this.initCountries();
  }

  ngOnInit(): void {
    this.initCountries();
    // this.onCountrySelectFocus = () => {
    //   const options = (this.countrySelect.nativeElement as HTMLSelectElement).options;
    //   [].forEach.call(options, function(o: any) {
    //     const countryInfo: string = o.getAttribute('data-descr');
    //     const [name, callingCode] = countryInfo.split('.');
    //     o.textContent = name + ' (' + callingCode + ')';
    //   });
    // }
    // this.onCountrySelectBlur = () => {
    //   const options = (this.countrySelect.nativeElement as HTMLSelectElement).options;
    //   [].forEach.call(options, function(o: any) {
    //     const countryInfo: string = o.getAttribute('data-descr');
    //     const [name, callingCode] = countryInfo.split('.');
    //     o.textContent = '+' + callingCode;
    //   });
    // }
    // this.countrySelect.nativeElement.addEventListener('focus', this.onCountrySelectFocus);
    // this.countrySelect.nativeElement.addEventListener('blur', this.onCountrySelectBlur);

    if (this.defaultCountry) {
      const country = this.countries.find(
        (ci) => ci.code == this.defaultCountry
      );
      this.parts.controls.country.setValue(country);
    }

    this.filteredCountries.next(this.countries.slice());

    // listen for search field value changes
    this.countryFilterCtrl.valueChanges
      .pipe(takeUntil(this.destroy))
      .subscribe(() => {
        this.filterCountries();
      });
  }

  protected setInitialValue() {
    this.filteredCountries
      .pipe(take(1), takeUntil(this.destroy))
      .subscribe(() => {
        // Setting the compareWith property to a comparison function
        // triggers initializing the selection according to the initial value of
        // the form control (i.e. _initializeSelection()).
        // This needs to be done after the filteredCountries are loaded
        // initially and after the mat-option elements are available.
        this.countrySelect.compareWith = (a: CountryInfo, b: CountryInfo) =>
          a && b && a.code === b.code;
      });
  }

  private filterCountries() {
    if (!this.countries) {
      return;
    }
    // get the search keyword
    let search = this.countryFilterCtrl.value;
    if (!search) {
      this.filteredCountries.next(this.countries.slice());
      return;
    }
    search = search.toLowerCase();
    // filter the banks
    this.filteredCountries.next(
      this.countries.filter(
        (country) =>
          country.name.toLowerCase().indexOf(search) > -1 ||
          country.callingCode.toString().indexOf(search) > -1 ||
          country.code.toLowerCase().indexOf(search) > -1
      )
    );
  }

  ngAfterViewInit() {
    const ngControl: NgControl = this.injector.get(NgControl, null);
    if (ngControl) {
      this.control = ngControl.control as UntypedFormControl;
    }
    this.disableComponents();

    if (!this.parts.controls.country.value) {
      this.detectCountry();
    } else {
      this.setInitialValue();
    }
  }

  ngOnDestroy() {
    // this.countrySelect.nativeElement.removeAllListners();
    this.destroy.next();
    this.destroy.complete();
    this.stateChanges.complete();
    this._focusMonitor.stopMonitoring(this._elementRef);
  }
  /**
   * Set the country code to the given code.
   *
   * @param code Numeric country code to set the value of the country
   * ion-select to. Will validate the code against a built-in country
   * code list.
   */
  setCountryCode(code: string) {
    code = code.trim();
    if (code.startsWith('+')) {
      code = code.substring(1);
    }
    for (let index = 0; index < this.countries.length; index++) {
      const country = this.countries[index];
      if (`${country.callingCode}` === code) {
        this.parts.controls.country.setValue(country);
        this.cdr.detectChanges();
      }
    }
  }

  // ControlValueAccessor interface methods
  writeValue(telNumber: string): void {
    // Check the supplied number string can be converted into a numeric value.
    try {
      if (telNumber) {
        const phoneNumber = this.phoneUtil.parse(telNumber);
        if (phoneNumber) {
          const cc = phoneNumber.getCountryCode();
          const country = this.countries.find((ci) => ci.callingCode === cc);
          if (country) {
            this.parts.controls.country.setValue(country);
            this.parts.controls.national.setValue(
              phoneNumber.getNationalNumber()
            );
          }
        }
      } else {
        // null value usually means form-reset. Clear national number
        // and leave selected country code intact.
        this.parts.controls.country.setValue(null);
        this.parts.controls.national.setValue(null);
        this.parts.controls.country.setErrors(null);
        this.parts.controls.national.setErrors(null);
        this.parts.setErrors(null);
      }
      this.cdr.detectChanges();
    } catch (error) {
      // empty
    }
  }

  registerOnChange(fn: any): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: any): void {}

  setDisabledState(isDisabled: boolean) {
    this.isDisabled = isDisabled;
    if (this.countrySelect && this.nationalInput) {
      this.disableComponents();
    }
  }

  onCountryChange(ev: MatSelectChange) {
    const telNumberParts = this.getTelephoneNumberParts();
    if (telNumberParts) {
      this.notifyChange(telNumberParts);
      this.control.setErrors(null);
    } else {
      if (this.control) {
        this.control.setErrors({ invalidPhoneNumber: true });
        this.cdr.detectChanges();
      }
    }
  }

  onNationalNumberChange(ev: Event) {
    const telNumberParts = this.getTelephoneNumberParts();
    if (telNumberParts) {
      this.notifyChange(telNumberParts);
      this.control.setErrors(null);
    } else {
      if (this.control) {
        this.control.setErrors({ invalidPhoneNumber: true });
        this.cdr.detectChanges();
      }
    }
  }

  /**
   * Returns the telephone number in ISO8601 format.
   * @param numberParts
   * @returns
   */
  private ISOTelephoneNumber(
    numberParts: CountryInfo & { nationalNumber: string }
  ) {
    return `+${numberParts.callingCode}${numberParts.nationalNumber}`;
  }

  private notifyChange(numberParts: CountryInfo & { nationalNumber: string }) {
    const geoLocationProvider = this.injector.get(
      QQMAT_TELEPHONE_INPUT_CONFIG_PROVIDER,
      null
    );
    if (geoLocationProvider && geoLocationProvider.saveCountrySelection) {
      geoLocationProvider
        .saveCountrySelection(numberParts)
        .then(() => this._onChange(this.ISOTelephoneNumber(numberParts)))
        .catch(() => {});
    } else {
      this._onChange(this.ISOTelephoneNumber(numberParts));
    }
  }

  get placeholderText() {
    let placeholderText = this.placeholder;
    if (this.required) {
      placeholderText = placeholderText + '*';
    }
    return placeholderText;
  }

  get hasErrors() {
    return this.control && this.control.hasError('invalidPhoneNumber');
  }

  private disableComponents() {
    const action = this.isDisabled ? 'addClass' : 'removeClass';
    if (this.countrySelect) {
      //this.countryCodeSelector.disabled = this.isDisabled;
    }
    if (this.nationalInput) {
      //this.nationalNumberInput.disabled = this.isDisabled;
    }
  }

  /**
   * Returns the full telephone number, combining the selected
   * country code with the national number.
   *
   * Leading zeros in the national number are removed.
   *
   * Validates the entered number using google-libphonenumber and if
   * invalid, returns an empty string.
   */
  private getTelephoneNumberParts(): CountryInfo & { nationalNumber: string } {
    const selectedCountry: CountryInfo = this.parts.controls.country.value;
    const nationalNumber = this.parts.controls.national.value;
    try {
      const ci = this.countries.find(
        (ci: CountryInfo) => ci.callingCode == selectedCountry.callingCode
      );
      const phoneNumber = this.phoneUtil.parse(nationalNumber, ci.code);
      if (this.phoneUtil.isValidNumberForRegion(phoneNumber, ci.code)) {
        const numberType = this.phoneUtil.getNumberType(phoneNumber);
        // console.log(`Valid phone number for country ${ci.code}: ${this.phoneUtil.format(phoneNumber, PhoneNumberFormat.E164)}, type: ${numberType}`);
        if (!this.mobile || numberType === PhoneNumberType.MOBILE) {
          // const fullNumber = this.phoneUtil.format(phoneNumber, PhoneNumberFormat.E164);
          // console.log('full tel number:', fullNumber);
          return { ...ci, nationalNumber };
        }
      }
    } catch (err) {
      // empty
    }
    return null;
  }

  private getAllowedCountries() {
    if (this.allowedCountries) {
      return this.allowedCountries;
    }
    const geoLocationProvider = this.injector.get(
      QQMAT_TELEPHONE_INPUT_CONFIG_PROVIDER,
      null
    );
    return geoLocationProvider && geoLocationProvider.countries
      ? geoLocationProvider.countries
      : ALL_COUNTRIES_CALLING_CODES;
  }

  private detectCountry() {
    const geoLocationProvider = this.injector.get(
      QQMAT_TELEPHONE_INPUT_CONFIG_PROVIDER,
      null
    );
    if (geoLocationProvider && geoLocationProvider.getCountryCode) {
      geoLocationProvider
        .getCountryCode(this.http)
        .pipe(
          tap((res) => {
            // console.log(`detectCountry response: ${JSON.stringify(res)}`);
            if (res.countryCode) {
              const cc = COUNTRY_CODES.find((cc) => cc.code == res.countryCode);
              if (cc && !this.parts.controls.country.value) {
                this.parts.controls.country.setValue(cc);
                this.cdr.detectChanges();
              }
            }
          }),
          catchError((err) => {
            // console.log(`detectCountry error: ${JSON.stringify(err)}`);
            return NEVER;
          })
        )
        .subscribe();
    } else {
      // console.log(`QQMAT_TELEPHONE_INPUT_CONFIG_PROVIDER not available`);
    }
  }

  // Initialize this.countries if it's not already been initialized.
  private initCountries() {
    if (!this.countries.length) {
      // determine countries we support
      const ccRegex = new RegExp(this.getAllowedCountries());
      COUNTRY_CODES.forEach((c) => {
        if (ccRegex.test(c.code)) {
          this.countries.push(c);
        }
      });
      this.countries = this.countries.sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    }
  }
}
