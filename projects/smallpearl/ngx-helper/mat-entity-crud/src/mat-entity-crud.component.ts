import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  ContentChildren,
  EventEmitter,
  Inject,
  input,
  Optional,
  Output,
  QueryList,
  signal,
  TemplateRef,
  viewChild,
  viewChildren,
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
import {
  SP_MAT_ENTITY_LIST_CONFIG,
  SPMatEntityListColumn,
  SPMatEntityListComponent,
  SPMatEntityListConfig,
} from '@smallpearl/ngx-helper/mat-entity-list';
import { AngularSplitModule } from 'angular-split';
import { Observable, Subscription, tap } from 'rxjs';
import { getConfig } from './default-config';
import { FormViewHostComponent } from './form-view-host.component';
import { SPMatEntityCrudComponentBase } from './mat-entity-crud-internal-types';
import { CRUD_OP_FN, SPMatEntityCrudConfig } from './mat-entity-crud-types';
import { PreviewHostComponent } from './preview-host.component';
import { SP_MAT_ENTITY_CRUD_CONFIG } from './providers';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatTableModule,
    MatSortModule,
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
          [class]="config.listPaneWrapperClass"
          [ngStyle]="{ display: !createEditViewActive() ? 'inherit' : 'none' }"
        >
          <div class="action-bar">
            <div class="action-bar-title">
              {{ itemsLabel() }}
            </div>
            <span class="spacer"></span>
            <div class="action-bar-actions">
              @if (!disableCreate()) {
              <button
                mat-raised-button
                color="primary"
                (click)="onCreate($event)"
                [routerLink]="newItemLink()"
              >
                {{ config.i18n.newItemLabel(this.itemLabel()) }}
              </button>
              }
            </div>
          </div>
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
          [class]="config.listPaneWrapperClass"
          [ngStyle]="{ display: createEditViewActive() ? 'inherit' : 'none' }"
          spHostBusyWheel="formBusyWheel"
        >
          <sp-create-edit-entity-host
            [itemLabel]="itemLabel()"
            [itemsLabel]="itemsLabel()"
            [entityCrudComponentBase]="this"
            [clientViewTemplate]="createEditFormTemplate()"
          ></sp-create-edit-entity-host>
        </div>
      </as-split-area>
      <as-split-area [size]="previewPaneWidth()" [visible]="previewActive()">
        @if (previewActive()) {
        <div [class]="config.previewPaneWrapperClass">
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
  implements SPMatEntityCrudComponentBase, AfterViewInit
{
  itemLabel = input.required<string>();
  itemsLabel = input.required<string>();
  itemActions = input<SPContextMenuItem[]>([]);
  newItemLink = input<string | string[]>();
  crudOpFn = input<CRUD_OP_FN<TEntity, IdKey>>();
  previewTemplate = input<TemplateRef<any>>();

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
  override config!: SPMatEntityCrudConfig;

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
    const cols: Array<SPMatEntityListColumn<TEntity, IdKey> | string> =
      JSON.parse(JSON.stringify(this.columns()));
    // JSON.parse(JSON.strigify()) does not clone function objects. So
    // explicitly copy these over. So this is really a shallow clone as
    // the cloned objects still refers to the function objects in the original
    // object.
    this.columns().forEach((col, index: number, orgColumns) => {
      const orgCol = orgColumns[index];
      if (typeof orgCol !== 'string') {
        const newColumn = (cols[index] as SPMatEntityListColumn<TEntity, IdKey>);
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
  _itemActions = computed(() =>
    this.itemActions() && this.itemActions().length
      ? this.itemActions()
      : this.defaultItemCrudActions()
  );
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
    @Optional()
    @Inject(SP_MAT_ENTITY_CRUD_CONFIG)
    crudConfig: SPMatEntityCrudConfig,
    @Optional()
    @Inject(SP_MAT_ENTITY_LIST_CONFIG)
    private entityListConfig: SPMatEntityListConfig,
    http: HttpClient,
    private snackBar: MatSnackBar,
    sanitizer: DomSanitizer
  ) {
    super(http, entityListConfig, sanitizer);
    this.config = getConfig(crudConfig);
    if (this.config?.defaultItemActions) {
      this.defaultItemCrudActions.set(this.config?.defaultItemActions);
    } else {
      this.defaultItemCrudActions.set([
        { label: this.config.i18n.edit, role: '_update_' },
        { label: this.config.i18n.delete, role: '_delete_' },
      ]);
    }
  }

  override ngOnInit() {}

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

  create(entityValue: any) {
    let obs!: Observable<TEntity | null>;
    const crudOpFn = this.crudOpFn();
    if (crudOpFn) {
      obs = crudOpFn('create', entityValue, this);
    } else {
      obs = this.http.post<TEntity>(this.getUrl(this.endpoint()), entityValue);
    }

    return obs.pipe(
      showBusyWheelUntilComplete('formBusyWheel'),
      tap((entity) => {
        // If pagination is infinite or if the pagination if none or if the
        // count of items in the current page is less than pageSize()
        // wec an safely add the item to the list, which will cause the view
        // render the new item in the mat-table.
        if (entity) {
          this.spEntitiesList()?.addEntity(entity);
          this.snackBar.open(
            this.config.i18n.createdItemNotification(this.itemLabel())
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
      obs = this.http.patch<TEntity>(
        this.getEntityUrl(this.endpoint(), id),
        entityValue
      );
    }

    return obs.pipe(
      showBusyWheelUntilComplete('formBusyWheel'),
      tap((entity) => {
        if (entity) {
          this.spEntitiesList()?.updateEntity(id, entity);
          this.snackBar.open(
            this.config.i18n.updatedItemNotification(this.itemLabel())
          );
        }
      })
    );
  }

  closePreview() {
    if (this.previewedEntity()) {
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
      const tmpl = this.createEditFormTemplate();
      const createEditHost = this.createEditHostComponent();
      if (tmpl && createEditHost) {
        createEditHost.show(undefined);
        this.createEditViewActive.set(true);
      }
      if (!this.createEditViewActive()) {
        this.action.emit({ role: '_new_' });
      }
    }
    // fall through to let routerLink act
  }

  onUpdate(entity: TEntity) {
    const tmpl = this.createEditFormTemplate();
    const createEditHost = this.createEditHostComponent();
    if (tmpl && createEditHost) {
      createEditHost.show(entity);
      this.createEditViewActive.set(true);
    }
    if (!this.createEditViewActive()) {
      this.action.emit({ role: '_update_' });
    }
  }

  async onDelete(entity: TEntity) {
    // Do the delete prompt asynchronously so that the context menu is
    // dismissed before the prompt is displayed.
    setTimeout(() => {
      const deletedItemPrompt = this.config.i18n.deleteItemMessage(
        this.itemLabel()
      );
      const yes = confirm(deletedItemPrompt);
      if (yes) {
        const entityId = (entity as any)[this.idKey()];

        let obs!: Observable<any>;
        const crudOpFn = this.crudOpFn();
        if (crudOpFn) {
          obs = crudOpFn('delete', entity, this);
        } else {
          obs = this.http.delete<void>(
            this.getEntityUrl(this.endpoint(), entityId)
          );
        }

        this.sub$.add(
          obs
            .pipe(
              // TODO: how to display a busy wheel?
              // showBusyWheelUntilComplete(this.busyWheelId),
              tap(() => {
                this.spEntitiesList()!.removeEntity(entityId);
                // TODO: customize by providing an interface via SPMatEntityCrudConfig?
                const deletedMessage = this.config.i18n.itemDeletedNotification(
                  this.itemLabel()
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

  getEntityUrl(endpoint: string, entityId: TEntity[IdKey]) {
    const entitEndpoint =
      (endpoint.endsWith('/') ? endpoint : endpoint + '/') +
      `${String(entityId)}/`;
    return this.getUrl(entitEndpoint);
  }

  handleSelectEntity(entity: TEntity) {
    if (this.previewTemplate()) {
      this.previewedEntity.set(entity);
    } else {
      // If 'previewTemplate' is not set, propagate the event to client.
      this.selectEntity.emit(entity);
    }
  }
}
