import { CommonModule } from '@angular/common';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, ComponentRef, OnInit, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatColumnDef, MatTable, MatTableModule } from '@angular/material/table';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { SPMatEntityListColumn } from './mat-entity-list-types';
import { SPMatEntityListComponent } from './mat-entity-list.component';
import { By } from '@angular/platform-browser';

interface User {
  name: { title: string, first: string, last: string },
  gender: string;
  cell: string;
}

const USER_DATA: User[] = [
  { name: { title: 'Ms', first: 'Mariam', last: 'Trevarthen' }, cell: '2323234', gender: 'F' },
  { name: { title: 'Ms', first: 'Lanny', last: 'Nathanson' }, cell: '2323234', gender: 'F' },
  { name: { title: 'Ms', first: 'Jaye', last: 'Nevin' }, cell: '2121234', gender: 'M' },
  { name: { title: 'Ms', first: 'Cordelia', last: 'Blauser' }, cell: '2323234', gender: 'F' },
  { name: { title: 'Ms', first: 'Talisha', last: 'Houk' }, cell: '2323234', gender: 'F' },
  { name: { title: 'Ms', first: 'Kirsten', last: 'Jerkins' }, cell: '3333234', gender: 'F' },
  { name: { title: 'Ms', first: 'Kandace', last: 'Oleary' }, cell: '2525234', gender: 'F' },
  { name: { title: 'Ms', first: 'Tammara', last: 'Michell' }, cell: '2929234', gender: 'F' },
  { name: { title: 'Ms', first: 'Lily', last: 'Rainwater' }, cell: '2121234', gender: 'F' },
  { name: { title: 'Ms', first: 'Izola', last: 'Silversmith' }, cell: '4343234', gender: 'F' },
];

type UserEntityListComponent = SPMatEntityListComponent<User, 'cell'>;

/**
 * A client component that we'll host the SPMatEntityListComponent. We can use
 * this to test SPMatEntityListComponent
 */
@Component({
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    SPMatEntityListComponent
  ],
  template: `
    <div>
    <sp-mat-entity-list
      [endpoint]="endpoint"
      [columns]="spEntityListColumns"
      idKey="cell">

      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef>Name</th>
        <td mat-cell *matCellDef="let element">
          {{element.name.title}}. {{element.name.first}} {{element.name.last}}
        </td>
      </ng-container>

      </sp-mat-entity-list>

    </div>
  `
})
class SPMatEntityListTestComponent implements OnInit {

  displayedColumns = signal<string[]>([]);
  endpoint = 'https://randomuser.me/api/?results=100&nat=us,dk,fr,gb';
  columns: SPMatEntityListColumn<User, 'cell'>[] = [
    { name: 'name', valueFn: (user: User) => user.name.first + ' ' + user.name.last },
    { name: 'gender' },
    { name: 'cell' },
  ];

  spEntityListComponent = viewChild(SPMatEntityListComponent<User, 'cell'>);

  ngOnInit(): void {

  }
}

fdescribe('SPMatEntityListComponent', () => {
  let testComponent!: SPMatEntityListTestComponent;
  let testComponentFixture!: ComponentFixture<SPMatEntityListTestComponent>;
  let testComponentRef!: ComponentRef<SPMatEntityListTestComponent>;
  let fixture!: ComponentFixture<UserEntityListComponent>;
  let component!: UserEntityListComponent;
  let componentRef!: ComponentRef<UserEntityListComponent>;

  const createTestComponent = async () => {
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, SPMatEntityListTestComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    testComponentFixture = TestBed.createComponent(
      SPMatEntityListTestComponent
    );
    testComponentRef = testComponentFixture.componentRef;
    testComponent = testComponentFixture.componentInstance;
    component = (testComponent.spEntityListComponent as any) as UserEntityListComponent;
  }

  const createComponent = async () => {
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, SPMatEntityListComponent, SPMatEntityListTestComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    fixture = TestBed.createComponent(SPMatEntityListComponent<User, 'cell'>);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    componentRef.setInput('columns', [
      { name: 'name', valueFn: (user: User) => user.name.first + ' ' + user.name.last },
      { name: 'gender' },
      { name: 'cell' },
    ]);
    componentRef.setInput('endpoint', 'https://abc.efg.com');
    const http = TestBed.inject(HttpClient);
    spyOn(http, 'get').and.returnValue(of(USER_DATA));
    fixture.autoDetectChanges();
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, SPMatEntityListComponent, SPMatEntityListTestComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    fixture = TestBed.createComponent(SPMatEntityListComponent<User, 'cell'>);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    componentRef.setInput('columns', [
      { name: 'name', valueFn: (user: User) => user.name.first + ' ' + user.name.last },
      { name: 'gender' },
      { name: 'cell' },
    ]);
  });

  it('should create and load data', async () => {
    componentRef.setInput('endpoint', 'https://randomuser.me/api/?results=100&nat=us,dk,fr,gb');
    const http = TestBed.inject(HttpClient);
    spyOn(http, 'get').and.returnValue(of(USER_DATA));
    fixture.autoDetectChanges();
    expect(component).toBeTruthy();
    const rows = fixture.debugElement.nativeElement.querySelectorAll('tr');
    // +1 for the <tr> in <thead>
    expect(rows.length).toEqual(USER_DATA.length+1);
  });

  fit('should show pagination control for pagination="discrete"', async () => {
    componentRef.setInput('endpoint', 'https://randomuser.me/api/?results=100&nat=us,dk,fr,gb');
    componentRef.setInput('pagination', 'discrete')
    const http = TestBed.inject(HttpClient);
    spyOn(http, 'get').and.returnValue(of(
      {
        total: USER_DATA.length,
        next: null,
        previous: null,
        results: USER_DATA
      }
    ));
    fixture.autoDetectChanges();
    expect(component).toBeTruthy();
    const paginator = fixture.debugElement.nativeElement.querySelector('mat-paginator');
    expect(paginator).toBeTruthy();
  });

  fit('should *NOT* show pagination control for pagination="infinite"', async () => {
    componentRef.setInput('endpoint', 'https://randomuser.me/api/?results=100&nat=us,dk,fr,gb');
    componentRef.setInput('pagination', 'infinite')
    const http = TestBed.inject(HttpClient);
    spyOn(http, 'get').and.returnValue(of(
      {
        total: USER_DATA.length,
        next: null,
        previous: null,
        results: USER_DATA
      }
    ));
    fixture.autoDetectChanges();
    expect(component).toBeTruthy();
    const paginator = fixture.debugElement.nativeElement.querySelector('mat-paginator');
    expect(paginator).toBeFalsy();
  });

  it('should retrieve paginated data', async () => {
    componentRef.setInput('endpoint', 'https://randomuser.me/api/?results=100&nat=us,dk,fr,gb');
    const http = TestBed.inject(HttpClient);
    spyOn(http, 'get').and.returnValue(of(
      {
        total: USER_DATA.length,
        next: null,
        previous: null,
        results: USER_DATA
      }
    ));
    fixture.autoDetectChanges();
    expect(component).toBeTruthy();
    const rows = fixture.debugElement.nativeElement.querySelectorAll('tr');
    // +1 for the <tr> in <thead>
    expect(rows.length).toEqual(USER_DATA.length+1);
  });
});
