import { CommonModule } from '@angular/common';
import { HttpClient, HttpContext, HttpContextToken, HttpParams } from '@angular/common/http';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  ContentChildren,
  Directive,
  effect,
  ElementRef,
  EventEmitter,
  inject,
  Injector,
  input,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  runInInjectionContext,
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
import { DomSanitizer } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { createStore } from '@ngneat/elf';
import {
  addEntities,
  deleteEntities,
  getEntitiesCount,
  hasEntity,
  selectAllEntities,
  updateEntities,
  upsertEntities,
  withEntities,
} from '@ngneat/elf-entities';
import {
  SP_ENTITY_FIELD_CONFIG,
  SPEntityField,
  SPEntityFieldSpec
} from '@smallpearl/ngx-helper/entity-field';
import { InfiniteScrollDirective } from 'ngx-infinite-scroll';
import { plural } from 'pluralize';
import {
  distinctUntilChanged,
  filter,
  finalize,
  Observable,
  of,
  Subject,
  Subscription,
  switchMap,
  takeUntil,
  tap
} from 'rxjs';
import { getEntityListConfig } from './config';
import {
  SP_MAT_ENTITY_LIST_HTTP_CONTEXT,
  SPMatEntityListEntityLoaderFn,
  SPMatEntityListPaginator
} from './mat-entity-list-types';

@Directive({
  selector: '[headerAlignment]',
  standalone: true
})
export class HeaderAlignmentDirective implements AfterViewInit {

  headerAlignment = input<string>();

  constructor(private el: ElementRef) {
    // this.el.nativeElement.style.backgroundColor = 'yellow';
  }

  ngAfterViewInit(): void {
    if (this.headerAlignment()) {
      const sortHeader = this.el.nativeElement.querySelector('.mat-sort-header-container');
      if (sortHeader) {
        sortHeader.style.justifyContent = this.headerAlignment();
      } else {
        this.el.nativeElement.style.justifyContent = this.headerAlignment();
      }
    }
  }
}

/**
 * Represents a request to load entities from the remote. This is used to
 * compare two requests to determine if they are equal. This is useful to
 * prevent duplicate requests being sent to the remote.
 */
class LoadRequest {
  constructor(
    public endpoint: string,
    public params: HttpParams,
    public force = false
  ) {}

  // Returns true if two LoadRequest objects are equal and this object's
  // 'force' is not set to true.
  isEqualToAndNotForced(prev: LoadRequest): boolean {
    // console.log(
    //   `isEqualToAndNotForced - ${this.endpoint}, ${this.params.toString()} ${
    //     this.force
    //   }, other: ${prev.endpoint}, ${prev.params.toString()}, ${prev.force}`
    // );
    return this.force
      ? false
      : this.endpoint.localeCompare(prev.endpoint) === 0 &&
          this.params.toString().localeCompare(prev.params.toString()) === 0;
  }
}

/**
 * A component to display a list of entities loaded from remote.
 */
@Component({
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatInputModule,
    MatProgressSpinnerModule,
    InfiniteScrollDirective,
    HeaderAlignmentDirective,
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
        <tr mat-header-row *matHeaderRowDef="_displayedColumns()"></tr>
        <tr
          mat-row
          [class.active-row]="activeEntityId() === row[this.idKey()]"
          *matRowDef="let row; columns: _displayedColumns()"
          (click)="toggleActiveEntity(row)"
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
      @for (column of __columns(); track $index) {
      <ng-container [matColumnDef]="column.spec.name">
        @if (disableSort()) {
        <th
          [class]="column.class"
          [headerAlignment]="column.options.alignment"
          mat-header-cell
          *matHeaderCellDef
        >
          {{ getColumnLabel(column) | async }}
        </th>
        } @else {
        <th
          [class]="column.class"
          [headerAlignment]="column.options.alignment"
          mat-header-cell
          mat-sort-header
          *matHeaderCellDef
        >
          {{ getColumnLabel(column) | async }}
        </th>
        }
        <td
          [class]="column.class"
          [style.text-align]="column.options.alignment"
          mat-cell
          *matCellDef="let element"
          [routerLink]="column.getRouterLink(element)"
        >
          @if (column.hasRouterLink(element)) {
          <a [routerLink]="column.getRouterLink(element)">
            <span [innerHTML]="column.value(element)"></span>
          </a>
          } @else { @let val = column.value(element);
          <span [innerHTML]="isAsync(val) ? (val | async) : val"></span>
          }
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
> implements OnInit, OnDestroy, AfterViewInit
{
  /* CLIENT PROVIDED PARAMETERS */
  entityName = input.required<string>();
  entityNamePlural = input<string>();

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
   * SPEntityFieldSpec objects. If there's a one-to-one mapping between the
   * column's field name, its title & the rendered value, a string can be
   * specified instead. That is, the value of this property is a heterogeneous
   * array consisting of SPEntityFieldSpec<> objects and strings.
   */
  columns = input<Array<SPEntityFieldSpec<TEntity, IdKey> | string>>([]);

  /**
   * Names of columns that are displayed. This will default to all the columns
   * listed in columns.
   */
  displayedColumns = input<string[]>([]); // ['name', 'cell', 'gender'];

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
  /**
   * Custom context to be set for HttpClient requests. In the client code
   * specify this property by initializing a member variable as:

      ```
      Component({
        ...
        template: `
          <sp-mat-entity-list
            [httpReqContext]="httpReqContext"
          ></sp-mat-entity-list>
        `
      })
      export class YourComponent {
        httpReqContext: [HttpContextToken<any>, any] = [
          SIDELOAD_TO_COMPOSITE_PARAMS, 'customers'
        ];
      }
      ```
   *
   * Of course if you want to pass multiple context properties, declare the type
   * as an array of array. That is, `[[HttpContextToken<any>, any]]` and
   * initialize it appropriately.
   */
  httpReqContext = input<
    [[HttpContextToken<any>, any]] | [HttpContextToken<any>, any]
  >();
  /* END CLIENT PROVIDED PARAMETERS */

  // *** INTERNAL *** //
  _entityNamePlural = computed(() =>
    this.entityNamePlural()
      ? this.entityNamePlural()
      : plural(this.entityName())
  );

  _httpReqContext = computed(() => {
    let reqContext = this.httpReqContext();
    const context = new HttpContext();
    if (reqContext && Array.isArray(reqContext)) {
      if (reqContext.length == 2 && !Array.isArray(reqContext[0])) {
        // one dimensional array of a key, value pair.
        context.set(reqContext[0], reqContext[1]);
      } else {
        reqContext.forEach(([k, v]) => context.set(k, v));
      }
    }
    context.set(SP_MAT_ENTITY_LIST_HTTP_CONTEXT, {
      entityName: this.entityName(),
      entityNamePlural: this._entityNamePlural(),
      endpoint: this.endpoint(),
    });
    return context;
  });
  deferViewInit = input<boolean>(false);
  firstLoadDone = false;
  allColumnNames = signal<string[]>([]);
  _displayedColumns = computed(() =>
    this.displayedColumns().length > 0
      ? this.displayedColumns().filter(
          (colName) =>
            this.allColumnNames().find((name) => name === colName) !== undefined
        )
      : this.allColumnNames()
  );
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

  contentColumnDefs: MatColumnDef[] = [];

  subs$ = new Subscription();
  destroy$ = new Subject<void>();

  // Pagination state
  entityCount = signal<number>(0);
  pageIndex = signal<number>(0);

  // Mechanism to default pageSize to last entities length.
  lastFetchedEntitiesCount = signal<number>(0);
  _pageSize = computed<number>(() =>
    this.pageSize()
      ? this.pageSize()
      : this.entityListConfig.defaultPageSize ?? this.lastFetchedEntitiesCount()
  );
  // Effective columns, derived from columns(), which can either be an array
  // of objects of array of strings.
  _columns = computed<SPEntityFieldSpec<TEntity, IdKey>[]>(() => {
    const columns = this.columns();
    let fields: SPEntityField<TEntity, IdKey>[] = [];
    let cols: SPEntityFieldSpec<TEntity, IdKey>[] = [];
    columns.forEach((colDef) => {
      // fields.push(new SPEntityField(colDef))
      if (typeof colDef === 'string') {
        cols.push({ name: String(colDef) });
      } else if (typeof colDef === 'object') {
        cols.push(colDef as SPEntityFieldSpec<TEntity, IdKey>);
      }
    });
    return cols;
  });

  __columns = computed<SPEntityField<TEntity, IdKey>[]>(() =>
    this.columns().map(
      (colDef) => new SPEntityField<TEntity, IdKey>(colDef, this.fieldConfig)
    )
  );

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

  activeEntity = signal<TEntity | undefined>(undefined);
  activeEntityId = computed(() =>
    this.activeEntity() ? (this.activeEntity() as any)[this.idKey()] : undefined
  );
  _prevActiveEntity!: TEntity | undefined;
  _activeEntityChange = effect(() => {
    runInInjectionContext(this.injector, () => {
      const activeEntity = this.activeEntity();
      // Though we can raise the selectEntity event directly from effect handler,
      // that would prevent the event handler from being able to update any
      // signals from inside it. So we generate the event asyncronously.
      // Also, this effect handler will be invoked for the initial 'undefined'
      // during which we shouldn't emit the selectEntity event. Therefore we
      // keep another state variable to filter out this state.
      if (activeEntity || this._prevActiveEntity) {
        setTimeout(() => {
          this._prevActiveEntity = activeEntity;
          this.selectEntity.emit(activeEntity);
          // if (this._prevActiveEntity && !activeEntity) {
          //   this.selectEntity.emit(activeEntity);
          // } else if (activeEntity) {
          //   this.selectEntity.emit(activeEntity);
          // }
        });
      }
    });
  });
  @Output() selectEntity = new EventEmitter<TEntity | undefined>();

  fieldConfig = inject(SP_ENTITY_FIELD_CONFIG, { optional: true })!;
  entityListConfig = getEntityListConfig();

  /**
   * A signal that can be used to trigger loading of more entities from the
   * remote. This can be visualized as the event loop of the entity list
   * component.
   */
  loadRequest$ = new Subject<LoadRequest>();

  endpointChanged = effect(() => {
    runInInjectionContext(this.injector, () => {
      if (this.endpoint()) {
        // console.log(`endpointChanged - ${this.endpoint()}`);
        setTimeout(() => {
          this.refresh();
        });
      }
    });
  });

  constructor(
    protected http: HttpClient,
    private sanitizer: DomSanitizer,
    private injector: Injector
  ) {}

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
      : this.entityListConfig?.paginator;

    this.entities$
      .pipe(
        takeUntil(this.destroy$),
        tap((entities) => {
          // .data is a setter property, which ought to trigger the necessary
          // signals resulting in mat-table picking up the changes without
          // requiring us to call cdr.detectChanges() explicitly.
          this.dataSource().data = entities;
        })
      )
      .subscribe();

    this.loadRequest$
      .pipe(
        takeUntil(this.destroy$),
        filter((lr) => lr.endpoint !== '' || lr.force === true),
        distinctUntilChanged((prev, current) =>
          current.isEqualToAndNotForced(prev)
        ),
        switchMap((lr: LoadRequest) => this.doActualLoad(lr))
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    if (!this.deferViewInit()) {
      this.buildContentColumnDefs();
      this.buildColumns();
      this.setupSort();
      this.loadMoreEntities();
    }
  }

  /**
   * Clear all entities in store and reload them from endpoint as if
   * the entities are being loaded for the first time.
   */
  refresh(force = false) {
    this.pageIndex.set(0);
    this.loadMoreEntities(force);
  }

  addEntity(entity: TEntity) {
    const pagination = this.pagination();
    const count = this.store.query(getEntitiesCount());
    if (
      pagination === 'infinite' ||
      pagination === 'none' ||
      count < this._pageSize()
    ) {
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
            this.pageIndex.set(this.pageIndex() - 1);
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

  /**
   * Build the contentColumnDefs array by enumerating all of client's projected
   * content with matColumnDef directive.
   */
  buildContentColumnDefs() {
    const clientColumnDefs = this.clientColumnDefs;
    if (clientColumnDefs) {
      this.contentColumnDefs = clientColumnDefs.toArray();
    }
  }

  /**
   * Build the effective columns by parsing our own <ng-container matColumnDef>
   * statements for each column in columns() property and client's
   * <ng-container matColumnDef> provided via content projection.
   */
  buildColumns() {
    const matTable = this.table();

    if (matTable) {
      const columnNames = new Set<string>();
      const columnDefs: MatColumnDef[] = [];

      this._columns().forEach((colDef) => {
        if (!columnNames.has(colDef.name)) {
          const matColDef = this.viewColumnDefs().find(
            (cd) => cd.name === colDef.name
          );
          const clientColDef = this.contentColumnDefs.find(
            (cd) => cd.name === colDef.name
          );
          const columnDef = clientColDef ? clientColDef : matColDef;
          if (columnDef) {
            columnDefs.push(columnDef);
            columnNames.add(colDef.name);
          }
        }
      });
      columnDefs.forEach((cd) => {
        matTable.addColumnDef(cd);
      });

      this.allColumnNames.set(Array.from(columnNames));
      // this.displayedColumns.set(Array.from(columnNames) as string[]);
    }
  }

  setupSort() {
    const matSort = this.sort();
    if (matSort) {
      this.dataSource().sort = matSort;
    }
  }

  infiniteScrollLoadNextPage(ev: any) {
    // console.log(`infiniteScrollLoadNextPage - ${JSON.stringify(ev)}`);
    if (this._paginator) {
      this.loadMoreEntities();
    }
  }

  loadMoreEntities(forceRefresh = false) {
    this.loadRequest$.next(this.createNextLoadRequest(forceRefresh));
  }

  /**
   * Creates a LoadRequest object for loading entities using the current state
   * of the component. Therefore, if the request is for next page of entities,
   * the LoadRequest object will have the updated page index. However, if
   * pagination has been reset (refer to refresh()), the LoadRequest object
   * will be for the first page of data. Note that when 'endpoint' value
   * changes, the component's pagination state is reset causing a refresh()
   * to be called, which in turn will create a new LoadRequest object for the
   * first page of data.
   * @returns LoadRequest object for the next load request.
   */
  private createNextLoadRequest(forceRefresh: boolean): LoadRequest {
    let pageParams = {};
    const parts = this.endpoint().split('?');
    const endpoint = parts[0];
    if (this._paginator) {
      pageParams = this._paginator.getRequestPageParams(
        endpoint,
        this.pageIndex(),
        this.pageSize()
      );
    }
    let httpParams = new HttpParams();
    for (const key in pageParams) {
      httpParams = httpParams.append(key, (pageParams as any)[key]);
    }
    if (parts.length > 1) {
      const embeddedParams = new HttpParams({ fromString: parts[1] });
      embeddedParams.keys().forEach((key) => {
        const value = embeddedParams.getAll(key);
        (value || []).forEach((v) => {
          httpParams = httpParams.append(key, v);
        });
      });
    }
    return new LoadRequest(
      endpoint,
      httpParams,
      forceRefresh || !!this.entityLoaderFn()
    );
  }

  /**
   * Does the actual load of entities from the remote or via calling the
   * entityLoaderFn. This method is the workhorse of the entity list
   * 'loader-loop'.
   * @param lr
   * @returns Observable that emits the response from the remote or from
   * entityLoaderFn().
   */
  private doActualLoad(lr: LoadRequest) {
    // console.log(`doActualLoad - endpoint: ${lr.endpoint}, params: ${lr.params.toString()}`);
    const loaderFn = this.entityLoaderFn();
    const params = lr.params;
    const obs =
      loaderFn !== undefined
        ? loaderFn({ params })
        : this.http.get<any>(this.getUrl(lr.endpoint), {
            context: this._httpReqContext(),
            params,
          });

    this.loading.set(true);
    return obs.pipe(
      tap((resp) => {
        // TODO: defer this to a pagination provider so that we can support
        // many types of pagination. DRF itself has different schemes. And
        // express may have yet another pagination protocol.
        this.firstLoadDone = true;
        if (this._paginator) {
          // Convert HttpParams to JS object
          const paramsObj: any = {};
          params.keys().forEach((key) => {
            paramsObj[key] = params.get(key);
          });
          const { entities, total } = this._paginator.parseRequestResponse(
            this.entityName(),
            this._entityNamePlural()!,
            this.endpoint(),
            paramsObj,
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
      finalize(() => this.loading.set(false))
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
    return this.entityListConfig?.urlResolver
      ? this.entityListConfig?.urlResolver(endpoint)
      : endpoint;
  }

  toggleActiveEntity(entity: TEntity | undefined) {
    if (entity) {
      if (entity === this.activeEntity()) {
        this.activeEntity.set(undefined);
      } else {
        this.activeEntity.set(entity);
      }
    } else {
      this.activeEntity.set(undefined);
    }
  }

  getColumnLabel(field: SPEntityField<TEntity, IdKey>): Observable<string> {
    if (field._fieldSpec.label) {
      return field._fieldSpec.label instanceof Observable
        ? field._fieldSpec.label
        : of(field._fieldSpec.label);
    }
    if (this.entityListConfig && this.entityListConfig.columnLabelFn) {
      const label = this.entityListConfig.columnLabelFn(
        this.entityName(),
        field._fieldSpec.name
      );
      return label instanceof Observable ? label : of(label);
    }
    return of(field._fieldSpec.name);
  }

  isAsync(val: any) {
    return val instanceof Observable;
  }
}
