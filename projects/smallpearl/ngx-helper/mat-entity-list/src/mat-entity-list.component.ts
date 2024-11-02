import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  ContentChildren,
  effect,
  EventEmitter,
  Inject,
  input,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  QueryList,
  signal,
  viewChild,
  viewChildren
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSort, MatSortModule } from '@angular/material/sort';
import {
  MatColumnDef,
  MatTable,
  MatTableDataSource,
  MatTableModule,
} from '@angular/material/table';
import { createStore } from '@ngneat/elf';
import { addEntities, deleteEntities, getEntitiesCount, hasEntity, selectAllEntities, updateEntities, upsertEntities, withEntities } from '@ngneat/elf-entities';
import { spFormatDate } from '@smallpearl/ngx-helper/locale';
import { InfiniteScrollDirective } from 'ngx-infinite-scroll';
import { finalize, Observable, Subscription, tap } from 'rxjs';
import { DefaultSPMatEntityListConfig } from './config';
import {
  SPMatEntityListColumn,
  SPMatEntityListConfig,
  SPMatEntityListEntityLoaderFn,
  SPMatEntityListPaginator,
} from './mat-entity-list-types';
import { SP_MAT_ENTITY_LIST_CONFIG } from './providers';

/**
 * A component to display a list of entities loaded from remote.
 */
@Component({
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatInputModule,
    MatProgressSpinnerModule,
    InfiniteScrollDirective,
  ],
  selector: 'sp-mat-entity-list',
  template: `
    <div
      class="entities-list-wrapper"
      infiniteScroll
      [infiniteScrollDistance]="infiniteScrollDistance()"
      [infiniteScrollThrottle]="infiniteScrollThrottle()"
      [infiniteScrollContainer]="infiniteScrollContainer()"
      [scrollWindow]="infiniteScrollWindow()"
      [infiniteScrollDisabled]="
        pagination() !== 'infinite' || !_paginator || !hasMore()
      "
      (scrolled)="infiniteScrollLoadNextPage($event)"
    >
      <div
        class="busy-overlay"
        [ngClass]="{ show: pagination() === 'discrete' && loading() }"
      >
        <ng-container *ngTemplateOutlet="busySpinner"></ng-container>
      </div>
      <table mat-table [dataSource]="dataSource()">
        <tr mat-header-row *matHeaderRowDef="displayedColumns()"></tr>
        <tr
          mat-row
          [class.active-row]="activeEntityId() === row[this.idKey()]"
          *matRowDef="let row; columns: displayedColumns()"
          (click)="handleRowClick(row)"
        ></tr>
      </table>
      @if (pagination() == 'discrete' && _paginator) {
      <mat-paginator
        showFirstLastButtons
        [length]="entityCount()"
        [pageSize]="_pageSize()"
        [pageIndex]="pageIndex()"
        [pageSizeOptions]="[]"
        [hidePageSize]="true"
        (page)="handlePageEvent($event)"
        [disabled]="loading()"
        aria-label="Select page"
      ></mat-paginator>
      }
      <div
        class="infinite-scroll-loading"
        [ngClass]="{ show: pagination() === 'infinite' && loading() }"
      >
        <ng-container *ngTemplateOutlet="busySpinner"></ng-container>
      </div>
    </div>
    <!-- We keep the column definitions outside the <table> so that they can
    be dynamically added to the MatTable. -->
    <span matSort="sorter()">
      @for (column of _columns(); track $index) {
      <ng-container [matColumnDef]="column.name">
        @if (disableSort()) {
        <th mat-header-cell *matHeaderCellDef>
          {{ getColumnLabel(column) }}
        </th>
        } @else {
        <th mat-header-cell mat-sort-header *matHeaderCellDef>
          {{ getColumnLabel(column) }}
        </th>
        }
        <td mat-cell *matCellDef="let element">
          {{ getColumnValue(element, column) }}
        </td>
      </ng-container>
      }
    </span>
    <ng-template #busySpinner>
      <div class="busy-spinner">
        <mat-spinner mode="indeterminate" diameter="28"></mat-spinner>
      </div>
    </ng-template>
  `,
  styles: [
    `
      .entities-list-wrapper {
        position: relative;
      }
      .busy-overlay {
        display: none;
        height: 100%;
        width: 100%;
        position: absolute;
        top: 0px;
        left: 0px;
        z-index: 1000;
        opacity: 0.6;
        background-color: transparent;
      }
      .show {
        display: block;
      }
      .busy-spinner {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .infinite-scroll-loading {
        display: none;
        width: 100%;
        padding: 8px;
      }
      .active-row {
        font-weight: bold;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SPMatEntityListComponent<
  TEntity extends { [P in IdKey]: PropertyKey },
  IdKey extends string = 'id'
> implements OnInit, AfterViewInit, OnDestroy
{
  /* CLIENT PROVIDED PARAMETERS */
  /**
   * The endpoint from where the entities are to be retrieved
   */
  endpoint = input<string>('');
  /**
   * Custom entities loader function, which if provided will be called
   * instead of HttpClient.get.
   */
  entityLoaderFn = input<SPMatEntityListEntityLoaderFn | undefined>(undefined);
  /**
   * The columns of the entity to be displayed. This is an array of
   * SPMatEntityListColumn objects. If there's a one-to-one mapping between the
   * column's field name, its title & the rendered value, a string can be
   * specified instead. That is, the value of this property is a heterogeneous
   * array consisting of SPMatEntityListColumn<> objects and strings.
   */
  columns = input.required<Array<SPMatEntityListColumn<TEntity, IdKey>|string>>();
  /**
   * Number of entities per page. If this is not set and paginator is defined,
   * the number of entities int in the first request, will be taken as the
   * page size.
   */
  pageSize = input<number>(0);
  /**
   * Entity idKey, if idKey is different from the default 'id'.
   */
  idKey = input<string>('id');
  /**
   * Type of pagination -- continuous or discrete. 'infinite' pagination
   * uses an 'infiniteScroll' and 'discrete' pagination uses a mat-paginator
   * at the bottom to navigate between pages.
   */
  pagination = input<'infinite' | 'discrete' | 'none'>('discrete');
  /**
   * Component specific paginator. Only used if pagination != 'none'.
   */
  paginator = input<SPMatEntityListPaginator>();
  /**
   *
   */
  sorter = input<MatSort>();
  /**
   * Disable sorting of rows
   */
  disableSort = input<boolean>(false);
  /**
   * Wrappers for infiniteScroll properties, for customization by the client
   */
  infiniteScrollContainer = input<any>('');
  infiniteScrollDistance = input<number>(1);
  infiniteScrollThrottle = input<number>(400);
  infiniteScrollWindow = input<boolean>(false);
  /* END CLIENT PROVIDED PARAMETERS */

  // *** INTERNAL *** //

  // Names of columns that are displayed.
  displayedColumns = signal<string[]>([]); // ['name', 'cell', 'gender'];

  dataSource = signal<MatTableDataSource<TEntity>>(
    new MatTableDataSource<TEntity>()
  );

  table = viewChild(MatTable);
  sort = viewChild(MatSort);
  // These are our own <ng-container matColumnDef></ng-container>
  // which we create for each column that we create by the declaration:
  // <ng-container *ngFor="let column of columns()" [matColumnDef]="column.name">
  viewColumnDefs = viewChildren(MatColumnDef);
  // These are the <ng-container matColumnDef></ng-container> placed
  // inside <sp-mat-entity-list></<sp-mat-entity-list> by the client to override
  // the default <ng-container matColumnDef> created by the component.
  @ContentChildren(MatColumnDef) clientColumnDefs!: QueryList<MatColumnDef>;

  subs$ = new Subscription();

  // Pagination state
  entityCount = signal<number>(0);
  pageIndex = signal<number>(0);

  // Mechanism to default pageSize to last entities length.
  lastFetchedEntitiesCount = signal<number>(0);
  _pageSize = computed<number>(() =>
    this.pageSize() ? this.pageSize() : this.lastFetchedEntitiesCount()
  );
  // Effective columns, derived from columns(), which can either be an array
  // of objects of array of strings.
  _columns = computed<SPMatEntityListColumn<TEntity, IdKey>[]>(() => {
    const columns = this.columns();
    let cols: SPMatEntityListColumn<TEntity, IdKey>[] = []
    columns.forEach(colDef => {
      if (typeof colDef === 'string') {
        cols.push({ name: String(colDef) })
      } else if (typeof colDef === 'object') {
        cols.push(colDef as SPMatEntityListColumn<TEntity, IdKey>)
      }
    });
    return cols;
  });
  // We isolate retrieving items from the remote and providing the items
  // to the component into two distinct operations. The retrieval operation
  // retrieves data asynchronously and then stores the data in a local store.
  // The UI would be 'listening' to a reactive callback that would be triggered
  // whenever items in the store changes. This is because store is an immutable
  // data structure and any changes (addition/deletion) to it would result in
  // the entire store being replaced with a copy with the changes applied.

  // Ideally we should declare this as
  //  store!: Store<...>. But @ngneat/elf does not provide a generic type
  // for Store<...>, which can be composed from its type arguments. Instead it
  // uses type composition using its arguments to generate store's type
  // implicitly. So we use the same mechanism to enforce type safety in our
  // code. The code below results in a type declaration for store that is
  // dependent on the components generic arguments. (Making use of TypeScript's
  // type deduction system from variable assignment). Later on in the
  // constructor we reassign this.store with a new object that uses the
  // client provided idKey() value as the identifying key for each entity in
  // the sore.
  store = createStore(
    { name: Math.random().toString(36).slice(2) },
    withEntities<TEntity, IdKey>({ idKey: this.idKey() as IdKey })
  );
  // We'll initialize this in ngOnInit() when 'store' is initialized with the
  // correct TEntity store that can be safely indexed using IdKey.
  entities$!: Observable<TEntity[]>;
  // Effective paginator, coalescing local paginator and paginator from global
  // config.
  _paginator!: SPMatEntityListPaginator | undefined;
  // We will toggle this during every entity load.
  loading = signal<boolean>(false);
  // We will update this after every load and pagination() == 'infinite'
  hasMore = signal<boolean>(true);

  activeEntity = signal<TEntity|undefined>(undefined);
  activeEntityId = computed(() => this.activeEntity() ? (this.activeEntity() as any)[this.idKey()] : undefined);
  _prevActiveEntity!: TEntity|undefined;
  _activeEntityChange = effect(() => {
    const activeEntity = this.activeEntity();
    // Though we can raise the selectEntity event directly from effect handler,
    // that would prevent the event handler from being able to update any
    // signals from inside it. So we generate the event asyncronously.
    // Also, this effect handler will be invoked for the initial 'undefined'
    // during which we shouldn't emit the selectEntity event. Therefore we
    // keep another state variable to filter out this state.
    setTimeout(() => {
      if (this._prevActiveEntity && !activeEntity) {
        this.selectEntity.emit(activeEntity);
      } else if (activeEntity) {
        this.selectEntity.emit(activeEntity);
      }
      this._prevActiveEntity = activeEntity;
    });
  });
  @Output() selectEntity = new EventEmitter<TEntity>();

  constructor(
    protected http: HttpClient,
    @Optional()
    @Inject(SP_MAT_ENTITY_LIST_CONFIG)
    protected config: SPMatEntityListConfig,
  ) {
    if (!this.config) {
      this.config = new DefaultSPMatEntityListConfig();
    }
  }

  ngOnInit() {
    // This is the reactive callback that listens for changes to table entities
    // which are reflected in the mat-table.
    this.store = createStore(
      { name: Math.random().toString(36).slice(2) },
      withEntities<TEntity, IdKey>({ idKey: this.idKey() as IdKey })
    );
    this.entities$ = this.store.pipe(selectAllEntities());
    this._paginator = this.paginator()
      ? this.paginator()
      : this.config?.paginator;

    this.subs$.add(
      this.entities$
        .pipe(
          tap((entities) => {
            // .data is a setter property, which ought to trigger the necessary
            // signals resulting in mat-table picking up the changes without
            // requiring us to call cdr.detectChanges() explicitly.
            this.dataSource().data = entities;
          })
        )
        .subscribe()
    );
  }

  ngOnDestroy(): void {
    this.subs$.unsubscribe();
  }

  ngAfterViewInit(): void {
    this.buildColumns();
    const matSort = this.sort();
    if (matSort) {
      this.dataSource().sort = matSort;
    }
  }

  addEntity(entity: TEntity) {
    const pagination = this.pagination()
    const count = this.store.query(getEntitiesCount())
    if (pagination === 'infinite' || pagination === 'none' || count < this.pageSize()) {
      this.store.update(addEntities(entity));
    } else {
      // 'discrete' pagination, refresh the crud items from the beginning.
      // Let component client set the behavior using a property
      // this.pageIndex.set(0);
      // this.loadMoreEntities();
    }
  }

  /**
   * Update an entity with a modified version. Can be used by CRUD UPDATE
   * operation to update an entity in the local store that is used to as the
   * source of MatTableDataSource.
   * @param id
   * @param entity
   */
  updateEntity(id: TEntity[IdKey], entity: TEntity) {
    if (this.store.query(hasEntity(id))) {
      this.store.update(updateEntities(id, entity));
    }
  }

  /**
   * Clients can call this method when it has deleted and entity via a CRUD
   * operation. Depending on the pagination mode, MatEntityList implements
   * an appropriate behavior.
   *
   * If the pagination is 'infinite', the relevent entity is removed from our
   * entity list. View will be repained as data store has changed.
   *
   * If the pagination is 'discrete', the entity is removed from the page.
   * If this is the only entity in the page, the current pageNumber is
   * decremented by 1 if it's possible (if the current pageNumber > 1).
   * The page is reloaded from remote.
   */
  removeEntity(id: TEntity[IdKey]) {
    const paginator = this._paginator;
    if (paginator) {
      if (this.pagination() === 'infinite') {
        // This will cause store to mutate which will trigger this.entity$ to
        // emit which in turn will update our MatTableDataSource instance.
        this.store.update(deleteEntities(id));
      } else {
        // Logic
        this.store.update(deleteEntities(id));
        const count = this.store.query(getEntitiesCount());
        if (count == 0) {
          // No more entities in this page
          // Go back one page
          if (this.pageIndex() > 0) {
            this.pageIndex.set(this.pageIndex()-1);
          }
        }
        // load the page again
        this.loadMoreEntities();
      }
    } else {
      // Just remove the entity that has been deleted.
      this.store.update(deleteEntities(id));
    }
  }

  getColumnValue(
    entity: TEntity,
    column: SPMatEntityListColumn<TEntity, IdKey>
  ) {
    let val = undefined;
    if (!column.valueFn) {
      val = (entity as any)[column.name];
    } else {
      val = column.valueFn(entity);
    }
    if (val instanceof Date) {
      return spFormatDate(val);
    } else if (typeof val === 'boolean') {
      return val ? '✔' : '✖';
    }
    return val;
  }

  getColumnLabel(column: SPMatEntityListColumn<TEntity, IdKey>) {
    return this.config && this.config?.i18nTranslate
      ? this.config.i18nTranslate(column?.label || column.name)
      : column?.label || column.name;
  }

  /**
   * Build the effective columns by parsing our own <ng-container matColumnDef>
   * statements for each column in columns() property and client's
   * <ng-container matColumnDef> provided via content projection.
   */
  private buildColumns() {
    if (this.table()) {
      const columnNames = new Set();
      const columnDefs: MatColumnDef[] = [];

      this._columns().forEach((colDef) => {
        const matColDef = this.viewColumnDefs().find(
          (cd) => cd.name === colDef.name
        );
        const clientColDef = this.clientColumnDefs.find(
          (cd) => cd.name === colDef.name
        );
        const columnDef = clientColDef ? clientColDef : matColDef;
        if (columnDef) {
          columnDefs.push(columnDef);
          columnNames.add(colDef.name);
        }
      });
      columnDefs.forEach((cd) => {
        this.table()!.addColumnDef(cd);
      });

      this.displayedColumns.set(Array.from(columnNames) as string[]);
      this.loadMoreEntities();
    }
  }

  infiniteScrollLoadNextPage(ev: any) {
    // console.log(`infiniteScrollLoadNextPage - ${JSON.stringify(ev)}`);
    if (this._paginator) {
      this.loadMoreEntities();
    }
  }

  private loadMoreEntities() {
    let pageParams = {};
    if (this._paginator) {
      pageParams = this._paginator.getRequestPageParams(
        this.endpoint(),
        this.pageIndex(),
        this.pageSize()
      );
    }

    // Inline check for input signal value before calling its value doesn't
    // seem to work as of now. So we assign the value to a const and check
    // it for undefined before calling it.
    const loaderFn = this.entityLoaderFn();
    const obs =
      loaderFn !== undefined
        ? loaderFn({ params: pageParams })
        : this.http.get<any>(this.getUrl(this.endpoint()), { params: pageParams });

    this.loading.set(true);
    this.subs$.add(
      obs
        .pipe(
          tap((resp) => {
            // TODO: defer this to a pagination provider so that we can support
            // many types of pagination. DRF itself has different schemes. And
            // express may have yet another pagination protocol.
            if (this._paginator) {
              const { entities, total } = this._paginator.parseRequestResponse(
                this.endpoint(),
                pageParams,
                resp
              );
              this.entityCount.set(total);
              this.lastFetchedEntitiesCount.set(entities.length);
              // this.pageIndex.set(this.pageIndex() + 1)
              // entities = this._paginator.getEntitiesFromResponse(entities);
              if (this.pagination() === 'discrete') {
                this.store.reset();
              } else if (this.pagination() === 'infinite') {
                const pageSize = this._pageSize();
                const entityCount = this.entityCount();
                if (pageSize > 0) {
                  const pageCount =
                    Math.floor(entityCount / pageSize) +
                    (entityCount % pageSize ? 1 : 0);
                  this.hasMore.set(this.pageIndex() === pageCount);
                } else {
                  this.hasMore.set(false);
                }
              }
              // store the entities in the store
              // TODO: remove as any
              this.store.update(upsertEntities(entities as any));
            } else {
              this.store.update(
                upsertEntities(this.findArrayInResult(resp) as TEntity[])
              );
            }
          }),
          finalize(() => {
            this.loading.set(false);
          })
        )
        .subscribe()
    );
  }

  private findArrayInResult(res: any): any[] | undefined {
    if (Array.isArray(res)) {
      return res;
    }
    for (const key in res) {
      if (Object.prototype.hasOwnProperty.call(res, key)) {
        const element = res[key];
        if (Array.isArray(element)) {
          return element;
        }
      }
    }
    return [];
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex.set(e.pageIndex);
    this.loadMoreEntities();
  }

  getUrl(endpoint: string) {
    return this.config?.urlResolver ? this.config?.urlResolver(endpoint) : endpoint;
  }

  handleRowClick(entity: TEntity) {
    if (entity) {
      if (entity === this.activeEntity()) {
        this.activeEntity.set(undefined);
      } else {
        this.activeEntity.set(entity);
      }
    }
  }
}
