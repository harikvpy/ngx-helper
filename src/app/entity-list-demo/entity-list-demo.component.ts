import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnInit, QueryList, signal, viewChild, ViewChild, ViewChildren } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatColumnDef, MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import {
  SPMatEntityListColumn,
  SPMatEntityListComponent,
  SPMatEntityListPaginator,
} from '@smallpearl/ngx-helper/mat-entity-list';

interface User {
  id: number;
  name: { title: string, first: string, last: string },
  gender: string;
  cell: string;
}

const USER_DATA: User[] = [
  { id: 1, name: { title: 'Ms', first: 'Mariam', last: 'Trevarthen' }, cell: '2323234', gender: 'F' },
  { id: 2, name: { title: 'Ms', first: 'Lanny', last: 'Nathanson' }, cell: '2323234', gender: 'F' },
  { id: 3, name: { title: 'Ms', first: 'Jaye', last: 'Nevin' }, cell: '2121234', gender: 'M' },
  { id: 4, name: { title: 'Ms', first: 'Cordelia', last: 'Blauser' }, cell: '2323234', gender: 'F' },
  { id: 5, name: { title: 'Ms', first: 'Talisha', last: 'Houk' }, cell: '2323234', gender: 'F' },
  { id: 6, name: { title: 'Ms', first: 'Kirsten', last: 'Jerkins' }, cell: '3333234', gender: 'F' },
  { id: 7, name: { title: 'Ms', first: 'Kandace', last: 'Oleary' }, cell: '2525234', gender: 'F' },
  { id: 8, name: { title: 'Ms', first: 'Tammara', last: 'Michell' }, cell: '2929234', gender: 'F' },
  { id: 9, name: { title: 'Ms', first: 'Lily', last: 'Rainwater' }, cell: '2121234', gender: 'F' },
  { id: 10, name: { title: 'Ms', first: 'Izola', last: 'Silversmith' }, cell: '4343234', gender: 'F' },
];

export interface PeriodicElement {
  name: string;
  position: number;
  weight: number;
  symbol: string;
}

const ELEMENT_DATA: PeriodicElement[] = [
  { position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H' },
  { position: 2, name: 'Helium', weight: 4.0026, symbol: 'He' },
  { position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li' },
  { position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be' },
  { position: 5, name: 'Boron', weight: 10.811, symbol: 'B' },
  { position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C' },
  { position: 7, name: 'Nitrogen', weight: 14.0067, symbol: 'N' },
  { position: 8, name: 'Oxygen', weight: 15.9994, symbol: 'O' },
  { position: 9, name: 'Fluorine', weight: 18.9984, symbol: 'F' },
  { position: 10, name: 'Neon', weight: 20.1797, symbol: 'Ne' },
];

class MyPaginator implements SPMatEntityListPaginator {
  getRequestPageParams(endpoint: string, pageIndex: number, pageSize: number) {
    return {
      page: pageIndex+1,  // account for 0-based index
      results: 20
    }
  }
  parseRequestResponse(endpoint: string, params: any, resp: any) {
    console.log(`parseRequestResponse - params: ${JSON.stringify(params)}`);
    return {
      total: 110,
      entities: resp['results']
    }
  }
}

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SPMatEntityListComponent,
    MatTableModule,
    MatSortModule,
    MatTabsModule,
  ],
  selector: 'app-entity-list-demo',
  template: `
  <div class="demo-wrapper">
    <h1>Entity List Demo</h1>
    <div class="demo-tabs">
      <mat-tab-group class="mh-100" #matTabGroup>
        <mat-tab label="Custom Column Def">
          <ng-container *ngTemplateOutlet="tableWithCustomColumnDef"></ng-container>
        </mat-tab>
        <mat-tab label="Hybrid ColumnDefs">
          <ng-template matTabContent>
            <div class="entities-list">
              <sp-mat-entity-list
                [endpoint]="endpoint"
                [columns]="hybridColumnDefs"
                [pageSize]="10"
                idKey="cell"
                pagination="discrete"
                [paginator]="paginator2"
                [infiniteScrollContainer]="entitiesScroller()"
                [disableSort]="true"
              >
              </sp-mat-entity-list>
            </div>
          </ng-template>
        </mat-tab>
        <mat-tab label="Without Sorting">
          <ng-template matTabContent>
            <div class="entities-list">
              <sp-mat-entity-list
                [endpoint]="endpoint"
                [columns]="homoColumnDefs"
                [pageSize]="10"
                idKey="cell"
                pagination="discrete"
                [paginator]="paginator2"
                [infiniteScrollContainer]="entitiesScroller()"
                [disableSort]="true"
              >
              </sp-mat-entity-list>
            </div>
          </ng-template>
        </mat-tab>
        <mat-tab label="Infinite Scroll">
        <ng-template matTabContent>
            <div class="entities-list" #entitiesList>
              <sp-mat-entity-list
                [endpoint]="endpoint"
                [columns]="homoColumnDefs"
                [pageSize]="10"
                idKey="cell"
                pagination="infinite"
                [paginator]="paginator2"
                [infiniteScrollContainer]="entitiesScroller()"
                [disableSort]="true"
              >
              </sp-mat-entity-list>
            </div>
          </ng-template>
        </mat-tab>
      </mat-tab-group>
    </div>
    <ng-template #tableWithCustomColumnDef>
      <div class="entities-list" #entitiesList>
        <sp-mat-entity-list
          [endpoint]="endpoint"
          [columns]="homoColumnDefs"
          [pageSize]="20"
          idKey="cell"
          pagination="discrete"
          [paginator]="paginator"
          matSort
          [sorter]="matSort()"
        >

          <ng-container matColumnDef="name">
            <th mat-header-cell mat-sort-header *matHeaderCellDef>NAME</th>
            <td mat-cell *matCellDef="let element">
              {{element.name.title}}. {{element.name.first}} {{element.name.last}}
            </td>
          </ng-container>

        </sp-mat-entity-list>
      </div>
    </ng-template>

    <ng-template #tableWithoutSorting>
      <div class="entities-list" #entitiesList>
        <sp-mat-entity-list
          [endpoint]="endpoint"
          [columns]="homoColumnDefs"
          [pageSize]="10"
          idKey="cell"
          pagination="discrete"
          [paginator]="paginator2"
          [infiniteScrollContainer]="entitiesScroller()"
          [disableSort]="true"
        >
        </sp-mat-entity-list>
      </div>
    </ng-template>

  </div>
  `,
  styles: [`
  .demo-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }
  .demo-tabs {
    flex-grow: 1;
    overflow: hidden;
  }
  .mh-100 {
    max-height: 100%;
  }
  `]
})
export class EntityListDemoComponent implements OnInit, AfterViewInit {

  endpoint = 'https://randomuser.me/api/?nat=us,gb';
  homoColumnDefs: SPMatEntityListColumn<User>[] = [
    { name: 'name', label: 'NAME', valueFn: (user: User) => user.name.first + ' ' + user.name.last },
    { name: 'gender', label: 'GENDER' },
    { name: 'cell', label: 'CELL' },
  ];
  hybridColumnDefs = [
    { name: 'name', label: 'NAME', valueFn: (user: User) => user.name.first + ' ' + user.name.last },
    'gender',
    'cell',
    'email',
    'phone'
  ];
  paginator = new MyPaginator();
  paginator2 = new MyPaginator();

  displayedColumns = signal<string[]>([]);
  dataSource = signal<MatTableDataSource<PeriodicElement>>(new MatTableDataSource<PeriodicElement>([]));

  @ViewChild(MatTable, { static: false }) table!: MatTable<PeriodicElement>;
  matSort = viewChild(MatSort);

  // These are our own <ng-container matColumnDef></ng-container>
  // which we create for each column that we create by the declaration:
  // <ng-container *ngFor="let column of columns()" [matColumnDef]="column.name">
  @ViewChildren(MatColumnDef) viewColumnDefs!: QueryList<MatColumnDef>;

  spEntitiesList = viewChild(SPMatEntityListComponent<User, 'cell'>);
  entitiesListScroller = viewChild<ElementRef>('matTabGroup');

  entitiesScroller = signal<HTMLElement|undefined>(undefined);

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {}

  ngAfterViewInit(): void {
    setTimeout(() => this.buildColumns(), 100);
    if (this.entitiesListScroller()) {
      this.entitiesScroller.set((this.entitiesListScroller() as any)?._elementRef.nativeElement);
    }
    if (this.spEntitiesList()) {
      const dataSource = this.spEntitiesList()?.dataSource();
      if (dataSource) {
        dataSource.sortingDataAccessor = (data: User, sortHeaderId: string): string | number => {
          if (sortHeaderId === 'name') {
            return data.name.title + data.name.first + data.name.last;
          }
          return (data as any)[sortHeaderId];
        };
      }
    }
  }

  /**
   * Build the effective columns by parsing our own <ng-container matColumnDef>
   * statements for each column in columns() property and client's
   * <ng-container matColumnDef> provided via content projection.
   */
  private buildColumns() {
    if (this.table) {
      const columns = ['position', 'weight', 'name', 'symbol'];
      const columnNames = new Set();
      const columnDefs: MatColumnDef[] = [];

      columns.forEach((name) => {
        const matColDef = this.viewColumnDefs.find((cd) => cd.name === name);
        if (matColDef) {
          columnDefs.push(matColDef);
          columnNames.add(name);
        }
      });
      // this.effectiveColumnDefs.set(columnDefs);
      columnDefs.forEach((cd) => {
        this.table.addColumnDef(cd);
      });

      // if (this.itemActions.length) {
      //   columnNames.add(this.itemActionsColumnDef.name);
      //   this.table.addColumnDef(this.itemActionsColumnDef);
      // }

      this.displayedColumns.set(Array.from(columnNames) as string[]);
      this.dataSource().data = ELEMENT_DATA;
      // this.cdr.detectChanges();
      // this.getMoreEntities(this.endpoint(), {});
    }
  }
}
