import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  ContentChildren,
  EventEmitter,
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
  SPBusyWheelModule,
} from '@smallpearl/ngx-helper/mat-busy-wheel';
import {
  SPContextMenuItem,
  SPMatContextMenuComponent,
} from '@smallpearl/ngx-helper/mat-context-menu';
import { SPMatEntityListComponent } from '@smallpearl/ngx-helper/mat-entity-list';

import { MatMenuModule } from '@angular/material/menu';
import { DomSanitizer } from '@angular/platform-browser';
import { SPEntityFieldSpec } from '@smallpearl/ngx-helper/entity-field';
import { AngularSplitModule } from 'angular-split';
import { startCase } from 'lodash';
import { plural } from 'pluralize';
import { map, Observable, of, Subscription, switchMap, tap } from 'rxjs';
import { getEntityCrudConfig } from './default-config';
import { FormViewHostComponent } from './form-view-host.component';
import { SPMatEntityCrudComponentBase } from './mat-entity-crud-internal-types';
import {
  ALLOW_ITEM_ACTION_FN,
  CRUD_OP_FN,
  NewItemSubType,
  SPMatEntityCrudConfig,
  SPMatEntityCrudResponseParser,
} from './mat-entity-crud-types';
import { PreviewHostComponent } from './preview-host.component';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatTableModule,
    MatSortModule,
    MatMenuModule,
    MatSnackBarModule,
    AngularSplitModule,
    SPMatEntityListComponent,
    SPMatContextMenuComponent,
    FormViewHostComponent,
    SPBusyWheelModule,
    PreviewHostComponent,
  ],
  selector: 'sp-mat-entity-crud',
  template: `
    <as-split direction="horizontal" [gutterSize]="6">
      <as-split-area [size]="entitiesPaneWidth()">
        <div
          [class]="crudConfig.listPaneWrapperClass"
          [ngStyle]="{ display: !createEditViewActive() ? 'inherit' : 'none' }"
        >
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
                    crudConfig.i18n.newItemLabel(this._itemLabel())
                }}&nbsp;&#9660;
                <!-- down arrow-head -->
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
                    crudConfig.i18n.newItemLabel(this._itemLabel())
                }}
              </button>
              } }
            </div>
          </ng-template>

          <ng-template #defaultHeaderTemplate>
            <div class="action-bar">
              <div class="action-bar-title">
                {{ _title() }}
              </div>
              <span class="spacer"></span>
              <ng-container
                [ngTemplateOutlet]="actionsTemplate() || defaultActionButtons"
              ></ng-container>
            </div>
          </ng-template>
          <ng-container
            [ngTemplateOutlet]="headerTemplate() || defaultHeaderTemplate"
          ></ng-container>
          <sp-mat-entity-list
            [_deferViewInit]="true"
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
          <td mat-cell *matCellDef="let element" (click)="$event.stopImmediatePropagation();">
            @if (_itemActions().length) {
            <sp-mat-context-menu
              [menuItems]="_itemActions()"
              (selected)="onItemAction($event, element)"
              [contextData]="element"
            ></sp-mat-context-menu>
            }
          </td>
        </ng-container>

        <div
          [class]="crudConfig.listPaneWrapperClass"
          [ngStyle]="{ display: createEditViewActive() ? 'inherit' : 'none' }"
          spHostBusyWheel="formBusyWheel"
        >
          <sp-create-edit-entity-host
            [itemLabel]="_itemLabel()"
            [itemLabelPlural]="_itemLabelPlural()"
            [entityCrudComponentBase]="this"
            [clientViewTemplate]="createEditFormTemplate()"
          ></sp-create-edit-entity-host>
        </div>
      </as-split-area>
      <as-split-area [size]="previewPaneWidth()" [visible]="previewActive()">
        @if (previewActive()) {
        <div [class]="crudConfig.previewPaneWrapperClass">
          <sp-entity-crud-preview-host
            (closePreview)="closePreview()"
            [entityCrudComponent]="this"
            [previewTemplate]="previewTemplate()!"
            [previewedEntity]="previewedEntity()"
          ></sp-entity-crud-preview-host>
        </div>
        }
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
  entityName = input.required<string>();
  entityNamePlural = input<string>();

  itemLabel = input<string>();
  itemLabelPlural = input<string>();
  /**
   * Title string displayed above the component. If not specified, will use
   * itemLabelPlural() as the title.
   */
  title = input<string>();
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
   * If not specified, will use label from SPMatEntityCrudConfig.i18n.newItemLabel.
   */
  newItemLabel = input<string | string[]>();
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

  // INTERNAL PROPERTIES //
  _entityNamePlural = computed(() =>
    this.entityNamePlural()
      ? this.entityNamePlural()
      : plural(this.entityName())
  );

  // Derive a label from a camelCase source string. If the camelCase string
  // can be translated, it returns the translated string. If not, the function
  // converts the camelCase to 'Title Case' and returns it.
  private getLabel = (source: string) => {
    const label = this.ngxHelperConfig.i18nTranslate(source);
    if (label.localeCompare(source) !== 0) { // Successful translation, return it
      return label;
    }
    return startCase(source);
  }

  _itemLabel = computed<string>(() =>
    this.itemLabel()
      ? (this.itemLabel() as string)
      : this.getLabel(this.entityName())
  );
  _itemLabelPlural = computed<string>(() =>
    this.itemLabelPlural()
      ? (this.itemLabelPlural() as string)
      : this.getLabel(plural(this.entityName()))
  );
  // Computed title
  _title = computed(() => (this.title() ? this.title() : this._itemLabelPlural()));
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

  busyWheelId = `entityCrudBusyWheel-${Date.now()}`;
  sub$ = new Subscription();
  spEntitiesList = viewChild(SPMatEntityListComponent<TEntity, IdKey>);
  crudConfig!: SPMatEntityCrudConfig;

  // This is the internal component that will host the createEditFormTemplate
  createEditHostComponent = viewChild(FormViewHostComponent);
  // A flag to toggle the viewport's contents between the mat-table
  // and the create/edit form template.
  createEditViewActive = signal<boolean>(false);

  // Whether it's okay to cancel the edit
  canCancelEditCallback!: () => boolean;

  previewedEntity = signal<TEntity | undefined>(undefined);
  previewActive = computed(() => this.previewedEntity() !== undefined);
  previewPaneWidth = signal<number>(50);
  entitiesPaneWidth = computed(() => 100 - this.previewPaneWidth());

  defaultItemCrudActions = signal<SPContextMenuItem[]>([]);
  columnsWithAction = computed(() => {
    const cols: Array<SPEntityFieldSpec<TEntity> | string> = JSON.parse(
      JSON.stringify(this.columns())
    );
    // JSON.parse(JSON.strigify()) does not clone function objects. So
    // explicitly copy these over. So this is really a shallow clone as
    // the cloned objects still refers to the function objects in the original
    // object.
    this.columns().forEach((col, index: number, orgColumns) => {
      const orgCol = orgColumns[index];
      if (typeof orgCol !== 'string') {
        const newColumn = cols[index] as SPEntityFieldSpec<TEntity>;
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
  _itemActions = computed(() => {
    const actions =
      this.itemActions() && this.itemActions().length
        ? this.itemActions()
        : this.defaultItemCrudActions();
    let actionsCopy: SPContextMenuItem[] = JSON.parse(JSON.stringify(actions));
    actionsCopy.forEach((action) => {
      action.disable = (entity: TEntity) => {
        const allowItemActionFn = this.allowEntityActionFn();
        if (allowItemActionFn) {
          return !allowItemActionFn(entity, action.role ?? action.label);
        }
        return false;
      };
    });
    return actionsCopy;
  });
  // This uses the previewActive signal to compute the visible columns
  // when preview is activated. For now we just hide the 'action' column when
  // preview is active. We can further customize this logic by allowing the
  // client to specify the columns to display when preview is active thereby
  // reducing column clutter when the table width becomes narrower owing to
  // preview pane taking up screen space.
  visibleColumns = computed(() =>
    this.previewActive()
      ? this.columnsWithAction()
          .map((col) => (typeof col === 'string' ? col : col.name))
          .filter((name) => name !== 'action')
      : []
  );

  constructor(
    http: HttpClient,
    private snackBar: MatSnackBar,
    sanitizer: DomSanitizer
  ) {
    super(http, sanitizer);
    this.crudConfig = getEntityCrudConfig();
    if (this.crudConfig?.defaultItemActions) {
      this.defaultItemCrudActions.set(this.crudConfig?.defaultItemActions);
    } else {
      this.defaultItemCrudActions.set([
        { label: this.crudConfig.i18n.edit, role: '_update_' },
        { label: this.crudConfig.i18n.delete, role: '_delete_' },
      ]);
    }
  }

  override ngOnInit() {
  }

  override ngOnDestroy(): void {
    this.sub$.unsubscribe();
  }

  override ngAfterViewInit(): void {
    const spEntitiesList = this.spEntitiesList();
    if (spEntitiesList) {
      // Build contentColumnDefs using our component's content. Then add our own
      // 'action' column definition to it. Then set this as the value of
      // child SPMatEntityListComponent.contentColumnDef. This way we force
      // SPMatEntityListComponent to use our component's any project MatColumnDef
      // content in the final mat-table.
      const clientColumnDefs = this.clientColumnDefs;
      if (clientColumnDefs && spEntitiesList) {
        // Note that we process any content projected matColumnDef first and
        // our own internal content later. And when we process our own internal
        // columns (for now only 'action'), it's not added if a column with that
        // name has already been defined via content projection. This allows the
        // clients to override even internal columns with their column defintion.
        let contentColumnDefs = new Array<MatColumnDef>();
        clientColumnDefs.toArray().forEach((c) => contentColumnDefs.push(c));
        this.componentColumns().forEach((ic) => {
          if (!contentColumnDefs.find((c) => c.name === ic.name)) {
            contentColumnDefs.push(ic);
          }
        });
        spEntitiesList.contentColumnDefs = contentColumnDefs;
      }
      // This is a replication of SPMatEntityCrudList.ngAfterViewInit. That
      // code is skipped as we declare set the _deferViewInit=true in
      // sp-mat-entity-list declaration.
      spEntitiesList.buildColumns();
      spEntitiesList.setupSort();
      spEntitiesList.loadMoreEntities();
    }
  }

  closeCreateEdit() {
    this.createEditViewActive.set(false);
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
      obs = crudOpFn('create', entityValue, this);
    } else {
      obs = this.http.post<TEntity>(this.getUrl(this.endpoint()), entityValue, {
        context: this._httpReqContext(),
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
            this.crudConfig.i18n.createdItemNotification(this._itemLabel())
          );
        }
      })
    );
  }

  update(id: TEntity[IdKey], entityValue: any) {
    let obs!: Observable<TEntity | null>;
    const crudOpFn = this.crudOpFn();
    if (crudOpFn) {
      obs = crudOpFn('update', entityValue, this);
    } else {
      obs = this.http.patch<TEntity>(this.getEntityUrl(id), entityValue, {
        context: this._httpReqContext(),
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
            this.crudConfig.i18n.updatedItemNotification(this._itemLabel())
          );
        }
      })
    );
  }

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
          this
        ) as Observable<TEntity>;
      } else {
        obs = this.http.get<TEntity>(
          this.getEntityUrl((entity as any)[this.idKey()]), {
            context: this._httpReqContext()
          }
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
      this.spEntitiesList()?.refresh();
      return of(null);
    }

    return of(entity)
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

  closePreview() {
    if (this.previewedEntity()) {
      this.spEntitiesList()?.toggleActiveEntity(this.previewedEntity());
      this.previewedEntity.set(undefined);
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
      this.activateCreateEditView();
      // const tmpl = this.createEditFormTemplate();
      // if (tmpl) {
      //   // If preview is active deactivate it
      //   if (this.previewActive()) {
      //     this.closePreview();
      //   }
      //   const createEditHost = this.createEditHostComponent();
      //   createEditHost!.show(undefined);
      //   this.createEditViewActive.set(true);
      // }
    }
    if (!this.createEditViewActive()) {
      this.action.emit({ role: '_new_' });
    }
  }

  onUpdate(entity: TEntity) {
    this.activateCreateEditView(entity);
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
    if (!this.createEditViewActive()) {
      this.action.emit({ role: '_update_' });
    }
  }

  /**
   * Show the create/edit component
   * @param entity
   * @param params
   */
  private activateCreateEditView(entity?: TEntity | undefined, params?: any) {
    const tmpl = this.createEditFormTemplate();
    if (tmpl) {
      // If preview is active deactivate it
      if (this.previewActive()) {
        this.closePreview();
      }
      const createEditHost = this.createEditHostComponent();
      createEditHost!.show(entity, params);
      this.createEditViewActive.set(true);
    }
  }

  async onDelete(entity: TEntity) {
    // Do the delete prompt asynchronously so that the context menu is
    // dismissed before the prompt is displayed.
    setTimeout(() => {
      const deletedItemPrompt = this.crudConfig.i18n.deleteItemMessage(
        this._itemLabel()
      );
      const yes = confirm(deletedItemPrompt);
      if (yes) {
        const entityId = (entity as any)[this.idKey()];

        // If preview is active deactivate it
        if (this.previewActive()) {
          this.closePreview();
        }

        let obs!: Observable<any>;
        const crudOpFn = this.crudOpFn();
        if (crudOpFn) {
          obs = crudOpFn('delete', entity, this);
        } else {
          obs = this.http.delete<void>(this.getEntityUrl(entityId));
        }

        this.sub$.add(
          obs
            .pipe(
              // TODO: how to display a busy wheel?
              // showBusyWheelUntilComplete(this.busyWheelId),
              tap(() => {
                this.spEntitiesList()!.removeEntity(entityId);
                // TODO: customize by providing an interface via SPMatEntityCrudConfig?
                const deletedMessage =
                  this.crudConfig.i18n.itemDeletedNotification(
                    this._itemLabel()
                  );
                this.snackBar.open(deletedMessage);
              })
            )
            .subscribe()
        );
      }
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

  handleSelectEntity(entity: TEntity) {
    if (this.previewTemplate()) {
      this.previewedEntity.set(entity);
    } else {
      // If 'previewTemplate' is not set, propagate the event to client.
      this.selectEntity.emit(entity);
    }
  }

  handleNewItemSubType(subtype: NewItemSubType) {
    // console.log(`handleNewItemSubType: ${subtype}`);
    if (subtype.role === '_new_') {
      this.activateCreateEditView(undefined, subtype?.params);
    } else {
      this.action.emit({ role: subtype.role });
    }
  }
}
