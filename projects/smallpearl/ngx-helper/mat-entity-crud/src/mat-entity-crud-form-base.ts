import { Component, input, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, UntypedFormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { showServerValidationErrors } from './form-validation-error-handler';
import { SPMatEntityCrudCreateEditBridge } from './mat-entity-crud-types';
import { getEntityCrudConfig } from './default-config';

/**
 * This is a convenience base class that clients can derive from to implement
 * their CRUD form component. Particularly this class registers the change
 * detection hook which will be called when the user attempts to close the
 * form's parent container pane via the Close button on the top right.
 *
 * This button behaves like a Cancel button in a desktop app and therefore if
 * the user has entered any data in the form's controls, (determined by
 * checking form.touched), then a 'Lose Changes' prompt is displayed allowing
 * the user to cancel the closure.
 *
 * The @Component is fake just to keep the VSCode angular linter quiet.
 *
 * To use this class:-
 *
 * 1. Declare a FormGroup<> type as
 *
 *      ```
 *      type MyForm = FormGroup<{
 *        name: FormControl<string>;
 *        type: FormControl<string>;
 *        notes: FormControl<string>;
 *      }>;
 *      ```
 *
 * 2. Derive your form's component class from this and implement the
 *    createForm() method returing the FormGroup<> instance that matches
 *    the FormGroup concrete type above.
 *
 *    ```
 *    class MyFormComponent extends SPMatEntityCrudFormBase<MyForm, MyEntity> {
 *      constructor() {
 *        super()
 *      }
 *
 *      createForm() {
 *        return new FormGroup([...])
 *      }
 *    }
 *    ```
 *
 * 3. If you form's value requires manipulation before being sent to the
 *    server, override getFormValue() method and do it there before returning
 *    the modified values.
 *
 * 4. Wire up the form in the template as:
 *
 *    ```
 *    <form [formGroup]='form'.. (ngSubmit)="onSubmit()">
 *      <button type="submit">Submit</button>
 *    </form>
 *    ```
 */
@Component({ selector: '_#_sp-mat-entity-crud-form-base_#_', template: `` })
export abstract class SPMatEntityCrudFormBase<
  TFormGroup extends AbstractControl,
  TEntity extends { [P in IdKey]: PropertyKey },
  IdKey extends string = 'id'
> implements OnInit, OnDestroy
{
  _form!: TFormGroup;
  entity = input<TEntity>();
  bridge = input<SPMatEntityCrudCreateEditBridge>();
  sub$ = new Subscription();

  crudConfig = getEntityCrudConfig();

  canCancelEdit = () => {
    return this._canCancelEdit();
  };

  _canCancelEdit() {
    if (this._form.touched) {
      return window.confirm(this.crudConfig.i18n.loseChangesPrompt);
    }
    return true;
  }

  ngOnInit() {
    this._form = this.createForm(this.entity());
    this.bridge()?.registerCanCancelEditCallback(this.canCancelEdit);
  }

  ngOnDestroy() {
    this.sub$.unsubscribe();
  }

  get form(): TFormGroup|undefined {
    return this._form;
  }

  /**
   * Create the TFormGroup FormGroup class that will be used for the reactive
   * form.
   * @param entity
   */
  abstract createForm(entity: TEntity | undefined): TFormGroup;

  /**
   * Override to customize the id key name if it's not 'id'
   * @returns The name of the unique identifier key that will be used to
   * extract the entity's id for UPDATE operation.
   */
  getIdKey() {
    return 'id';
  }

  /**
   * Return the form's value to be sent to server as Create/Update CRUD
   * operation data.
   * @returns
   */
  getFormValue() {
    return this._form.value;
  }

  onSubmit() {
    const value = this.getFormValue();
    const obs = !this.entity()
      ? this.bridge()?.create(value)
      : this.bridge()?.update((this.entity() as any)[this.getIdKey()], value);
    this.sub$.add(
      obs
        ?.pipe(
          showServerValidationErrors(this._form as unknown as UntypedFormGroup)
        )
        .subscribe()
    );
  }
}
