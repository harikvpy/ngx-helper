import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Inject,
  input,
  Optional,
  Output,
  signal,
  TemplateRef,
  viewChild
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { showBusyWheelUntilComplete, SPBusyWheelModule } from '@smallpearl/ngx-helper/mat-busy-wheel';
import {
  SPContextMenuItem,
  SPMatContextMenuComponent,
} from '@smallpearl/ngx-helper/mat-context-menu';
import {
  SP_MAT_ENTITY_LIST_CONFIG,
  SPMatEntityListComponent,
  SPMatEntityListConfig,
} from '@smallpearl/ngx-helper/mat-entity-list';
import { Observable, Subscription, tap } from 'rxjs';
import { getConfig } from './default-config';
import { FormViewHostComponent } from './form-view-host.component';
import { SPMatEntityCrudComponentBase } from './mat-entity-crud-internal-types';
import { CRUD_OP_FN, SPMatEntityCrudConfig } from './mat-entity-crud-types';
import { SP_MAT_ENTITY_CRUD_CONFIG } from './providers';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatTableModule,
    MatSnackBarModule,
    SPMatEntityListComponent,
    SPMatContextMenuComponent,
    FormViewHostComponent,
    SPBusyWheelModule,
  ],
  selector: 'sp-mat-entity-crud',
  template: `
  <div>
    <div [ngStyle]="{'display': !createEditViewActive() ? 'inherit' : 'none'}">
      <div class="action-bar">
        <div class="action-bar-title">
          {{ itemsLabel() }}
        </div>
        <span class="spacer"></span>
        <div class="action-bar-actions">
          <button
            mat-raised-button
            color="primary"
            (click)="onCreate($event)"
            [routerLink]="newItemLink()"
          >
            {{ config.i18n.newItemLabel(this.itemLabel()) }}
          </button>
        </div>
      </div>
      <sp-mat-entity-list
        [endpoint]="endpoint()"
        [entityLoaderFn]="entityLoaderFn()"
        [columns]="columns()"
        [idKey]="idKey()"
        [pagination]="pagination()"
        [paginator]="paginator()"
        [pageSize]="pageSize()"
        [sorter]="sorter()"
        [disableSort]="disableSort()"
      >
        <ng-container matColumnDef="action">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let element">
            @if (itemActions().length) {
            <sp-mat-context-menu
              [menuItems]="itemActions()"
              (selected)="onItemAction($event, element)"
              [contextData]="element"
            ></sp-mat-context-menu>
            }
          </td>
        </ng-container>
      </sp-mat-entity-list>
    </div>
    <div [ngStyle]="{'display': createEditViewActive() ? 'inherit' : 'none'}" spHostBusyWheel="formBusyWheel">
      <sp-create-edit-entity-host
        [itemLabel]="itemLabel()"
        [itemsLabel]="itemsLabel()"
        [entityCrudComponentBase]="this"
        [clientViewTemplate]="createEditFormTemplate()"
      ></sp-create-edit-entity-host>
    </div>
  </div>
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
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SPMatEntityCrudComponent<
  TEntity extends { [P in IdKey]: PropertyKey },
  IdKey extends string = 'id'
> extends SPMatEntityListComponent<TEntity, IdKey> implements SPMatEntityCrudComponentBase {
  itemLabel = input.required<string>();
  itemsLabel = input.required<string>();
  itemActions = input<SPContextMenuItem[]>([]);
  newItemLink = input<string | string[]>();
  crudOpFn = input<CRUD_OP_FN<TEntity, IdKey>>();
  /**
   * Event raised for user selecting an item action. It's also raised
   * for 'New <Item>' action, if 'newItemLink' property is not set.
   */
  @Output() action = new EventEmitter<{role: string, entity?: TEntity}>();

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
  createEditFormTemplate = input<TemplateRef<any>|null>(null);

  // This is the internal component that will host the createEditFormTemplate
  createEditHostComponent = viewChild(FormViewHostComponent);
  // A flag to toggle the viewport's contents between the mat-table
  // and the create/edit form template.
  createEditViewActive = signal<boolean>(false);

  // Whether it's okay to cancel the edit
  canCancelEditCallback!: () => boolean;

  constructor(
    @Optional()
    @Inject(SP_MAT_ENTITY_CRUD_CONFIG)
    crudConfig: SPMatEntityCrudConfig,
    @Optional()
    @Inject(SP_MAT_ENTITY_LIST_CONFIG)
    private entityListConfig: SPMatEntityListConfig,
    http: HttpClient,
    private snackBar: MatSnackBar,
  ) {
    super(http, entityListConfig);
    this.config = getConfig(crudConfig);
  }

  override ngOnInit() {}

  override ngOnDestroy(): void {
    this.sub$.unsubscribe();
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
    let obs!: Observable<TEntity|null>;
    const crudOpFn = this.crudOpFn();
    if (crudOpFn) {
      obs = crudOpFn('create', entityValue, this);
    } else {
      obs = this.http.post<TEntity>(this.getUrl(this.endpoint()), entityValue);
    }

    return obs.pipe(
      showBusyWheelUntilComplete('formBusyWheel'),
      tap(entity => {
        // If pagination is infinite or if the pagination if none or if the
        // count of items in the current page is less than pageSize()
        // wec an safely add the item to the list, which will cause the view
        // render the new item in the mat-table.
        if (entity) {
          this.spEntitiesList()?.addEntity(entity);
          this.snackBar.open(
            this.config.i18nTranslate!(this.config.i18n.createdItemNotification, {item: this.itemLabel()})
          );
        }
      }),
    );
  }

  update(id: TEntity[IdKey], entityValue: any) {
    let obs!: Observable<TEntity|null>;
    const crudOpFn = this.crudOpFn();
    if (crudOpFn) {
      obs = crudOpFn('update', entityValue, this);
    } else {
      obs = this.http.patch<TEntity>(this.getEntityUrl(this.endpoint(), id), entityValue);
    }

    return obs.pipe(
      showBusyWheelUntilComplete('formBusyWheel'),
      tap(entity => {
        if (entity) {
          this.spEntitiesList()?.updateEntity(id, entity);
          if (this.config.i18nTranslate) {
            this.snackBar.open(
              this.config.i18nTranslate(this.config.i18n.updatedItemNotification, {item: this.itemLabel()})
            );
          }
        }
      }),
    )
  }

  onItemAction(role: string, entity: TEntity) {
    if (role === '_update_') {
      this.onUpdate(entity);
    } else if (role === '_delete_') {
      this.onDelete(entity);
    } else {
      this.action.emit({role, entity});
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
        this.action.emit({role: '_new_'});
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
      this.action.emit({role: '_update_'});
    }
}

  async onDelete(entity: TEntity) {
    // Do the delete prompt asynchronously so that the context menu is
    // dismissed before the prompt is displayed.

    setTimeout(() => {
      const yes = confirm(this.config.i18n.deleteItemMessage);
      if (yes) {
        const entityId = (entity as any)[this.idKey()];
        this.sub$.add(
          this.http
            .delete(this.getUrl(this.endpoint()) + `${entityId}/`)
            .pipe(
              // TODO: how to display a busy wheel?
              // showBusyWheelUntilComplete(this.busyWheelId),
              tap(() => {
                this.spEntitiesList()!.removeEntity(entityId);
                if (this.config?.i18nTranslate) {
                  // TODO: customize by providing an interface via SPMatEntityCrudConfig?
                  const deletedMessage = this.config.i18nTranslate(this.config.i18n.itemDeletedNotification, {item: this.itemLabel()});
                  this.snackBar.open(deletedMessage);
                }
              })
            )
            .subscribe()
        );
      }
    });
  }

  override getUrl(endpoint: string) {
    return this.entityListConfig?.urlResolver ? this.entityListConfig?.urlResolver(endpoint) : endpoint;
  }

  getEntityUrl(endpoint: string, entityId: TEntity[IdKey]) {
    const entitEndpoint = (endpoint.endsWith('/') ? endpoint : endpoint+ '/') +`${String(entityId)}/`;
    return this.getUrl(entitEndpoint);
  }
}
