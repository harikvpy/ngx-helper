import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  HostBinding,
  HostListener,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  Self,
  ViewChild,
} from '@angular/core';
import {
  ControlValueAccessor,
  NgControl,
  ReactiveFormsModule,
  UntypedFormControl,
  Validators,
} from '@angular/forms';
import {
  MAT_FORM_FIELD,
  MatFormField,
  MatFormFieldControl,
  MatFormFieldModule,
} from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { Subject, filter, takeUntil } from 'rxjs';

let nextId = 0;

function isValidHttpUrl(urlStr: string) {
  let url: URL;

  try {
    url = new URL(urlStr);
  } catch (_) {
    return false;
  }
  return url.protocol === 'http:' || url.protocol === 'https:';
}

function isImageFileExt(filename: string): boolean {
  const IMAGE_EXTS = ['jpeg', 'jpg', 'png', 'gif', 'webp', 'bmp', 'tiff'];
  const parts = filename.split('.');
  const EXT = parts[parts.length - 1].toLowerCase();
  for (let index = 0; index < IMAGE_EXTS.length; index++) {
    const ext = IMAGE_EXTS[index];
    if (EXT === ext) {
      return true;
    }
  }
  return false;
}

@Component({
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatIconModule,
    ],
    selector: 'qq-mat-file-input',
    template: `
    <div class="wrapper">
      <div class="filename-wrapper">
        <input
          type="file"
          hidden
          [accept]="acceptedFileTypes"
          [multiple]="false"
          (change)="onFileSelected($event)"
          #input
        />
        <div tabindex="0">{{ fileName || placeholder }}</div>
      </div>
      <div class="thumbnail-wrapper">
        <div
          class="thumbnail"
          *ngIf="thumbnailImageUrl; else paperClipIcon"
          [ngStyle]="{ 'background-image': 'url(' + thumbnailImageUrl + ')' }"
        ></div>
        <ng-template #paperClipIcon>
          <mat-icon fontIcon="attach_file"></mat-icon>
        </ng-template>
      </div>
    </div>
  `,
    styles: [
        `
      .wrapper {
        display: flex;
        flex-direction: row;
        cursor: pointer;
      }
      .filename-wrapper {
        flex-grow: 1 !important;
        flex-wrap: wrap;
      }
      .thumbnail-wrapper {
      }
      .thumbnail {
        display: inline-block;
        border-radius: inherit;
        background-image: linear-gradient(lightgray, gray);
        background-size: cover;
        background-repeat: no-repeat;
        background-position: center;
        border-radius: 50%;
        min-width: 32px;
        min-height: 32px;
        margin-top: -7px;
        margin-bottom: -9px;
      }
      .size-small {
        width: 32px;
        height: 32px;
      }
      .size-medium {
        width: 64px;
        height: 64px;
      }
      .size-large {
        width: 96px;
        height: 96px;
      }
    `,
    ],
    providers: [
        { provide: MatFormFieldControl, useExisting: QQMatFileInputComponent },
    ]
})
export class QQMatFileInputComponent
  implements
    ControlValueAccessor,
    MatFormFieldControl<File[]>,
    OnInit,
    OnDestroy
{
  // @Input() label: string = 'File';
  @Input() accept: string = '*';
  @Input() thumbnailImageUrl: string = '';
  @Input() imageFile: boolean = false;

  _fileName = '';

  @ViewChild('input', { read: ElementRef }) inputFileUpload:
    | ElementRef
    | undefined;
  fileControl = new UntypedFormControl(undefined, Validators.required);

  static nextId = 0;
  stateChanges = new Subject<void>();
  focused = false;
  errorState = false;
  controlType = 'lib-file-upload';
  // eslint-disable-next-line no-plusplus
  id = `lib-file-upload-${nextId++}`;
  describedBy = '';
  // eslint-disable-next-line no-underscore-dangle
  private _multiple: boolean = false;

  @HostBinding('attr.aria-describedby') ariaDescribedby: string | undefined;
  // @ts-ignore
  _value: File[] | null;

  get empty() {
    return !this.fileControl.value;
  }

  get shouldLabelFloat() {
    return this.focused || !this.empty;
  }

  get acceptedFileTypes() {
    if (this.imageFile) {
      return 'image/jpeg,image/png,image/gif,image/webp';
    }
    return this.accept;
  }

  @Input()
  get multiple(): boolean {
    // eslint-disable-next-line no-underscore-dangle
    return this._multiple;
  }
  set multiple(value: boolean | string) {
    // eslint-disable-next-line no-underscore-dangle
    this._multiple = coerceBooleanProperty(value);
    this.stateChanges.next();
  }

  @Input()
  get placeholder(): string {
    // eslint-disable-next-line no-underscore-dangle
    return this._placeholder;
  }
  set placeholder(value: string) {
    // eslint-disable-next-line no-underscore-dangle
    this._placeholder = value;
    this.stateChanges.next();
  }
  // eslint-disable-next-line no-underscore-dangle
  private _placeholder: string = '';
  @Input()
  get required(): boolean {
    // eslint-disable-next-line no-underscore-dangle
    return this._required;
  }
  set required(value: boolean) {
    if (value) {
      this.fileControl.setValidators(Validators.required);
    }
    // eslint-disable-next-line no-underscore-dangle
    this._required = coerceBooleanProperty(value);
    this.stateChanges.next();
  }
  // eslint-disable-next-line no-underscore-dangle
  private _required = false;
  private _disabled = false;
  private destroy$ = new Subject<void>();

  @Input()
  get disabled(): boolean {
    // eslint-disable-next-line no-underscore-dangle
    return this._disabled;
  }
  set disabled(value: boolean) {
    if (value) {
      this.fileControl.disable();
    } else {
      this.fileControl.enable();
    }
    // eslint-disable-next-line no-underscore-dangle
    this._disabled = coerceBooleanProperty(value);
    this.stateChanges.next();
  }

  // @Input()
  get fileName(): string {
    return this._fileName || '';
  }
  // set fileName(filename: string) {
  //   const parts = filename.split('/');
  //   this._fileName = parts[parts.length - 1];
  //   if (isValidHttpUrl(filename) && isImageFileExt(filename)) {
  //     this.thumbnailImageUrl = filename;
  //   }
  //   this.stateChanges.next();
  // }

  @Input()
  get value(): File[] | null {
    return this.fileControl.value;
  }

  set value(files: File[] | string | null) {
    if (files instanceof File || Array.isArray(files)) {
      this.fileControl.setValue(files);
    } else if (typeof files == 'string') {
      const filename = files;
      const parts = filename.split('/');
      this._fileName = parts[parts.length - 1];
      if (isValidHttpUrl(filename) && isImageFileExt(filename)) {
        this.thumbnailImageUrl = filename;
      }
    }
    this.stateChanges.next();
  }

  constructor(
    @Optional() @Inject(MAT_FORM_FIELD) public _formField: MatFormField,
    @Optional() @Self() public ngControl: NgControl
  ) {
    // eslint-disable-next-line no-param-reassign
    if (this.ngControl != null) {
      this.ngControl.valueAccessor = this;
    }
    this.fileControl.statusChanges
      .pipe(
        takeUntil(this.destroy$),
        filter(() => this.fileControl.dirty || this.fileControl.touched)
      )
      .subscribe((status) => {
        this.errorState = status === 'INVALID';
        this.stateChanges.next();
      });
  }

  setDescribedByIds(ids: string[]) {
    this.describedBy = ids.join(' ');
  }

  @HostListener('document:keypress', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key == ' ') {
      this.onContainerClick(event);
    }
  }

  onContainerClick(event: MouseEvent | KeyboardEvent) {
    if (
      !this.disabled &&
      (event.target as Element).tagName.toLowerCase() !== 'input'
    ) {
      this.inputFileUpload?.nativeElement.focus();
      this.inputFileUpload?.nativeElement.click();
      this.focused = true;
      this.fileControl.markAsTouched();
      this.fileControl.updateValueAndValidity();
      this.stateChanges.next();
    }
  }

  writeValue(files: File[]): void {
    this.value = files;
    this.fileControl.setValue(files);
  }

  registerOnChange(fn: any): void {
    this.fileControl.valueChanges.subscribe(fn);
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  onTouched = () => {};

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onFileSelected(event: any) {
    // eslint-disable-next-line prefer-destructuring
    const files: File[] = event.target.files; // (event.target as HTMLInputElement)?.files
    if (files && files.length > 0) {
      this._fileName =
        files.length > 1 ? `${files.length} files to upload` : files[0].name;
      this.fileControl.setValue(files);
      this.value = files;
      if (files.length == 1 && isImageFileExt(files[0].name)) {
        this.generateLocalThumbnail(files[0]);
      }
      this.onTouched();
      this.stateChanges.next();
    }
  }

  ngOnInit(): void {}

  ngOnDestroy() {
    this.stateChanges.complete();
    this.destroy$.next();
    this.destroy$.complete();
  }

  generateLocalThumbnail(file: File) {
    this.thumbnailImageUrl = '';
    // console.log(`generateLocalThumbnail - file: ${file.name}`);
  }
}
