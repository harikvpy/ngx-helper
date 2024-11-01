import { CommonModule } from '@angular/common';
import { Component, computed, input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { SPMatEntityCrudCreateEditBridge } from '@smallpearl/ngx-helper/mat-entity-crud';
import { Observable, of } from 'rxjs';
import { MOCK_USER, User } from '../entity-list-demo/user';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatSnackBarModule,
  ],
  selector: 'app-create-edit-entity-demo',
  template: `
  @if (init$|async) {
    <!-- <h2>
      @if (update) {
        Update User
      } @else {
        Create User
      }
    </h2> -->
    <form
      [formGroup]="form"
      (ngSubmit)="onSubmit()"
      class="d-flex flex-column align-items-start"
    >
      <div class="d-flex flex-row gap-1">
        <mat-form-field>
          <mat-label>Firstname</mat-label>
          <input matInput formControlName="firstName" />
        </mat-form-field>
        <mat-form-field>
          <mat-label>Lastname</mat-label>
          <input matInput formControlName="lastName" />
        </mat-form-field>
      </div>
      <mat-form-field>
        <mat-label>Gender</mat-label>
        <mat-select formControlName="gender">
          <mat-option value="male">Male</mat-option>
          <mat-option value="female">Female</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field>
        <mat-label>Cell</mat-label>
        <input matInput formControlName="cell" />
      </mat-form-field>

      <div class="mt-2 d-flex gap-2">
        <button type="reset" color="secondary" mat-raised-button>Reset</button>
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
})
export class CreateEditEntityDemoComponent implements OnInit, OnDestroy {
  form!: FormGroup<{
    firstName: FormControl<string|null>,
    lastName: FormControl<string|null>,
    gender: FormControl<string|null>,
    cell: FormControl<string|null>,
  }>;
  // update = false;
  init$!: Observable<any>;
  bridge = input<SPMatEntityCrudCreateEditBridge>();
  entity = input<User>();
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

  createForm(entity?: User) {
    return this.fb.group({
      firstName: [entity ? entity.name.first : '', Validators.required],
      lastName: [entity ? entity.name.last : '', Validators.required],
      gender: [entity ? entity.gender : '', Validators.required],
      cell: [entity ? entity.cell : '', Validators.required],
    });
  }
  onSubmit() {
    const value = this.form.value;
    const bridge = this.bridge();
    this.creating() ? bridge?.create(value) : bridge?.update(this.entity()?.cell, value);
  }
}
