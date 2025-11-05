import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  FactoryProvider,
  LOCALE_ID,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  errorMessagesEnFactory,
  NGX_MAT_ERROR_ADDL_OPTIONS,
  NGX_MAT_ERROR_CONFIG_EN,
  NGX_MAT_ERROR_DEFAULT_OPTIONS,
  NgxErrorList,
  NgxMatErrors,
} from '@smallpearl/ngx-helper/mat-form-error';
import { SPMatSelectEntityComponent } from '@smallpearl/ngx-helper/mat-select-entity';
import { of } from 'rxjs';

export const NGX_MAT_ERROR_DEFAULT_CONFIG: FactoryProvider = {
  useFactory: (locale: string) => ({
    ...errorMessagesEnFactory(locale),
    // dateNotWithinCurrentFiscalPeriod:
    //   'The selected date is not within the current fiscal period. Please choose a valid date.',
  }),
  provide: NGX_MAT_ERROR_DEFAULT_OPTIONS,
  deps: [LOCALE_ID],
};

const NGX_MAT_ERROR_ADDITIONAL_CONFIG: FactoryProvider = {
  useFactory: () => ({
    dateNotWithinCurrentFiscalPeriod:
      'The selected date is not within the current fiscal period. Please choose a valid date.',
  }),
  provide: NGX_MAT_ERROR_ADDL_OPTIONS,
  deps: [LOCALE_ID],
};

interface User {
  id: number;
  name: string;
}

const USER_DATA = [
  { id: 1, name: 'Mariam Trevarthen' },
  { id: 2, name: 'Lanny Nathanson' },
  { id: 3, name: 'Jaye Nevin' },
  { id: 4, name: 'Cordelia Blauser' },
  { id: 5, name: 'Talisha Houk' },
  { id: 6, name: 'Kirsten Jerkins' },
  { id: 7, name: 'Kandace Oleary' },
  { id: 8, name: 'Tammara Michell' },
  { id: 9, name: 'Lily Rainwater' },
  { id: 10, name: 'Izola Silversmith' },
];

@Component({
  selector: 'app-form-errors-demo',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    NgxMatErrors,
    NgxErrorList,
    SPMatSelectEntityComponent,
  ],
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
            <input matInput formControlName="name" />
            <mat-error ngx-mat-errors></mat-error>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Age</mat-label>
            <input type="number" matInput formControlName="age" />
            <mat-error ngx-mat-errors></mat-error>
          </mat-form-field>

          <mat-form-field>
            <mat-label>Select User</mat-label>
            <!-- <mat-select formControlName="user">
              <mat-option *ngFor="let user of loadUsers() | async" [value]="user.id">
                {{ userLabelFn(user) }}
              </mat-option>
            </mat-select> -->
            <sp-mat-select-entity
              [loadFromRemoteFn]="loadUsers"
              entityName="User"
              [entityLabelFn]="userLabelFn"
              formControlName="user"
            ></sp-mat-select-entity>
            <mat-error ngx-mat-errors></mat-error>
          </mat-form-field>

          <div>
            <button mat-raised-button color="secondary" type="reset">
              Reset</button
            >&nbsp;
            <button mat-raised-button color="primary" type="submit">
              Submit
            </button>
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
    NGX_MAT_ERROR_DEFAULT_CONFIG,
    NGX_MAT_ERROR_ADDITIONAL_CONFIG,
  ],
})
export class FormErrorDemoComponent implements OnInit, OnDestroy {
  loadUsers = () => of(USER_DATA);
  userLabelFn = (u: User) => u.name;

  form = new FormGroup({
    name: new FormControl(undefined, {
      validators: [Validators.required, Validators.minLength(6)],
    }),
    age: new FormControl(undefined, {
      validators: [Validators.required, Validators.minLength(2)],
    }),
    user: new FormControl<User | null>(null, {
      validators: [Validators.required],
    }),
  });

  intervalId: any;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    console.log(`FormErrorDemoComponent.ngOnInit`);
    // this.intervalId = setInterval(() => {
    //   console.log(
    //     `Form errors: ${JSON.stringify(this.form.errors)}, valid: ${
    //       this.form.valid
    //     }, user errors: ${JSON.stringify(this.form.get('user')?.errors)}`
    //   );
    // }, 3000);
  }

  ngOnDestroy(): void {
    //Called once, before the instance is destroyed.
    //Add 'implements OnDestroy' to the class.
    console.log(`FormErrorDemoComponent.ngOnDestroy`);
    clearInterval(this.intervalId);
  }
  onSubmit() {
    const value = this.form.value;
    if (!value?.age || value.age < 40) {
      this.form.setErrors({
        dateNotWithinCurrentFiscalPeriod: true,
        // minlength: true,
        required: true,
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

      const user = this.form.get('user');
      if (user && !user.value) {
        user.setErrors({
          required: true,
        });
      }
    } else {
      this.form.setErrors(null);
    }
    this.cdr.detectChanges();
  }
}
