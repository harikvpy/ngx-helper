import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { errorTailorImports } from '@ngneat/error-tailor';
import { SPMatEntityCrudCreateEditBridge } from '@smallpearl/ngx-helper/mat-entity-crud';
import { Observable, of } from 'rxjs';
import { MOCK_USER } from '../entity-list-demo/user';
import { Invoice } from './data';

@Component({
  standalone: true,
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
  template: `
  @if (init$|async) {
    <form
      [formGroup]="form"
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
        <button type="button" color="secondary" mat-raised-button (click)="form.reset()">Reset</button>
        <button
          type="submit"
          color="primary"
          mat-raised-button
          [disabled]="form.invalid"
        >
          Save
        </button>
      </div>
    </form>
  }
  `,
  styles: `

  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateEditEntityDemoComponent implements OnInit, OnDestroy {
  form!: FormGroup<{
    date: FormControl<Date>,
    number: FormControl<number>,
    terms: FormControl<number>,
  }>;
  // update = false;
  init$!: Observable<any>;
  bridge = input<SPMatEntityCrudCreateEditBridge>();
  entity = input<Invoice>();
  creating = computed(() => !this.entity()|| !this.entity()?.id)

  canCancelEdit = () => {
    return this._canCancelEdit();
  }

  _canCancelEdit() {
    if (this.form.touched) {
      return window.confirm('Lose Changes?');
    }
    return true;
  }

  constructor(
    private fb: FormBuilder,
  ) {}

  ngOnInit() {
    console.log(`CreateEditEntityDemoComponent.ngOnInit`);
    this.init$ = of(this.entity() ? this.entity() : MOCK_USER)
    this.form = this.createForm(this.entity())
    this.bridge()?.registerCanCancelEditCallback(this.canCancelEdit);
  }

  ngOnDestroy(): void {
    console.log(`CreateEditEntityDemoComponent.ngOnDestroy`);
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
  onSubmit() {
    const value = this.form.value;
    const bridge = this.bridge();
    // const obs = this.creating() ? bridge?.create(value) : bridge?.update(this.entity()?.cell, value);
    // obs?.pipe(
    //   showServerValidationErrors(this.form)
    // ).subscribe();
  }
}
