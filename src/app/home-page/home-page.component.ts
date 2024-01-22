import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { QQMatTelephoneInputComponent } from 'projects/smallpearl/mat-tel-input/src/lib';
import { MatSelectModule } from '@angular/material/select';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    QQMatTelephoneInputComponent,
  ],
  template: `
    <p>home-page works!</p>
    <form [formGroup]="form">
      <p>
        <mat-form-field style="width: 50%;">
          <qq-mat-telephone-input
            formControlName="telephone"
            searchText="Search"
            noEntriesFoundLabel="Country not found!"
          ></qq-mat-telephone-input>
          <mat-hint
            >Please enter your telephone number with country code.</mat-hint
          >
        </mat-form-field>
      </p>
      <div>
        Telephone Number:
        <span *ngIf="form.valid; else invalidPhone">{{
          form.value.telephone
        }}</span
        ><ng-template #invalidPhone>Invalid!</ng-template>
      </div>
      <button type="submit">Submit</button>
    </form>
  `,
  styles: [],
})
export class HomePageComponent {
  form: FormGroup;

  constructor(fb: FormBuilder) {
    this.form = fb.group({
      telephone: ['', Validators.required],
    });
  }
}
