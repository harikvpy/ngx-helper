import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { QQMatFileInputComponent } from '@smallpearl/ngx-helper/src/mat-file-input';
import { QQMatTelephoneInputComponent } from '@smallpearl/ngx-helper/src/mat-tel-input';

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
    QQMatFileInputComponent,
  ],
  template: `
    <div style="margin: 0.5em;">
      <p>home-page works!</p>
      <form [formGroup]="form">
        <p>
          <mat-form-field class="w-100">
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
        <div style="width: 50%">
          <hr />
        </div>
        <p>
          <mat-form-field class="w-100">
            <qq-mat-file-input
              formControlName="attachment"
              placeholder="Select an image file"
            ></qq-mat-file-input>
          </mat-form-field>
        </p>
        <div>
          Attachment:
          <span
            *ngIf="form.controls['attachment'].valid; else invalidAttachment"
            >{{ form.value.attachment }}</span
          ><ng-template #invalidAttachment>No attachement</ng-template>
        </div>
        <p></p>
        <button type="submit">Submit</button>
      </form>
    </div>
  `,
  styles: [
    `
      .w-100 {
        width: 100%;
      }
      .w-50 {
        width: 50%;
      }
    `,
  ],
})
export class HomePageComponent {
  form: FormGroup;

  constructor(fb: FormBuilder) {
    this.form = fb.group({
      telephone: ['+886973809972', Validators.required],
      attachment: [
        'https://sfo2.digitaloceanspaces.com/qqdev/media/community/11/huitong.jpg',
      ],
    });
  }
}
