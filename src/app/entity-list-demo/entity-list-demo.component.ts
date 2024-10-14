import { DataSource } from '@angular/cdk/collections';
import { CommonModule } from '@angular/common';
import { HttpParams } from '@angular/common/http';
import { AfterViewInit, ChangeDetectorRef, Component, OnInit, QueryList, signal, ViewChild, ViewChildren } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSortModule } from '@angular/material/sort';
import { MatColumnDef, MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import {
  SPMatEntityListPaginator,
  SPMatEntityListColumn,
  SPMatEntityListComponent,
} from '@smallpearl/ngx-helper/mat-entity-list';
// import { SPMatEntityListColumn } from '@smallpearl/ngx-helper/mat-entity-list/src/mat-entity-list-types';
// import { SPMatEntityListPaginator } from 'dist/smallpearl/ngx-helper/mat-entity-list/src/mat-entity-list-types';

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
  pageIndex = 0;
  getEntityCount() {
    return 100;
  }
  getPageCount() {
    return Math.floor(this.getEntityCount()/this.getPageSize()) +
      (this.getEntityCount()%this.getPageSize() ? 1 : 0)
  }
  getPageIndex() {
    return this.pageIndex;
  }
  setPageIndex(pageIndex: number) { // index is 0-based
    this.pageIndex = pageIndex;
  }
  getPageSize() {
    return 10;
  }
  getPageParams() {
    return {
      page: this.getPageIndex()+1,  // account for 0-based index
      results: this.getPageSize()
    }
  }
  getEntitiesFromResponse(resp: any) {
    return resp['results'];
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
  ],
  selector: 'app-entity-list-demo',
  template: `
  <div class="demo-wrapper">
    <h1>Entity List Demo</h1>

    <sp-mat-entity-list
      [endpoint]="endpoint"
      [columns]="spEntityListColumns"
      idKey="cell"
      pagination="discrete"
      [paginator]="paginator"
    >

      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef>Name</th>
        <td mat-cell *matCellDef="let element">
          {{element.name.title}}. {{element.name.first}} {{element.name.last}}
        </td>
      </ng-container>

    </sp-mat-entity-list>


    <!-- <hr/>
    <div class="p-2">
      <table mat-table matSort [dataSource]="dataSource()" class="mat-elevation-z8">
        <tr mat-header-row *matHeaderRowDef="displayedColumns()"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns()"></tr>
      </table>
    </div>

    @for (column of columns; track $index) {
      <ng-container [matColumnDef]="column.name">
        <th mat-header-cell *matHeaderCellDef>{{ column.name | uppercase }}</th>
        <td mat-cell *matCellDef="let element">{{ element[column.name] }}</td>
      </ng-container>
    } -->
  </div>
  `,
  styles: [`
  .demo-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: scroll;
  }
  .p-2 {
    padding: 0.4em;
  }
  `]
})
export class EntityListDemoComponent implements OnInit, AfterViewInit {

  // columns = ['position', 'weight', 'name', 'symbol'];
  columns: SPMatEntityListColumn<User>[] = [
    { name: 'position' },
    { name: 'weight' },
    { name: 'name' },
    { name: 'symbol' },
  ];

  endpoint = 'https://randomuser.me/api/?nat=us,dk,fr,gb';
  spEntityListColumns: SPMatEntityListColumn<User>[] = [
    { name: 'name', valueFn: (user: User) => user.name.first + ' ' + user.name.last },
    { name: 'gender' },
    { name: 'cell' },
  ];
  paginator = new MyPaginator();

  displayedColumns = signal<string[]>([]);
  dataSource = signal<MatTableDataSource<PeriodicElement>>(new MatTableDataSource<PeriodicElement>([]));

  @ViewChild(MatTable, { static: false }) table!: MatTable<PeriodicElement>;
  // These are our own <ng-container matColumnDef></ng-container>
  // which we create for each column that we create by the declaration:
  // <ng-container *ngFor="let column of columns()" [matColumnDef]="column.name">
  @ViewChildren(MatColumnDef) viewColumnDefs!: QueryList<MatColumnDef>;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {}

  ngAfterViewInit(): void {
    setTimeout(() => this.buildColumns(), 100);
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
