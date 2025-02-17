import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { errorTailorImports } from '@ngneat/error-tailor';
import { SPMatEntityCrudFormBase } from '@smallpearl/ngx-helper/mat-entity-crud';
import { Invoice } from './data';

type MyFormGroup = FormGroup<{
  date: FormControl<Date>;
  number: FormControl<number>;
  terms: FormControl<number>;
}>;

@Component({
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatSelectModule,
        errorTailorImports,
    ],
    selector: 'app-create-edit-entity-demo',
    standalone: true,
    template: `
    <form
      [formGroup]="form()!"
      (ngSubmit)="onSubmit()"
      class="d-flex flex-column align-items-start"
      errorTailor
    >
      <mat-form-field>
        <mat-label>Date</mat-label>
        <input matInput type="date" formControlName="date"/>
      </mat-form-field>
      <mat-form-field>
        <mat-label>Number</mat-label>
        <input matInput type="number" formControlName="number"/>
      </mat-form-field>
      <mat-form-field>
        <mat-label>Terms</mat-label>
        <input matInput type="number" formControlName="terms"/>
      </mat-form-field>

      <div class="mt-2 d-flex gap-2">
        <button type="button" color="tertiary" mat-raised-button (click)="form()!.reset()">Reset</button>
        <button
          type="submit"
          color="primary"
          mat-raised-button
          [disabled]="form()!.invalid"
        >
          Save
        </button>
      </div>
    </form>

    @if (params()) {
      <br/>
      <h3>Params: {{ params().type }}</h3>
    }

  `,
    styles: `

  `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateEditEntityDemoComponent extends SPMatEntityCrudFormBase<MyFormGroup, any> {

  constructor(private fb: FormBuilder) {
    super();
  }

  createForm(entity?: Invoice) {
    return new FormGroup({
      date: new FormControl<Date>(entity ? entity.date : new Date(), {
        nonNullable: true,
        validators: Validators.required,
      }),
      number: new FormControl<number>(entity ? entity.number : 0, {
        nonNullable: true,
        validators: Validators.required,
      }),
      terms: new FormControl<number>(entity ? entity.terms : 0, {
        nonNullable: true,
        validators: Validators.required,
      }),
    });
  }

  // Override so that we don't actually create the object.
  override onSubmit() {
    const value = this.form()!.value;
    const bridge = this.bridge();
    // const obs = this.creating() ? bridge?.create(value) : bridge?.update(this.entity()?.cell, value);
    // obs?.pipe(
    //   showServerValidationErrors(this.form)
    // ).subscribe();
  }
}
