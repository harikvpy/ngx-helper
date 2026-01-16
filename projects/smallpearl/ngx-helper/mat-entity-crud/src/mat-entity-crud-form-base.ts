import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { ChangeDetectorRef, Component, computed, inject, input, OnDestroy, OnInit, signal } from '@angular/core';
import { AbstractControl, FormArray, FormGroup, UntypedFormGroup } from '@angular/forms';
import { TranslocoService } from '@jsverse/transloco';
import { setServerErrorsAsFormErrors } from '@smallpearl/ngx-helper/forms';
import { map, Observable, Subscription, tap } from 'rxjs';
// import { getEntityCrudConfig } from './default-config';
import { sideloadToComposite } from '@smallpearl/ngx-helper/sideload';
import { convertHttpContextInputToHttpContext, HttpContextInput } from './convert-context-input-to-http-context';
import { SPMatEntityCrudCreateEditBridge } from './mat-entity-crud-types';

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
 * The `@Component` decorator is fake to keep the VSCode angular linter quiet.
 *
 * This class can be used in two modes:
 *
 *  I. SPMatEntityCrudComponent mode
 *     This mode relies on a bridge interface that implements the
 *     SPMatEntityCrudCreateEditBridge interface to perform the entity
 *     load/create/update operations. This is the intended mode when the
 *     component is used as a part of the SPMatEntityCrudComponent to
 *     create/update an entity. This mode requires the following properties
 *     to be set:
 *       - entity: TEntity | TEntity[IdKey] | undefined (for create)
 *       - bridge: SPMatEntityCrudCreateEditBridge
 *
 *  II. Standalone mode
 *     This mode does not rely on the bridge interface and the component
 *     itself performs the entity load/create/update operations. However, if
 *     the `bridge` input is set, then it will be used to close the create/edit
 *     form pane when create/update is successful.
 *
 *     This mode requires the following properties to be set:
 *      - entity: TEntity | TEntity[IdKey] | undefined (for create)
 *      - baseUrl: string - Base URL for CRUD operations. This URL does not
 *        include the entity id. The entity id will be appended to this URL
 *        for entity load and update operations. For create operation, this
 *        URL is used as is.
 *      - entityName: string - Name of the entity, used to parse sideloaded
 *        entity responses.
 *      - httpReqContext?: HttpContextInput - Optional HTTP context to be
 *        passed to the HTTP requests. For instance, if your app has a HTTP
 *        interceptor that adds authentication tokens to the requests based
 *        on a HttpContextToken, then you can pass that token here.
 *
 * I. SPMatEntityCrudComponent mode:
 *
 *  1. Declare a FormGroup<> type as
 *
 *      ```
 *      type MyForm = FormGroup<{
 *        name: FormControl<string>;
 *        type: FormControl<string>;
 *        notes: FormControl<string>;
 *      }>;
 *      ```
 *
 *  2. Derive your form's component class from this and implement the
 *    createForm() method returing the FormGroup<> instance that matches
 *    the FormGroup concrete type above.
 *
 *      ```
 *      class MyFormComponent extends SPMatEntityCrudFormBase<MyForm, MyEntity> {
 *        constructor() {
 *          super()
 *        }
 *        createForm() {
 *          return new FormGroup([...])
 *        }
 *      }
 *      ```
 *
 *  3. If your form's value requires manipulation before being sent to the
 *    server, override `getFormValue()` method and do it there before returning
 *    the modified values.
 *
 *  4. Wire up the form in the template as below
 *
 *      ```html
 *      @if (loadEntity$ | async) {
 *      <form [formGroup]='form'.. (ngSubmit)="onSubmit()">
 *        <button type="submit">Submit</button>
 *      </form>
 *      } @else {
 *        <div>Loading...</div>
 *      }
 *      ```
 *
 *     Here `loadEntity$` is an Observable<boolean> that upon emission of `true`
 *     indicates that the entity has been loaded from server (in case of edit)
 *     and the form is ready to be displayed. Note that if the full entity was
 *     passed in the `entity` input property, then no server load is necessary
 *     and the form will be created immediately.
 *
 *  5. In the parent component that hosts the SPMatEntityCrudComponent, set
 *     the `entity` and `bridge` input properties of this component to
 *     appropriate values. For instance, if your form component has the
 *     selector `app-my-entity-form`, then the parent component's template
 *     will have:
 *
 *    ```html
 *   <sp-mat-entity-crud
 *    ...
 *    createEditFormTemplate="entityFormTemplate"
 *   ></sp-mat-entity-crud>
 *   <ng-template #entityFormTemplate let-data="data">
 *    <app-my-entity-form
 *      [entity]="data.entity"
 *      [bridge]="data.bridge"
 *    ></app-my-entity-form>
 *   </ng-template>
 *  ```
 *
 *  II. Standalone mode
 *
 * 1..4. Same as above, except set the required `bridge` input to `undefined`.
 * 5. Initialize the component's inputs `baseUrl` and `entityName` with the
 *    appropriate values. If you would like to pass additional HTTP context to
 *    the HTTP requests, then set the `httpReqContext` input as well.
 *    If the entity uses an id key other than 'id', then set the `idKey` input
 *    to the appropriate id key name.
 * 6. If you want to retrieve the created/updated entity after the create/update
 *    operation, override the `onPostCreate()` and/or `onPostUpdate()` methods
 *    respectively.
 */
@Component({
  selector: '_#_sp-mat-entity-crud-form-base_#_',
  template: ``,
  standalone: false,
})
export abstract class SPMatEntityCrudFormBase<
  TFormGroup extends AbstractControl,
  TEntity extends { [P in IdKey]: PropertyKey },
  IdKey extends string = 'id'
> implements OnInit, OnDestroy
{
  // bridge mode inputs
  entity = input<TEntity | TEntity[IdKey]>();
  bridge = input<SPMatEntityCrudCreateEditBridge | undefined>();
  params = input<any>();
  // END bridge mode inputs

  // standalone mode inputs
  // Entity name, which is used to parse sideloaded entity responses
  entityName = input<string>();
  // Base CRUD URL, which is the GET-list-of-entities/POST-to-create
  // URL. Update URL will be derived from this ias `baseUrl()/${TEntity[IdKey]}`
  baseUrl = input<string>();
  // Additional request context to be passed to the request
  httpReqContext = input<HttpContextInput | undefined>();
  // ID key, defaults to 'id'
  idKey = input<string>('id');
  // END standalone mode inputs

  // IMPLEMENTATION
  loadEntity$!: Observable<boolean>;
  // This will hold the raw response returned by load() method
  loadResponse = signal<any>(undefined);
  // This will hold the loaded entity after it's extracted from the
  // load response.
  _entity = signal<TEntity | undefined>(undefined);
  sub$ = new Subscription();

  // Store for internal form signal. form() is computed from this.
  _form = signal<TFormGroup | undefined>(undefined);
  // Force typecast to TFormGroup so that we can use it in the template
  // without having to use the non-nullable operator ! with every reference
  // of form(). In any case the form() signal is always set in ngOnInit()
  // method after the form is created. And if form() is not set, then there
  // will be errors while loading the form in the template.
  form = computed(() => this._form() as TFormGroup);

  transloco = inject(TranslocoService);
  cdr = inject(ChangeDetectorRef);
  http = inject(HttpClient);

  canCancelEdit = () => {
    return this._canCancelEdit();
  };

  _canCancelEdit() {
    const form = this._form();
    if (form && form.touched) {
      return window.confirm(
        this.transloco.translate('spMatEntityCrud.loseChangesConfirm')
      );
    }
    return true;
  }

  ngOnInit() {
    // Validate inputs. Either bridge or (baseUrl and entityName) must be
    // defined.
    if (!this.bridge() && (!this.getBaseUrl() || !this.getEntityName())) {
      throw new Error(
        'SPMatEntityCrudFormBase: baseUrl and entityName inputs must be defined in standalone mode.'
      );
    }
    this.loadEntity$ = this.load(this.entity() as any)
    .pipe(
      map((entity) => {
        this._entity.set(entity);
        this._form.set(this.createForm(entity));
        const bridge = this.bridge();
        if (bridge && bridge.registerCanCancelEditCallback) {
          bridge.registerCanCancelEditCallback(this.canCancelEdit);
        }
        return true;
      })
    );
  }

  ngOnDestroy() {
    this.sub$.unsubscribe();
  }

  /**
   * Additional parameters for loading the entity, in case this.entity() value
   * is of type TEntity[IdKey].
   * @returns
   */
  getLoadEntityParams(): string | HttpParams {
    return '';
  }

  /**
   * Returns true if the entity needs to be loaded from server. The default
   * implementation returns true if the `entity` parameter is not an object,
   * indicating that it's of type 'TEntity[IdKey]' or is undefined. Derived
   * classes can override this method to provide custom logic.
   * @param entity
   * @returns Whether the entity needs to be loaded from server.
   */
  loadEntityRequired(entity: any) {
    return entity && typeof entity !== 'object';
  }

  /**
   * Return the TEntity object from the response returned by the
   * load() method. Typically entity load returns the actual
   * entity object itself. In some cases, where response is sideloaded, the
   * default implementation here uses the `sideloadToComposite()` utility to
   * extract the entity from the response after merging (inplace) the
   * sideloaded data into a composite.
   *
   * If you have a different response shape, or if your sideloaded object
   * response requires custom custom `sideloadDataMap`, override this method
   * and implement your custom logic to extract the TEntity object from the
   * response.
   * @param resp
   * @returns
   */
  getEntityFromLoadResponse(resp: any): TEntity | undefined {
    if (!resp || typeof resp !== 'object') {
      return undefined;
    }
    const entityName = this.getEntityName();
    if (resp.hasOwnProperty(this.getIdKey())) {
      return resp as TEntity;
    } else if (entityName && resp.hasOwnProperty(entityName)) {
      // const sideloadDataMap = this.sideloadDataMap();
      return sideloadToComposite(resp, entityName, this.getIdKey()) as TEntity;
    }
    return undefined;
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
    const bridge = this.bridge();
    const idKey = this.idKey();
    return idKey ? idKey : bridge ? bridge.getIdKey() : 'id';
  }

  getBusyWheelName() {
    return '';
  }

  /**
   * Return the form's value to be sent to server as Create/Update CRUD
   * operation data.
   * @returns
   */
  getFormValue() {
    const form = this.form();
    return form ? form.value : undefined;
  }

  onSubmit() {
    const value = this.getFormValue();
    const obs = !this._entity()
      ? this.create(value)
      : this.update((this._entity() as any)[this.getIdKey()], value);
    this.sub$.add(
      obs
        ?.pipe(
          tap((entity) => {
            const bridge = this.bridge();
            if (bridge) {
              bridge.close(false);
            }
            this._entity()
              ? this.onPostUpdate(entity)
              : this.onPostCreate(entity);
          }),
          setServerErrorsAsFormErrors(
            this._form() as unknown as UntypedFormGroup,
            this.cdr
          )
        )
        .subscribe()
    );
  }

  /**
   * Reset the form to its initial state. This is a generic implementation
   * that recursively resets all FormGroup and FormArray controls.
   */
  onReset() {
    function resetForm(form: FormGroup) {
      form.reset();
      const controls = form.controls;
      for (const name in controls) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const control: AbstractControl = (controls as any)[name];
        if (control instanceof FormArray) {
          const formArray = control as FormArray;
          for (let i = 0; i < formArray.length; i++) {
            const formArrayElem = formArray.at(i) as FormGroup;
            resetForm(formArrayElem);
          }
        }
      }
    }
    resetForm(this.form() as unknown as FormGroup);
  }

  onPostCreate(entity: TEntity) {
    /* empty */
  }

  onPostUpdate(entity: TEntity) {
    /* empty */
  }

  /**
   * Loads the entity if `this.entity()` is of type TEntity[IdKey]. If `bridge`
   * input is defined, then it's `loadEntity()` method is used to load the
   * entity. Otherwise, then this method attempts to load the entity using
   * HTTP GET from the URL derived from `baseUrl` input.
   * @param entity Can be full entity or just the entity id.
   * @returns
   */
  load(entity: any): Observable<TEntity> {
    if (entity === undefined || !this.loadEntityRequired(entity)) {
      return new Observable<TEntity>((subscriber) => {
        subscriber.next(entity as TEntity);
        subscriber.complete();
      });
    }
    // entity is of type TEntity[IdKey]. Load it using bridge or HTTP GET.
    const bridge = this.bridge();
    if (!this.getStandaloneMode()) {
      return bridge!.loadEntity(
        typeof entity === 'object' ? entity[this.getIdKey()] : entity,
        this.getLoadEntityParams()
      );
    }
    return this.loadEntity(
      typeof entity === 'object' ? entity[this.getIdKey()] : entity
    );
  }

  /**
   * Loads the entity using HTTP GET from the URL derived from `baseUrl` input.
   */
  protected loadEntity(entityId: any): Observable<TEntity> {
    // Try to load using baseUrl.
    const url = this.getEntityUrl(entityId);
    const params = this.getLoadEntityParams();
    return this.http
      .get<TEntity>(this.getEntityUrl(entityId), {
        params:
          typeof params === 'string'
            ? new HttpParams({ fromString: params })
            : params,
        context: this.getRequestContext(),
      })
      .pipe(
        map((resp) => {
          this.loadResponse.set(resp);
          return this.getEntityFromLoadResponse(resp) as TEntity;
        })
      );
  }

  /**
   * Create a new entity using the bridge if defined, otherwise using HTTP
   * POST to the `baseUrl`.
   * @param values
   * @returns
   */
  protected create(values: any): Observable<TEntity> {
    const bridge = this.bridge();
    if (!this.getStandaloneMode()) {
      return bridge!.create(values);
    }
    return this.createEntity(values);
  }

  protected createEntity(values: any): Observable<TEntity> {
    return this.http
      .post<TEntity>(this.getBaseUrl()!, values, {
        context: this.getRequestContext(),
      })
      .pipe(map((resp) => this.getEntityFromLoadResponse(resp) as TEntity));
  }

  /**
   * Update an existing entity using the bridge if defined, otherwise using HTTP
   * PATCH to the URL derived from `baseUrl` and the entity id.
   * @param id
   * @param values
   * @returns
   */
  protected update(id: any, values: any): Observable<TEntity> {
    const bridge = this.bridge();
    if (!this.getStandaloneMode()) {
      return bridge!.update(id, values);
    }
    return this.updateEntity(id, values);
  }

  protected updateEntity(id: any, values: any): Observable<TEntity> {
    return this.http
      .patch<TEntity>(this.getEntityUrl(id), values, {
        context: this.getRequestContext(),
      })
      .pipe(map((resp) => this.getEntityFromLoadResponse(resp) as TEntity));
  }

  /**
   * Override to get the standalone mode indicator. Standalone mode is
   * when both `baseUrl` and `entityName` inputs are defined. This is indication
   * that the component should perform the CRUD operations itself instead
   * of relying on the `bridge` input.
   * @returns
   */
  protected getStandaloneMode(): boolean {
    return !this.bridge() && !!this.getBaseUrl() && !!this.getEntityName();
  }

  /**
   * Wrapper around entityName input to get the entity name. If `bridge` input
   * is defined, then its `getEntityName()` method is used. This allows
   * derived classes to override this method to provide custom logic to
   * determine the entity name.
   * @returns
   */
  protected getEntityName(): string | undefined {
    const entityName = this.entityName();
    if (entityName) {
      return entityName;
    }
    const bridge = this.bridge();
    return bridge ? bridge.getEntityName() : undefined;
  }

  /**
   * Returns the baseUrl. Derived classes can override this to provide custom
   * logic to determine the baseUrl.
   * @returns
   */
  protected getBaseUrl(): string | undefined {
    return this.baseUrl();
  }

  /**
   * Returns the entity URL for the given entity id. If `bridge` input is
   * defined, then its `getEntityUrl()` method is used. Otherwise, the URL is
   * derived from `baseUrl` input.
   * @param entityId
   * @returns
   */
  protected getEntityUrl(entityId: any): string {
    const bridge = this.bridge();
    if (!this.getStandaloneMode()) {
      return bridge!.getEntityUrl(entityId);
    }
    const baseUrl = this.getBaseUrl();
    if (baseUrl) {
      const urlParts = baseUrl.split('?');
      return `${urlParts[0]}${String(entityId)}/${
        urlParts[1] ? '?' + urlParts[1] : ''
      }`;
    }
    console.warn(
      'SPMatEntityCrudFormBase.getEntityUrl: Cannot determine entity URL as neither baseUrl nor bridge inputs are provided.'
    );
    return '';
  }

  protected getRequestContext(): HttpContext {
    let context = new HttpContext();
    const httpReqContext = this.httpReqContext();
    if (httpReqContext) {
      context = convertHttpContextInputToHttpContext(context, httpReqContext);
    }
    return context;
  }
}
