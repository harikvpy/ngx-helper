import { ChangeDetectionStrategy, ChangeDetectorRef, Component, FactoryProvider, LOCALE_ID, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { errorMessagesEnFactory, NGX_MAT_ERROR_CONFIG_EN, NGX_MAT_ERROR_DEFAULT_OPTIONS, NgxErrorList, NgxMatErrors } from '@smallpearl/ngx-helper/mat-form-error';

export const NGX_MAT_ERROR_DEFAULT_CONFIG: FactoryProvider = {
  useFactory: (locale: string) => ({
    ...errorMessagesEnFactory(locale),
    dateNotWithinCurrentFiscalPeriod: "Date not within current fiscal period",
  }),
  provide: NGX_MAT_ERROR_DEFAULT_OPTIONS,
  deps: [LOCALE_ID],
};

@Component({
  selector: 'app-form-errors-demo',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    NgxMatErrors,
    NgxErrorList,
  ],
  standalone: true,
  template: `
      <div class="wrapper">
      <div class="">
        @if (form.errors) {
          <div class="error-box">
            <div [ngx-error-list]="form"></div>
          </div>
        }
        <form (ngSubmit)="onSubmit()" [formGroup]="form">

          <mat-form-field>
            <mat-label>Name</mat-label>
            <input matInput formControlName="name">
            <mat-error ngx-mat-errors></mat-error>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Age</mat-label>
            <input type="number" matInput formControlName="age">
            <mat-error ngx-mat-errors></mat-error>
          </mat-form-field>
          <div>
            <button mat-raised-button color="secondary" type="reset">Reset</button>&nbsp;
            <button mat-raised-button color="primary" type="submit">Submit</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: `
    .mat-mdc-form-field {
      width: 100%;
    }
    .wrapper {
      display:flex;
      flex-direction: column;
      align-items: center;
      margin: 2em;
    }
    form {
      max-width: 800px;
      padding: 0.2em;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    NGX_MAT_ERROR_CONFIG_EN,
    NGX_MAT_ERROR_DEFAULT_CONFIG
  ]
})

export class FormErrorDemoComponent implements OnInit {

  form = new FormGroup({
    name: new FormControl(undefined, { validators: [Validators.required, Validators.minLength(6)] }),
    age: new FormControl(undefined, { validators: [Validators.minLength(2)] })
  });

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    console.log(`FormErrorDemoComponent.ngOnInit`);
  }

  onSubmit() {
    const value = this.form.value;
    if (!value?.age || value.age < 40) {
      this.form.setErrors({
        dateNotWithinCurrentFiscalPeriod: true,
        minlength: true,
        required: true
      });
      const name = this.form.get('name') as FormControl;
      if (name) {
        name.setErrors({ minlength: true });
      }
      const age = this.form.get('age');
      if (age && age.value && age.value < 20) {
        age.setErrors({
          maxlength: 10,
        });
      }
    } else {
      this.form.setErrors(null);
    }
    this.cdr.detectChanges();
  }
}
