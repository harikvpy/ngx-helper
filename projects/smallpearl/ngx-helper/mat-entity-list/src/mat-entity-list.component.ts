import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  contentChildren,
  Inject,
  input,
  OnDestroy,
  OnInit,
  Optional,
  signal,
  viewChild,
  viewChildren
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSortModule } from '@angular/material/sort';
import {
  MatColumnDef,
  MatTable,
  MatTableDataSource,
  MatTableModule,
} from '@angular/material/table';
import { createStore } from '@ngneat/elf';
import { selectAllEntities, upsertEntities, withEntities } from '@ngneat/elf-entities';
import { spFormatDate } from '@smallpearl/ngx-helper/locale';
import { InfiniteScrollDirective } from 'ngx-infinite-scroll';
import { finalize, Observable, Subject, takeUntil, tap } from 'rxjs';
import { DefaultSPMatEntityListConfig } from './config';
import { SPMatEntityListColumn, SPMatEntityListConfig, SPMatEntityListEntityLoaderFn, SPMatEntityListPaginator } from './mat-entity-list-types';
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
      [infiniteScrollDisabled]="pagination() !== 'infinite' || !_paginator || !hasMore()"
      (scrolled)="infiniteScrollLoadNextPage($event)"
      >
        <div class="busy-overlay" [ngClass]="{'show': pagination() === 'discrete' && loading()}">
          <ng-container *ngTemplateOutlet="busySpinner"></ng-container>
        </div>
        <table mat-table matSort [dataSource]="dataSource()">
          <tr mat-header-row *matHeaderRowDef="displayedColumns()"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns()"></tr>
        </table>
        @if (pagination() == 'discrete' && _paginator) {
          <mat-paginator
            showFirstLastButtons
            [length]="_paginator.getEntityCount()"
            [pageSize]="_paginator.getPageSize()"
            [pageIndex]="_paginator.getPageIndex()"
            [pageSizeOptions]="[]"
            [hidePageSize]="true"
            (page)="handlePageEvent($event)"
            [disabled]="loading()"
            aria-label="Select page"
          ></mat-paginator>
        }
        <div class="infinite-scroll-loading" [ngClass]="{'show': pagination() === 'infinite' && loading()}">
          <ng-container *ngTemplateOutlet="busySpinner"></ng-container>
        </div>
      </div>
    <!-- We keep the column definitions outside the <table> so that they can
    be dynamically added to the MatTable. -->
    @for (column of columns(); track $index) {
    <ng-container [matColumnDef]="column.name">
      <th mat-header-cell *matHeaderCellDef>
        {{ column?.label || column.name }}
      </th>
      <td mat-cell *matCellDef="let element">
        {{ getColumnValue(element, column) }}
      </td>
    </ng-container>
    }
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
  entityLoaderFn = input<SPMatEntityListEntityLoaderFn|undefined>(undefined);
  /**
   * The columns of the entity to be displayed.
   */
  columns = input.required<SPMatEntityListColumn<TEntity, IdKey>[]>();
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
  // These are our own <ng-container matColumnDef></ng-container>
  // which we create for each column that we create by the declaration:
  // <ng-container *ngFor="let column of columns()" [matColumnDef]="column.name">
  viewColumnDefs = viewChildren(MatColumnDef);
  // These are the <ng-container matColumnDef></ng-container> placed
  // inside <sp-mat-entity-list></<sp-mat-entity-list> by the client to override
  // the default <ng-container matColumnDef> created by the component.
  clientColumnDefs = contentChildren(MatColumnDef);

  destroy$ = new Subject<void>();

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

  constructor(
    private http: HttpClient,
    @Optional()
    @Inject(SP_MAT_ENTITY_LIST_CONFIG)
    private config: SPMatEntityListConfig,
    private cdr: ChangeDetectorRef
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
  }

  ngOnDestroy(): void {
    this.destroy$.next();
  }

  ngAfterViewInit(): void {
    this.buildColumns();
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

  /**
   * Build the effective columns by parsing our own <ng-container matColumnDef>
   * statements for each column in columns() property and client's
   * <ng-container matColumnDef> provided via content projection.
   */
  private buildColumns() {
    if (this.table()) {
      const columnNames = new Set();
      const columnDefs: MatColumnDef[] = [];

      this.columns().forEach((colDef) => {
        const matColDef = this.viewColumnDefs().find(
          (cd) => cd.name === colDef.name
        );
        const clientColDef = this.clientColumnDefs().find(
          (cd) => cd.name === colDef.name
        );
        if (clientColDef) {
          columnDefs.push(clientColDef);
          columnNames.add(colDef.name);
        } else if (matColDef) {
          columnDefs.push(matColDef);
          columnNames.add(colDef.name);
        }
      });
      columnDefs.forEach((cd) => {
        this.table()!.addColumnDef(cd);
      });

      this.displayedColumns.set(Array.from(columnNames) as string[]);
      this.loadEntities(this.endpoint(), this._paginator?.getPageParams());
    }
  }

  infiniteScrollLoadNextPage(ev: any) {
    // console.log(`infiniteScrollLoadNextPage - ${JSON.stringify(ev)}`);
    if (this._paginator) {
      this._paginator.setPageIndex(this._paginator.getPageIndex()+1)
      this.loadEntities(this.endpoint(), this._paginator.getPageParams());
    }
  }

  private loadEntities(url: string, params: any) {
    // Inline check for input signal value before calling its value doesn't
    // seem to work as of now. So we assign the value to a const and check
    // it for undefined before calling it.
    const loaderFn = this.entityLoaderFn();
    const obs = loaderFn !== undefined
      ? loaderFn(params)
      : this.http.get<any>(url, { params });

    this.loading.set(true);
    obs
      .pipe(
        tap((entities) => {
          // TODO: defer this to a pagination provider so that we can support
          // many types of pagination. DRF itself has different schemes. And
          // express may have yet another pagination protocol.
          if (this._paginator) {
            entities = this._paginator.getEntitiesFromResponse(entities);
            if (this.pagination() === 'discrete') {
              this.store.reset();
            } else if (this.pagination() === 'infinite') {
              this.hasMore.set(this._paginator?.getPageIndex()+1 === this._paginator?.getPageCount())
            }
          } else {
            entities = this.findArrayInResult(entities) as TEntity[];
          }
          // store the entities in the store
          this.store.update(upsertEntities(entities));
        }),
        finalize(() => {
          this.loading.set(false);
        })
      )
      .subscribe();
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
    this._paginator?.setPageIndex(e.pageIndex);
    this.loadEntities(this.endpoint(), this._paginator?.getPageParams());
  }
}
