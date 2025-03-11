import { CommonModule } from '@angular/common';
import { HttpClient, HttpContext, HttpContextToken } from '@angular/common/http';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  ContentChildren,
  effect,
  EventEmitter,
  inject,
  Injector,
  input,
  Output,
  QueryList,
  signal,
  TemplateRef,
  viewChild,
  viewChildren
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatColumnDef, MatTableModule } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import {
  showBusyWheelUntilComplete,
  SPMatHostBusyWheelDirective
} from '@smallpearl/ngx-helper/mat-busy-wheel';
import {
  SPContextMenuItem,
  SPMatContextMenuComponent,
} from '@smallpearl/ngx-helper/mat-context-menu';
import { SPMatEntityListComponent } from '@smallpearl/ngx-helper/mat-entity-list';

import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { DomSanitizer } from '@angular/platform-browser';
import { provideTranslocoScope, TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { SPEntityFieldSpec } from '@smallpearl/ngx-helper/entity-field';
import { AngularSplitModule } from 'angular-split';
import { startCase } from 'lodash';
import { plural } from 'pluralize';
import { firstValueFrom, map, Observable, of, Subscription, switchMap, tap } from 'rxjs';
import { getEntityCrudConfig } from './default-config';
import { FormViewHostComponent } from './form-view-host.component';
import { SPMatEntityCrudComponentBase } from './mat-entity-crud-internal-types';
import {
  ALLOW_ITEM_ACTION_FN,
  CRUD_OP_FN,
  CrudOp,
  NewItemSubType,
  SP_MAT_ENTITY_CRUD_HTTP_CONTEXT,
  SPMatEntityCrudConfig,
  SPMatEntityCrudResponseParser,
} from './mat-entity-crud-types';
import { PreviewHostComponent } from './preview-host.component';

@Component({
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatTableModule,
    MatSortModule,
    MatMenuModule,
    MatSnackBarModule,
    MatIconModule,
    TranslocoModule,
    AngularSplitModule,
    SPMatEntityListComponent,
    SPMatContextMenuComponent,
    FormViewHostComponent,
    SPMatHostBusyWheelDirective,
    PreviewHostComponent,
  ],
  providers: [provideTranslocoScope('sp-mat-entity-crud')],
  selector: 'sp-mat-entity-crud',
  template: `
    <as-split direction="horizontal" [gutterSize]="6" *transloco="let t">
      <as-split-area
        [size]="entitiesPaneWidth()"
        [visible]="!entitiesPaneHidden()"
      >
        <div [class]="listPaneWrapperClass()">
          <ng-content select="[breadCrumbs]"></ng-content>

          <ng-template #defaultActionButtons>
            <div class="action-bar-actions">
              @if (!disableCreate()) { @if (newItemSubTypes()) {
              <!-- New {{item}} displays a dropdown menu from which the subtype can be selected -->
              <button
                type="button"
                mat-raised-button
                color="primary"
                [matMenuTriggerFor]="newSubTypesMenu"
              >
                {{
                  newItemLabel() ??
                    t('spMatEntityCrud.newItem', {
                      item: _itemLabel() | async
                    })
                }}
                <mat-icon>expand_circle_down</mat-icon>
              </button>
              <mat-menu #newSubTypesMenu="matMenu">
                @for (subtype of newItemSubTypes(); track $index) { @if
                (subtype.role) {
                <button mat-menu-item (click)="handleNewItemSubType(subtype)">
                  {{ subtype.label }}
                </button>
                } @else {
                <div style="padding: .2em 0.5em;">
                  <strong>{{ subtype.label }}</strong>
                </div>
                } }
              </mat-menu>
              } @else {
              <button
                mat-raised-button
                color="primary"
                (click)="onCreate($event)"
                [routerLink]="newItemLink()"
              >
                {{
                  newItemLabel() ??
                    t('spMatEntityCrud.newItem', {
                      item: _itemLabel() | async
                    })
                }}
                <mat-icon>add_circle</mat-icon>
              </button>
              } }
            </div>
          </ng-template>

          <ng-template #defaultHeaderTemplate>
            <div class="action-bar">
              <div class="action-bar-title">
                {{ _title() | async }}
              </div>
              <span class="spacer"></span>
              <!-- Hide the action buttons when Preview/Edit pane is active -->
              @if (!entityPaneActive()) {
              <ng-container
                [ngTemplateOutlet]="actionsTemplate() || defaultActionButtons"
              ></ng-container>
              }
            </div>
          </ng-template>
          <ng-container
            [ngTemplateOutlet]="headerTemplate() || defaultHeaderTemplate"
          ></ng-container>
          <sp-mat-entity-list
            #entitiesList
            [entityName]="entityName()"
            [entityNamePlural]="entityNamePlural()"
            [deferViewInit]="true"
            [endpoint]="endpoint()"
            [entityLoaderFn]="entityLoaderFn()"
            [columns]="columnsWithAction()"
            [displayedColumns]="visibleColumns()"
            [idKey]="idKey()"
            [pagination]="pagination()"
            [paginator]="paginator()"
            [pageSize]="pageSize()"
            [sorter]="sorter()"
            [disableSort]="disableSort()"
            (selectEntity)="handleSelectEntity($event)"
            [httpReqContext]="httpReqContext()"
          >
          </sp-mat-entity-list>
        </div>

        <!--
        We'll be initializing the contentColumnDefs separately and not
        relying on <sp-mat-entity-list>'s internal @ContentChildre() querylist
        for building this. So we define this independenly and not as
        <sp-mat-entity-list> content.
        -->
        <ng-container matColumnDef="action">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let element">
            <!-- <button
              mat-icon-button
              hoverDropDown
            >
              <mat-icon>more_vert</mat-icon>
            </button> -->
            <sp-mat-context-menu
              [menuItems]="_itemActions"
              (selected)="onItemAction($event, element)"
              [contextData]="element"
              [hasBackdrop]="true"
            ></sp-mat-context-menu>
          </td>
        </ng-container>
      </as-split-area>
      <as-split-area [size]="entityPaneWidth()" [visible]="entityPaneActive()">
        <div
          [class]="previewPaneWrapperClass()"
          spHostBusyWheel="formBusyWheel"
        >
          <sp-entity-crud-preview-host
            [ngClass]="createEditViewActive() ? 'd-none' : 'd-inherit'"
            [entityCrudComponentBase]="this"
            [clientViewTemplate]="previewTemplate()!"
          ></sp-entity-crud-preview-host>
          <!-- Create/Edit Entity -->
          <sp-create-edit-entity-host
            [ngClass]="createEditViewActive() ? 'd-inherit' : 'd-none'"
            itemLabel="{{ _itemLabel() | async }}"
            itemLabelPlural="{{ _itemLabelPlural() | async }}"
            [entityCrudComponentBase]="this"
            [clientViewTemplate]="createEditFormTemplate()"
          ></sp-create-edit-entity-host>
        </div>
      </as-split-area>
    </as-split>
  `,
  styles: `
  .d-none {
    display: none;
  }
  .d-inherit {
    display: inherit;
  }
  .action-bar {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding-bottom: 0.5em;
  }
  .action-bar-title {
    font-size: 1.5em;
    font-weight: 600;
  }
  .spacer {
    flex-grow: 1;
  }
  .action-bar-actions {
    text-align: end;
  }
  .active-row {
    font-weight: bold;
  }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SPMatEntityCrudComponent<
    TEntity extends { [P in IdKey]: PropertyKey },
    IdKey extends string = 'id'
  >
  extends SPMatEntityListComponent<TEntity, IdKey>
  implements SPMatEntityCrudComponentBase<TEntity>, AfterViewInit
{
  // entityName = input.required<string>();
  // entityNamePlural = input<string>();

  itemLabel = input<string | Observable<string>>();
  itemLabelPlural = input<string | Observable<string>>();

  /**
   * Title string displayed above the component. If not specified, will use
   * itemLabelPlural() as the title.
   */
  title = input<string | Observable<string>>();
  /**
   *
   */
  itemActions = input<SPContextMenuItem[]>([]);
  /**
   * Specify the list of router paths that will be set as the value for
   * [routerLink] for the 'New {{ item }}' button. If not specified,
   * if createEditTemplate is specified, it will be shown. If not, `action`
   * out event will be raised with `{ role: '_new_' }`.
   */
  newItemLink = input<string | string[]>();
  /**
   * If not specified, will default to 'New <itemLabel()>'.
   */
  newItemLabel = input<string | string[]>();
  /**
   * Text for the Edit <item> pane title
   */
  editItemTitle = input<string>();
  /**
   * If you want "New {{item}}" button to support multiple entity types,
   * you can set this to `NewItemSubType[]`, where each element stands for for
   * a dropdown menu item. Refer to `NewItemSubType` for details on this
   * interface.
   */
  newItemSubTypes = input<NewItemSubType[]>();
  /**
   * If you want to take control of the network operations for the CRUD
   * operations (GET/CREATE/UPDATE/DELETE), provide a value for this property.
   */
  crudOpFn = input<CRUD_OP_FN<TEntity, IdKey>>();
  /**
   * Item preview template.
   */
  previewTemplate = input<TemplateRef<any>>();
  /**
   * Whether to allow a context menu action or not. Return false to disable
   * the action.
   */
  allowEntityActionFn = input<ALLOW_ITEM_ACTION_FN<TEntity>>();
  /**
   * A template that allows the header to be replaced. Usage:-
   *
   *    ```
   *    <sp-map-entity-crud
   *      [headerTemplate]="myCrudViewHeader"
   *    ></sp-map-entity-crud>
   *    <ng-template #myCrudViewHeader>...</ng-template>
   *    ```
   */
  headerTemplate = input<TemplateRef<any>>();
  /**
   * Set this to the custom template identifier that will replace the
   * "New {{Item}}" button portion. This template will expand towards the
   * title which will be placed to its left (right in rtl).
   *
   *    ```
   *    <sp-map-entity-crud
   *      [actionsTemplate]="myCrudActions"
   *    ></sp-map-entity-crud>
   *    <ng-template #myCrudActions>...</ng-template>
   *    ```
   */
  actionsTemplate = input<TemplateRef<any>>();

  /**
   * CRUD action response parser. This will be called with the response
   * from CREATE & UPDATE operations to parse the response JSON and return
   * the created/updated TEntity.
   */
  crudResponseParser = input<SPMatEntityCrudResponseParser>();
  /**
   * An ng-template name that contains the component which provides the
   * create/edit CRUD action.
   *
   *  ```
   *  <ng-template #createEdit let-data>
   *    <app-create-edit-entity-demo [bridge]="data.bridge" [entity]="data.entity"></app-create-edit-entity-demo>
   *  </ng-template>
   *  ```
   * Note how [bridge] & [entity] properties are set deriving them from the
   * implicit template context. [entity] will be undefined for Create
   * opreation and will be the valid entity for an Update.
   * (app-create-edit-entity-demo here is the client code that implements the
   * Create/Edit form)
   */
  createEditFormTemplate = input<TemplateRef<any> | null>(null);
  /**
   * Disables the per item actions column, preventing 'Edit' & 'Delete'
   * (and other user defined) item operations.
   */
  disableItemActions = input<boolean>(false);
  /**
   * Disables the Create function.
   */
  disableCreate = input<boolean>(false);
  /**
   * View refresh policy after a CREATE/UPDATE operation. Values
   *  'none'   - Objects are not refreshed after an edit operation. The return
   *             value of the edit operation is used as the object to
   *             add/update the component's internal store. This is the default.
   *  'object' - Refresh just the object that was returned from the
   *             CREATE/UPDATE operation. Use this if the JSON object returned
   *             after a successful CREATE/UPDATE op differs from the JSON
   *             object returned for the GET request.
   *  'all'    - Refresh the entire list after a CREATE/UPDATE operation. This
   *             mimics the behaviour of legacy HTML apps with pure server
   *             defined UI.
   */
  refreshAfterEdit = input<'none' | 'object' | 'all'>('none');
  /**
   * HttpContext for crud requests - list, create, retrieve, update & delete.
   * The value can be an object where the property names reflect the CRUD
   * methods with each of these keys taking
   * `[[HttpContextToken<any>, any]] | [HttpContextToken<any>, any]` as its
   * value. This object has a special key 'crud', which if given a value for,
   * would be used for all CRUD requests (CREATE|READ|UPDATE|DELETE).
   *
   * Alternatively the property can be set a
   * `[[HttpContextToken<any>, any]] | [HttpContextToken<any>, any]` as its
   * value, in which case the same context would be used for all HTTP requests.
   */
  crudHttpReqContext = input<
    | [[HttpContextToken<any>, any]]
    | [HttpContextToken<any>, any]
    | {
        // list?: [[HttpContextToken<any>, any]] | [HttpContextToken<any>, any];
        // crud?: [[HttpContextToken<any>, any]] | [HttpContextToken<any>, any]; // common context for all crud operations
        create?: [[HttpContextToken<any>, any]] | [HttpContextToken<any>, any]; // CREATE
        retrieve?:
          | [[HttpContextToken<any>, any]]
          | [HttpContextToken<any>, any]; // RETRIEVE
        update?: [[HttpContextToken<any>, any]] | [HttpContextToken<any>, any]; // UPDATE
        delete?: [[HttpContextToken<any>, any]] | [HttpContextToken<any>, any]; // DELETE
      }
  >();
  /**
   * Width of the edit pane as a percentange of the overall <as-split> width.
   */
  editPaneWidth = input<number>(100);
  /**
   * Width of the preview pane as a percentange of the overall <as-split> width.
   */
  previewPaneWidth = input<number>(50);

  /**
   * The class class that will be applied to the list pane wrapper.
   */
  listPaneWrapperClass = input<string>('sp-mat-crud-list-pane-wrapper-class');

  /**
   * The class class that will be applied to the preview pane wrapper.
   */
  previewPaneWrapperClass = input<string>(
    'sp-mat-crud-preview-pane-wrapper-class'
  );

  /**
   * The class class that will be applied to the preview pane content.
   */
  previewPaneContentClass = input<string>(
    'sp-mat-crud-preview-pane-content-class'
  );

  // INTERNAL PROPERTIES //
  // Derive a label from a camelCase source string. If the camelCase string
  // can be translated, it returns the translated string. If not, the function
  // converts the camelCase to 'Title Case' and returns it.
  private getLabel = (source: string) => {
    const label = this.transloco.translate(source);
    if (label.localeCompare(source) !== 0) {
      // Successful translation, return it
      return label;
    }
    return startCase(source);
  };

  _itemLabel = computed<Observable<string>>(() => {
    const itemLabel = this.itemLabel();
    const label = itemLabel ? itemLabel : this.getLabel(this.entityName());
    return label instanceof Observable ? label : of(label);
  });
  _itemLabelPlural = computed<Observable<string>>(() => {
    const itemLabelPlural = this.itemLabelPlural();
    const label = itemLabelPlural
      ? itemLabelPlural
      : this.getLabel(plural(this.entityName()));
    return label instanceof Observable ? label : of(label);
  });

  // Computed title
  _title = computed(() => {
    const title = this.title() ? this.title() : this._itemLabelPlural();
    return title instanceof Observable ? title : of(title);
  });
  // endpoint with the QP string removed (if one was provided)
  _endpointSansParams = computed(() => this.endpoint().split('?')[0]);
  _endpointParams = computed(() => {});
  componentColumns = viewChildren(MatColumnDef);
  @ContentChildren(MatColumnDef) _clientColumnDefs!: QueryList<MatColumnDef>;

  /**
   * Event raised for user selecting an item action. It's also raised
   * for 'New <Item>' action, if 'newItemLink' property is not set.
   */
  @Output() action = new EventEmitter<{ role: string; entity?: TEntity }>();

  /**
   * Event raised when create Create/Edit pane is activated & deactivated.
   * Event contains two flags:-
   *  activated - whether the createEdit form view was activated or
   *              deactivated.
   *  cancelled - whether the form view was cancelled by user. False for this
   *              indicates that the form view was closed after a successful
   *              edit operation.
   */
  @Output() entityViewPaneActivated = new EventEmitter<{
    activated: boolean;
    cancelled: boolean | undefined;
    mode: 'edit' | 'preview';
  }>();

  busyWheelId = `entityCrudBusyWheel-${Date.now()}`;
  sub$ = new Subscription();
  spEntitiesList =
    viewChild<SPMatEntityListComponent<TEntity, IdKey>>('entitiesList');

  // Theoritically, we ought to be able to initialize the mat-entities-list
  // columns from ngAfterViewInit lifecycle hook. But for some strange reason
  // when this hook is called, sp-mat-entities-list has not been initialized.
  // Therefore `spEntitiesList()` is null. So we have to use a computed signal,
  // which will be triggered when spEntitiesList() is initialized and use that
  // to initialize the columns.
  spEntitiesListInited = effect(() => {
    if (this.spEntitiesList()) {
      this._initEntitiesList();
    }
  });

  crudConfig!: SPMatEntityCrudConfig;

  // This is the internal component that will host the createEditFormTemplate
  createEditHostComponent = viewChild(FormViewHostComponent);
  // A flag to toggle the viewport's contents between the mat-table
  // and the create/edit form template.
  createEditViewActive = signal<boolean>(false);

  // Whether it's okay to cancel the edit
  canCancelEditCallback!: () => boolean;

  // Preview host component
  previewHostComponent = viewChild(PreviewHostComponent);
  previewActive = computed(() => this.previewedEntity() !== undefined);
  previewedEntity = signal<TEntity | undefined>(undefined);

  // Whether the pane that hosts the preview/edit-entity template is active.
  // We call it entityPane as it's used to either render a selected entity
  // or to edit one.
  entityPaneActive = computed(
    () => !!this.previewedEntity() || this.createEditViewActive()
  );
  // Effective width of the entity pane.
  entityPaneWidth = computed(() =>
    this.entityPaneActive()
      ? !!this.previewedEntity()
        ? this.previewPaneWidth()
        : this.editPaneWidth()
      : 0
  );

  // Width of the pane showing the list of entities. Calculated as
  entitiesPaneWidth = computed(() => 100 - this.entityPaneWidth());
  entitiesPaneHidden = computed(
    () => this.entityPaneActive() && this.entityPaneWidth() === 100
  );

  defaultItemCrudActions = signal<SPContextMenuItem[]>([]);
  columnsWithAction = computed(() => {
    const cols: Array<SPEntityFieldSpec<TEntity, IdKey> | string> = JSON.parse(
      JSON.stringify(this.columns())
    );
    // JSON.parse(JSON.strigify()) does not clone function objects. So
    // we've to explicitly copy these over. So this is really a shallow clone
    // as the cloned objects still refers to the function objects in the
    // original object.
    this.columns().forEach((col, index: number, orgColumns) => {
      const orgCol = orgColumns[index];
      if (typeof orgCol !== 'string') {
        const newColumn = cols[index] as SPEntityFieldSpec<TEntity, IdKey>;
        if (orgCol.valueFn) {
          newColumn.valueFn = orgCol.valueFn;
        }
        if (orgCol.valueOptions) {
          newColumn.valueOptions = orgCol.valueOptions;
        }
      }
    });
    const actionDefined =
      cols.find((c) =>
        typeof c === 'string' ? c === 'action' : c.name === 'action'
      ) !== undefined;
    if (!actionDefined && !this.disableItemActions()) {
      cols.push('action');
    }
    return cols;
  });
  // Provide per entity actions as a function so that the actions are
  // enumerated only when the user clicks on the context menu button.
  _itemActions = (entity: TEntity) => this.getItemActions(entity);

  // This uses the previewActive signal to compute the visible columns
  // when preview is activated. For now we just hide the 'action' column when
  // preview is active. We can further customize this logic by allowing the
  // client to specify the columns to display when preview is active thereby
  // reducing column clutter when the table width becomes narrower owing to
  // preview pane taking up screen space.
  visibleColumns = computed(() =>
    this.entityPaneActive()
      ? this.columnsWithAction()
          .map((col) => (typeof col === 'string' ? col : col.name))
          .filter((name) => name !== 'action')
      : []
  );
  transloco = inject(TranslocoService);

  constructor(
    http: HttpClient,
    private snackBar: MatSnackBar,
    sanitizer: DomSanitizer,
    injector: Injector
  ) {
    super(http, sanitizer, injector);
    this.crudConfig = getEntityCrudConfig();
    if (this.crudConfig?.defaultItemActions) {
      this.defaultItemCrudActions.set(this.crudConfig?.defaultItemActions);
    } else {
      this.defaultItemCrudActions.set([
        {
          label: this.transloco.translate('spMatEntityCrud.edit'),
          role: '_update_',
        },
        {
          label: this.transloco.translate('spMatEntityCrud.delete'),
          role: '_delete_',
        },
      ]);
    }
  }

  override ngOnInit() {}

  override ngOnDestroy(): void {
    this.sub$.unsubscribe();
  }

  /**
   * Override so that we can suppress default action in SPMatEntityListComponent
   */
  override ngAfterViewInit(): void {}

  /**
   * If the create/edit entity form is active, it calls its registered
   * canCancelEdit callback to determine if it's okay to cancel the edit.
   * You can use this method from the host component's router guard to
   * ensure that any changes made to the form are not accidentally lost by
   * navigating away from the CRUD page.
   *
   * If your CRUD page has multiple sp-mat-entity-crud components, you have to
   * implement the logic to call this method on the appropriate component.
   *
   * If the the create/edit form is not active, this method returns true.
   * @returns
   */
  canDeactivate() {
    if (this.createEditViewActive()) {
      return this.canCancelEdit();
    }
    return true;
  }

  override refresh(force = false) {
    this.spEntitiesList()?.refresh(force);
  }

  closeCreateEdit(cancelled: boolean) {
    this.createEditViewActive.set(false);
    this.entityViewPaneActivated.emit({
      activated: false,
      cancelled: !!cancelled,
      mode: 'edit',
    });
  }

  canCancelEdit() {
    if (this.canCancelEditCallback) {
      return this.canCancelEditCallback();
    }
    return true;
  }

  registerCanCancelEditCallback(callback: () => boolean) {
    this.canCancelEditCallback = callback;
  }

  triggerEntityUpdate(entity: TEntity) {
    this.onUpdate(entity);
  }

  triggerEntityDelete(entity: TEntity) {
    this.onDelete(entity);
  }

  create(entityValue: any) {
    let obs!: Observable<TEntity | null>;
    const crudOpFn = this.crudOpFn();
    if (crudOpFn) {
      obs = crudOpFn('create', undefined, entityValue, this);
    } else {
      obs = this.http.post<TEntity>(this.getUrl(this.endpoint()), entityValue, {
        context: this.getCrudReqHttpContext('create'),
      });
    }

    return obs.pipe(
      showBusyWheelUntilComplete('formBusyWheel'),
      switchMap((resp) =>
        resp ? this.doRefreshAfterEdit(resp, 'create') : of(null)
      ),
      tap((entity) => {
        // If pagination is infinite or if the pagination if none or if the
        // count of items in the current page is less than pageSize()
        // wec an safely add the item to the list, which will cause the view
        // render the new item in the mat-table.
        if (entity) {
          this.spEntitiesList()?.addEntity(entity);
          this.snackBar.open(
            this.transloco.translate('spMatEntityCrud.createSuccess', {
              item: this._itemLabel(),
            })
          );
        }
      })
    );
  }

  update(id: TEntity[IdKey], entityValue: any) {
    let obs!: Observable<TEntity | null>;
    const crudOpFn = this.crudOpFn();
    if (crudOpFn) {
      obs = crudOpFn('update', id, entityValue, this);
    } else {
      obs = this.http.patch<TEntity>(this.getEntityUrl(id), entityValue, {
        context: this.getCrudReqHttpContext('update'),
      });
    }

    return obs.pipe(
      showBusyWheelUntilComplete('formBusyWheel'),
      switchMap((resp) =>
        resp ? this.doRefreshAfterEdit(resp, 'update') : of(null)
      ),
      tap((entity) => {
        if (entity) {
          this.spEntitiesList()?.updateEntity(id, entity);
          this.snackBar.open(
            this.transloco.translate('spMatEntityCrud.updateSuccess', {
              item: this._itemLabel(),
            })
          );
        }
      })
    );
  }

  /**
   * Refresh the entity list, after a CRUD CREATE or UPDATE operation.
   * @param resp This is the response from the CRUD operation (CREATE/UPDATE).
   * @param method The CRUD operation post which REFRESH is requested.
   * @returns Observable<TEntity|null>
   */
  doRefreshAfterEdit(resp: any, method: 'create' | 'update') {
    const refreshAfterEdit = this.refreshAfterEdit();
    const entity = this.getCrudOpResponseParser()(
      this.entityName(),
      this.idKey(),
      method,
      resp
    );
    if (refreshAfterEdit === 'object') {
      let obs!: Observable<TEntity>;
      const crudOpFn = this.crudOpFn();
      if (crudOpFn) {
        obs = crudOpFn(
          'get',
          (entity as any)[this.idKey()],
          undefined,
          this
        ) as Observable<TEntity>;
      } else {
        obs = this.http.get<TEntity>(
          this.getEntityUrl((entity as any)[this.idKey()]),
          { context: this.getCrudReqHttpContext('retrieve') }
        );
      }
      return obs.pipe(
        map((entity) => {
          return this.getCrudOpResponseParser()(
            this.entityName(),
            this.idKey(),
            'retrieve',
            entity
          );
        })
      );
    } else if (refreshAfterEdit === 'all') {
      this.refresh(true);
      return of(null);
    }

    return of(entity);
  }

  getCrudOpResponseParser(): SPMatEntityCrudResponseParser {
    if (this.crudResponseParser()) {
      // Without the `as SPMatEntityCrudResponseParser`, TSC will complain.
      return this.crudResponseParser() as SPMatEntityCrudResponseParser;
    }
    // crudConfig will have a parser as our default config provides one.
    return this.crudConfig
      .crudOpResponseParser as SPMatEntityCrudResponseParser;
  }

  // SPMatEntityCrudComponentBase interface method. Thunk to the implementation
  // method closePreviewImpl().
  closePreview() {
    this.closePreviewImpl(true);
  }

  private closePreviewImpl(toggleEntityListActiveEntity: boolean) {
    if (this.previewedEntity()) {
      if (toggleEntityListActiveEntity) {
        this.spEntitiesList()?.toggleActiveEntity(this.previewedEntity());
      }
      this.previewedEntity.set(undefined);
      this.entityViewPaneActivated.emit({
        activated: false,
        cancelled: undefined,
        mode: 'preview',
      });
    }
  }

  onItemAction(role: string, entity: TEntity) {
    if (role === '_update_') {
      this.onUpdate(entity);
    } else if (role === '_delete_') {
      this.onDelete(entity);
    } else {
      this.action.emit({ role, entity });
    }
  }

  onCreate(event: Event) {
    // If newItemLink() has not been provided, check if createEditFormTemplate
    // is specified. If it is, load it and make that cover the entire viewport.
    // If that too is not specified, emit an action event with role='_new_'.
    if (!this.newItemLink() || this.newItemLink()?.length == 0) {
      event.preventDefault();
      event.stopImmediatePropagation();
      firstValueFrom(this._itemLabel()).then((itemLabel) => {
        const params = {
          title:
            this.newItemLabel() ??
            this.transloco.translate('spMatEntityCrud.newItem', {
              item: itemLabel
            }),
        };
        this.showCreateEditView(undefined, params);
        if (!this.createEditViewActive()) {
          this.action.emit({ role: '_new_' });
        }
      });

      // const params = {
      //   title:
      //     this.newItemLabel() ??
      //     this.transloco.translate('spMatEntityCrud.newItem', {
      //       item: this._itemLabel(),
      //     }),
      // };
      // this.showCreateEditView(undefined, params);
    }
  }

  onUpdate(entity: TEntity) {

    firstValueFrom(this._itemLabel()).then((itemLabel) => {
      const params = {
        title:
          this.editItemTitle() ??
          this.transloco.translate('spMatEntityCrud.editItem', {
            item: itemLabel
          }),
      }
      this.showCreateEditView(entity, params);
      if (!this.createEditViewActive()) {
        this.action.emit({ role: '_update_' });
      }
    });

    // const params = {
    //   title:
    //     this.editItemTitle() ??
    //     this.transloco.translate('spMatEntityCrud.editItem', {
    //       item: this._itemLabel(),
    //     }),
    // };
    // this.showCreateEditView(entity, params);

    // const tmpl = this.createEditFormTemplate();
    // if (tmpl) {
    //   // If preview is active deactivate it
    //   if (this.previewActive()) {
    //     this.closePreview();
    //   }
    //   const createEditHost = this.createEditHostComponent();
    //   if (tmpl && createEditHost) {
    //     createEditHost.show(entity);
    //     this.createEditViewActive.set(true);
    //   }
    // }
    // if (!this.createEditViewActive()) {
    //   this.action.emit({ role: '_update_' });
    // }
  }

  /**
   * Show the create/edit component. This is deliberately made public so as to
   * be callable from the client. This allows the client to dynamically
   * set the form edit template and then show the edit pane by calling this
   * method.
   * @param entity
   * @param params
   */
  showCreateEditView(entity?: TEntity | undefined, params?: any) {
    const tmpl = this.createEditFormTemplate();
    if (!this.createEditViewActive() && tmpl) {
      // If preview is active deactivate it
      if (this.previewActive()) {
        this.closePreviewImpl(true);
      }
      const createEditHost = this.createEditHostComponent();
      createEditHost!.show(entity, params);
      this.createEditViewActive.set(true);
      this.entityViewPaneActivated.emit({
        activated: true,
        cancelled: undefined,
        mode: 'edit',
      });
    }
  }

  showPreviewView(entity?: TEntity, params?: any) {
    const tmpl = this.previewTemplate();
    if (tmpl) {
      if (!this.createEditViewActive()) {
        const previewHost = this.previewHostComponent();
        this.previewedEntity.set(entity);
        previewHost?.show(entity, params);
        this.entityViewPaneActivated.emit({
          activated: true,
          cancelled: undefined,
          mode: 'preview',
        });
        // this.previewActivated.emit({ entity, activated: true });
      }
    }
  }

  hidePreviewView() {
    if (this.previewActive()) {
      const previewHost = this.previewHostComponent();
      previewHost?.close();
      this.closePreviewImpl(false);
    }
  }

  async onDelete(entity: TEntity) {
    // Do the delete prompt asynchronously so that the context menu is
    // dismissed before the prompt is displayed.
    setTimeout(() => {
      // We use firstValueFrom() to get the value of the observable
      // synchronously. firstValueFrom() also gracefully cleans up the
      // observable after a value is emitted.
      firstValueFrom(this._itemLabel()).then((itemLabel) => {
        const deletedItemPrompt = this.transloco.translate(
          'spMatEntityCrud.deleteItemConfirm',
          { item: itemLabel.toLocaleLowerCase() }
        );
        const yes = confirm(deletedItemPrompt);
        if (yes) {
          const entityId = (entity as any)[this.idKey()];

          // If preview is active deactivate it
          if (this.previewActive()) {
            this.closePreviewImpl(false);
          }

          let obs!: Observable<any>;
          const crudOpFn = this.crudOpFn();
          if (crudOpFn) {
            obs = crudOpFn('delete', entityId, undefined, this);
          } else {
            obs = this.http.delete<void>(this.getEntityUrl(entityId), {
              context: this.getCrudReqHttpContext('delete'),
            });
          }

          this.sub$.add(
            obs
              .pipe(
                // TODO: how to display a busy wheel?
                // showBusyWheelUntilComplete(this.busyWheelId),
                tap(() => {
                  this.spEntitiesList()!.removeEntity(entityId);
                  // TODO: customize by providing an interface via SPMatEntityCrudConfig?
                  const deletedMessage = this.transloco.translate(
                    'spMatEntityCrud.deleteItemSuccess',
                    { item: this._itemLabel() }
                  );
                  this.snackBar.open(deletedMessage);
                })
              )
              .subscribe()
          );
        }
      });
    });
  }

  override getUrl(endpoint: string) {
    return this.entityListConfig?.urlResolver
      ? this.entityListConfig?.urlResolver(endpoint)
      : endpoint;
  }

  getEntityUrl(entityId: TEntity[IdKey]) {
    const endpoint = this.endpoint();
    const endpointParts = endpoint.split('?');
    const entityEndpoint =
      (endpointParts[0].endsWith('/')
        ? endpointParts[0]
        : endpointParts[0] + '/') + `${String(entityId)}/`;
    if (endpointParts.length > 1) {
      return this.getUrl(entityEndpoint + `?${endpointParts[1]}`);
    }
    return this.getUrl(entityEndpoint);
  }

  handleSelectEntity(entity: TEntity | undefined) {
    if (!this.createEditViewActive()) {
      if (this.previewTemplate()) {
        entity ? this.showPreviewView(entity) : this.hidePreviewView();
        // this.previewedEntity.set(entity);
      } else {
        // If 'previewTemplate' is not set, propagate the event to client.
        this.selectEntity.emit(entity);
      }
    }
  }

  handleNewItemSubType(subtype: NewItemSubType) {
    // console.log(`handleNewItemSubType: ${subtype}`);
    if (subtype.role === '_new_') {
      this.showCreateEditView(undefined, subtype?.params);
    } else {
      this.action.emit({ role: subtype.role });
    }
  }

  private getCrudReqHttpContext(op: CrudOp) {
    const contextParamToHttpContext = (
      context: HttpContext,
      reqContext: [[HttpContextToken<any>, any]] | [HttpContextToken<any>, any]
    ) => {
      if (reqContext.length == 2 && !Array.isArray(reqContext[0])) {
        // one dimensional array of a key, value pair.
        context.set(reqContext[0], reqContext[1]);
      } else {
        reqContext.forEach(([k, v]) => context.set(k, v));
      }
    };

    let context = new HttpContext();
    const crudHttpReqContext = this.crudHttpReqContext();
    if (crudHttpReqContext) {
      if (Array.isArray(crudHttpReqContext)) {
        // Same HttpContext for all crud requests
        contextParamToHttpContext(context, crudHttpReqContext);
      } else if (
        typeof crudHttpReqContext === 'object' &&
        op &&
        crudHttpReqContext[op]
      ) {
        contextParamToHttpContext(context, crudHttpReqContext[op]!);
        // if (crudHttpReqContext[op]) {
        //   context = contextParamToHttpContext(crudHttpReqContext[op] as any);
        // } else if (crudHttpReqContext['crud']) {
        //   context = contextParamToHttpContext(crudHttpReqContext['crud'] as any);
        // }
      }
      // } else if (this.httpReqContext()) {
      //   context = contextParamToHttpContext(this.httpReqContext()!);
    }

    context.set(SP_MAT_ENTITY_CRUD_HTTP_CONTEXT, {
      entityName: this.entityName(),
      entityNamePlural: this._entityNamePlural(),
      endpoint: this.endpoint(),
      op,
    });
    return context;
    // const httpReqContext = this.httpReqContext();
    // return httpReqContext
    //   ? contextParamToHttpContext(httpReqContext)
    //   : undefined;
  }

  isItemActionAllowed(action: string, entity: TEntity) {
    return false;
  }

  /**
   * Returns the list of item actions. Calls 'allowItemActionFn' for each action
   * to determine if the action is allowed for the given entity.
   * @returns
   */
  getItemActions(entity: TEntity): SPContextMenuItem[] {
    // console.log(`SPMatEntityCrudComponent.getItemActions - entity: ${JSON.stringify(entity, null, 2)}`);
    const actions =
      this.itemActions() && this.itemActions().length
        ? this.itemActions()
        : this.defaultItemCrudActions();
    let actionsCopy: SPContextMenuItem[] = JSON.parse(JSON.stringify(actions));
    actionsCopy.forEach((action: SPContextMenuItem, index: number) => {
      // localize default action item labels (Update & Delete)
      // Client specified action labels are to be localized by the client
      // before supplying them to the component.
      if (action.label.startsWith('spMatEntityCrud.')) {
        action.label = this.transloco.translate(action.label);
      }
      const orgDisable = actions[index]?.disable;
      action.disable = (entity: TEntity) => {
        if (orgDisable) {
          return orgDisable(entity);
        }
        const allowItemActionFn = this.allowEntityActionFn();
        if (allowItemActionFn) {
          return !allowItemActionFn(entity, action.role ?? action.label);
        }
        return false;
      };
    });
    return actionsCopy;
  }

  getPreviewPaneContentClass() {
    return this.previewPaneContentClass();
  }

  /**
   * Initialize the columns for the mat-entities-list component. This is
   * called when the <sp-mat-entities-list> component has been properly
   * initialized.
   */
  private _initEntitiesList() {
    const spEntitiesList = this.spEntitiesList();
    if (spEntitiesList) {
      // Build contentColumnDefs using our component's content. Then add our own
      // 'action' column definition to it. Then set this as the value of
      // child SPMatEntityListComponent.contentColumnDef. This way we force
      // SPMatEntityListComponent to use our component's any project MatColumnDef
      // content in the final mat-table.
      const clientColumnDefs = this.clientColumnDefs;
      let contentColumnDefs = new Array<MatColumnDef>();
      if (clientColumnDefs.length) {
        // Note that we process any content projected matColumnDef first and
        // our own internal content later. And when we process our own internal
        // columns (for now only 'action'), it's not added if a column with that
        // name has already been defined via content projection. This allows the
        // clients to override even internal columns with their column defintion.
        clientColumnDefs.toArray().forEach((c) => contentColumnDefs.push(c));
      }
      this.componentColumns().forEach((ic) => {
        if (!contentColumnDefs.find((c) => c.name === ic.name)) {
          contentColumnDefs.push(ic);
        }
      });
      spEntitiesList.contentColumnDefs = contentColumnDefs;
      // This is a replication of SPMatEntityCrudList.ngAfterViewInit. That
      // code is skipped as we declare <sp-mat-entity-list> with
      // deferViewInit=true.
      spEntitiesList.buildColumns();
      spEntitiesList.setupSort();
      spEntitiesList.loadMoreEntities();
    }
  }
}
