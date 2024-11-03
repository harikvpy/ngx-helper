import { CommonModule } from '@angular/common';
import { Component, ComponentRef, OnInit, signal, viewChild } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import {
  SPMatEntityListColumn,
  SPMatEntityListComponent,
  SPMatEntityListPaginator,
} from '@smallpearl/ngx-helper/mat-entity-list';
import { SPMatEntityCrudComponent } from './mat-entity-crud.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { ActivatedRoute, provideRouter } from '@angular/router';

interface User {
  name: { title: string; first: string; last: string };
  gender: string;
  cell: string;
}

const USER_DATA: User[] = [
  {
    name: { title: 'Ms', first: 'Mariam', last: 'Trevarthen' },
    cell: '12323234',
    gender: 'F',
  },
  {
    name: { title: 'Ms', first: 'Lanny', last: 'Nathanson' },
    cell: '22323234',
    gender: 'F',
  },
  {
    name: { title: 'Ms', first: 'Jaye', last: 'Nevin' },
    cell: '32121234',
    gender: 'M',
  },
  {
    name: { title: 'Ms', first: 'Cordelia', last: 'Blauser' },
    cell: '42323234',
    gender: 'F',
  },
  {
    name: { title: 'Ms', first: 'Talisha', last: 'Houk' },
    cell: '52323234',
    gender: 'F',
  },
  {
    name: { title: 'Ms', first: 'Kirsten', last: 'Jerkins' },
    cell: '63333234',
    gender: 'F',
  },
  {
    name: { title: 'Ms', first: 'Kandace', last: 'Oleary' },
    cell: '72525234',
    gender: 'F',
  },
  {
    name: { title: 'Ms', first: 'Tammara', last: 'Michell' },
    cell: '82929234',
    gender: 'F',
  },
  {
    name: { title: 'Ms', first: 'Lily', last: 'Rainwater' },
    cell: '92121234',
    gender: 'F',
  },
  {
    name: { title: 'Ms', first: 'Izola', last: 'Silversmith' },
    cell: '99343234',
    gender: 'F',
  },
];

type UserEntityCrudComponent = SPMatEntityCrudComponent<User, 'cell'>;
type UserEntityListComponent = SPMatEntityListComponent<User, 'cell'>;

/**
 * A client component that we'll host the SPMatEntityCrudComponent. We can use
 * this to test SPMatEntityCrudComponent
 */
@Component({
  standalone: true,
  imports: [CommonModule, MatTableModule, SPMatEntityCrudComponent],
  template: `
    <div>
      <sp-mat-entity-crud
        [endpoint]="endpoint"
        [columns]="spEntityListColumns"
        idKey="cell"
      >
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Name</th>
          <td mat-cell *matCellDef="let element">
            {{ element.name.title }}. {{ element.name.first }}
            {{ element.name.last }}
          </td>
        </ng-container>
      </sp-mat-entity-crud>
    </div>
  `,
})
class SPMatEntityCrudTestComponent implements OnInit {
  displayedColumns = signal<string[]>([]);
  endpoint = 'https://randomuser.me/api/?results=100&nat=us,dk,fr,gb';
  columns: SPMatEntityListColumn<User, 'cell'>[] = [
    {
      name: 'name',
      valueFn: (user: User) => user.name.first + ' ' + user.name.last,
    },
    { name: 'gender' },
    { name: 'cell' },
  ];

  spEntityCrudComponent = viewChild(SPMatEntityCrudComponent<User, 'cell'>);

  ngOnInit(): void {}
}

/**
 * Paginator handles DRF's default pagination class response of the format:
      total: number
      next: string,
      previous: string,
      results: TEntity[]
 */
class DRFPaginator implements SPMatEntityListPaginator {
  getRequestPageParams(endpoint: string, pageIndex: number, pageSize: number) {
    return {
      page: pageIndex + 1, // account for 0-based index
      results: pageSize,
    };
  }
  parseRequestResponse(endpoint: string, params: any, resp: any) {
    console.log(`parseRequestResponse - params: ${JSON.stringify(params)}`);
    return {
      total: resp['total'],
      entities: resp['results'],
    };
  }
}

describe('SPMatEntityCrudComponent', () => {
  let testComponent!: SPMatEntityCrudTestComponent;
  let testComponentFixture!: ComponentFixture<SPMatEntityCrudTestComponent>;
  let testComponentRef!: ComponentRef<SPMatEntityCrudTestComponent>;
  let fixture!: ComponentFixture<UserEntityCrudComponent>;
  let component!: UserEntityCrudComponent;
  let componentRef!: ComponentRef<UserEntityCrudComponent>;

  const createTestComponent = async () => {
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, SPMatEntityCrudTestComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    testComponentFixture = TestBed.createComponent(
      SPMatEntityCrudTestComponent
    );
    testComponentRef = testComponentFixture.componentRef;
    testComponent = testComponentFixture.componentInstance;
    component = (testComponent.spEntityCrudComponent as any) as UserEntityCrudComponent;
  }

  const createComponent = async () => {
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, SPMatEntityListComponent, SPMatEntityCrudTestComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {params: {id: 100}}
          }
        }
      ],
    });
    fixture = TestBed.createComponent(SPMatEntityCrudComponent<User, 'cell'>);
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
      imports: [NoopAnimationsModule, SPMatEntityListComponent, SPMatEntityCrudTestComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {params: {id: '100'}}
          }
        }
      ],
    });
    fixture = TestBed.createComponent(SPMatEntityCrudComponent<User, 'cell'>);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    componentRef.setInput('itemLabel', 'User');
    componentRef.setInput('itemsLabel', 'Users');
    componentRef.setInput('columns', [
      { name: 'name', valueFn: (user: User) => user.name.first + ' ' + user.name.last },
      { name: 'gender' },
      { name: 'cell' },
    ]);
  });

  it("should create", async () => {
    componentRef.setInput('columns', [
      { name: 'name', valueFn: (user: User) => user.name.first + ' ' + user.name.last },
      'gender', 'cell'
    ]);
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

});
