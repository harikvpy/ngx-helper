import { CommonModule } from '@angular/common';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, ComponentRef, OnInit, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatTableModule } from '@angular/material/table';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { SPMatEntityListColumn, SPMatEntityListConfig, SPMatEntityListPaginator } from './mat-entity-list-types';
import { SPMatEntityListComponent } from './mat-entity-list.component';
import { SP_MAT_ENTITY_LIST_CONFIG } from './providers';

interface User {
  name: { title: string, first: string, last: string },
  gender: string;
  cell: string;
}

const USER_DATA: User[] = [
  { name: { title: 'Ms', first: 'Mariam', last: 'Trevarthen' }, cell: '12323234', gender: 'F' },
  { name: { title: 'Ms', first: 'Lanny', last: 'Nathanson' }, cell: '22323234', gender: 'F' },
  { name: { title: 'Ms', first: 'Jaye', last: 'Nevin' }, cell: '32121234', gender: 'M' },
  { name: { title: 'Ms', first: 'Cordelia', last: 'Blauser' }, cell: '42323234', gender: 'F' },
  { name: { title: 'Ms', first: 'Talisha', last: 'Houk' }, cell: '52323234', gender: 'F' },
  { name: { title: 'Ms', first: 'Kirsten', last: 'Jerkins' }, cell: '63333234', gender: 'F' },
  { name: { title: 'Ms', first: 'Kandace', last: 'Oleary' }, cell: '72525234', gender: 'F' },
  { name: { title: 'Ms', first: 'Tammara', last: 'Michell' }, cell: '82929234', gender: 'F' },
  { name: { title: 'Ms', first: 'Lily', last: 'Rainwater' }, cell: '92121234', gender: 'F' },
  { name: { title: 'Ms', first: 'Izola', last: 'Silversmith' }, cell: '99343234', gender: 'F' },
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

/**
 * Paginator handles DRF's default pagination class response of the format:
      total: number
      next: string,
      previous: string,
      results: TEntity[]
 */
class DRFPaginator implements SPMatEntityListPaginator {
  total = 0;
  pageIndex = 0;
  getEntityCount() {
    return this.total;
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
    this.total = resp['total'];
    return resp['results'];
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

  it('should create and load data without paginator', async () => {
    componentRef.setInput('endpoint', 'https://randomuser.me/api/?results=100&nat=us,dk,fr,gb');
    componentRef.setInput('idKey', 'cell');
    const http = TestBed.inject(HttpClient);
    spyOn(http, 'get').and.returnValue(of(USER_DATA));
    fixture.autoDetectChanges();
    expect(component).toBeTruthy();
    const rows = fixture.debugElement.nativeElement.querySelectorAll('tr');
    // +1 for the <tr> in <thead>
    expect(rows.length).toEqual(USER_DATA.length+1);
    const paginator = fixture.debugElement.nativeElement.querySelector('mat-paginator');
    expect(paginator).toBeFalsy();
  });

  it('should show pagination control for pagination="discrete"', async () => {
    componentRef.setInput('endpoint', 'https://randomuser.me/api/?results=100&nat=us,dk,fr,gb');
    componentRef.setInput('idKey', 'cell');
    const myPaginator = new DRFPaginator()
    componentRef.setInput('paginator', myPaginator);
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

  it('should *NOT* show pagination control for pagination="infinite"', async () => {
    componentRef.setInput('endpoint', 'https://randomuser.me/api/?results=100&nat=us,dk,fr,gb');
    componentRef.setInput('idKey', 'cell');
    const myPaginator = new DRFPaginator()
    componentRef.setInput('paginator', myPaginator);
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

  /**
   * Test that the global config object is used. These include the following
   * config properties:-
   *
   *    urlResolver
   *    paginator
   *    i18nTranslate
   */
  it('should use global config object', async () => {
    TestBed.resetTestingModule();
    const myPaginator = new DRFPaginator()
    class EntityListConfig implements SPMatEntityListConfig {
      urlResolver = (endpoint: string) => endpoint;
      paginator = myPaginator
      i18nTranslate = (label: string, context?: any) => {
        return label;
      }
    };
    let globalPaginatorGetEntitiesFromResponseCalled = false;
    spyOn(myPaginator, 'getEntitiesFromResponse').and.callFake((resp: any) => {
      globalPaginatorGetEntitiesFromResponseCalled = true;
      return resp['results'];
    });
    const entityListConfig = new EntityListConfig();
    let globalUrlResolverCalled = false;
    spyOn(entityListConfig, 'urlResolver').and.callFake((endpoint: string) => {
      globalUrlResolverCalled = true;
      return endpoint;
    });
    let globali18nTranslateCalled = false;
    spyOn(entityListConfig, 'i18nTranslate').and.callFake((label: string, context?: any) => {
      globali18nTranslateCalled = true;
      return label;
    });
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, SPMatEntityListComponent, SPMatEntityListTestComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SP_MAT_ENTITY_LIST_CONFIG, useValue: entityListConfig }
      ],
    });
    fixture = TestBed.createComponent(SPMatEntityListComponent<User, 'cell'>);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    componentRef.setInput('columns', [
      { name: 'name', valueFn: (user: User) => user.name.first + ' ' + user.name.last },
      { name: 'gender' },
      { name: 'cell' },
    ]);
    componentRef.setInput('endpoint', 'https://randomuser.me/api/?results=100&nat=us,dk,fr,gb');
    componentRef.setInput('idKey', 'cell');
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
    const rows = fixture.debugElement.nativeElement.querySelectorAll('tr');
    // +1 for the <tr> in <thead>
    expect(rows.length).toEqual(USER_DATA.length+1);
    // Verify that global paginator's 'getEntitiesFromResponse' was called.
    expect(globalPaginatorGetEntitiesFromResponseCalled).toBeTrue();
    expect(globalUrlResolverCalled).toBeTrue();
    expect(globali18nTranslateCalled).toBeTrue();
  });
});
