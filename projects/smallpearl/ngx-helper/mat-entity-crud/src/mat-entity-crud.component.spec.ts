import { CommonModule } from '@angular/common';
import { HttpClient, HttpContext, HttpContextToken, HttpParams, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import {
  Component,
  ComponentRef,
  computed,
  input,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { getEntitiesCount } from '@ngneat/elf-entities';
import { SPEntityFieldSpec } from '@smallpearl/ngx-helper/entity-field';
import {
  SPMatEntityListComponent,
  SPMatEntityListPaginator,
} from '@smallpearl/ngx-helper/mat-entity-list';
import { getTranslocoModule } from '@smallpearl/ngx-helper/src/transloco-testing.module';
import { firstValueFrom, of, tap } from 'rxjs';
import { SPMatEntityCrudFormBase } from './mat-entity-crud-form-base';
import { MatEntityCrudItemAction } from './mat-entity-crud-item-action';
import {
  NewItemSubType,
  SP_MAT_ENTITY_CRUD_HTTP_CONTEXT,
  SPMatEntityCrudCreateEditBridge,
  SPMatEntityCrudHttpContext,
} from './mat-entity-crud-types';
import { SPMatEntityCrudComponent } from './mat-entity-crud.component';
import { SPMatEntityCrudPreviewPaneComponent } from './preview-pane.component';

interface User {
  name: { title: string; first: string; last: string };
  gender: string;
  cell: string;
}

const MOCK_USER: User = {
  name: { title: '', first: '', last: '' },
  gender: '',
  cell: '',
};

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

const USER_COLUMNS: SPEntityFieldSpec<User, 'cell'>[] = [
  {
    name: 'name',
    valueFn: (user: User) => user.name.first + ' ' + user.name.last,
  },
  { name: 'gender' },
  { name: 'cell' },
  // { name: 'action', label: 'ACTION' },
];


type UserForm = FormGroup<{
  first: FormControl<string>;
  last: FormControl<string>;
  gender: FormControl<string>;
  cell: FormControl<string>;
}>;

type UserEntityCrudComponent = SPMatEntityCrudComponent<User, 'cell'>;

@Component({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
  ],
  selector: 'create-edit-user-form',
  template: `
    @if (loadEntity$ | async) {
    <h1>ENTITY LOADED!</h1>
    <form
      [formGroup]="form()"
      (ngSubmit)="onSubmit()"
      class="d-flex flex-column align-items-start"
    >
      <div class="d-flex flex-row gap-1">
        <mat-form-field>
          <mat-label>Firstname</mat-label>
          <input matInput formControlName="first" />
        </mat-form-field>
        <mat-form-field>
          <mat-label>Lastname</mat-label>
          <input matInput formControlName="last" />
        </mat-form-field>
      </div>
      <mat-form-field>
        <mat-label>Gender</mat-label>
        <mat-select formControlName="gender">
          <mat-option value="male">Male</mat-option>
          <mat-option value="female">Female</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field>
        <mat-label>Cell</mat-label>
        <input matInput formControlName="cell" />
      </mat-form-field>

      <div class="mt-2 d-flex gap-2">
        <button
          type="button"
          color="secondary"
          mat-raised-button
          (click)="onReset()"
        >
          Reset
        </button>
        <button
          type="submit"
          color="primary"
          mat-raised-button
          [disabled]="form().invalid"
        >
          Save
        </button>
      </div>
    </form>
    } @else {
    <div>Loading...</div>
    }
  `,
})
export class CreateEditUserComponent extends SPMatEntityCrudFormBase<
  UserForm,
  User,
  'cell'
> {
  creating = computed(() => !this.entity() || !(this.entity() as User)?.cell);

  createForm(entity?: User): UserForm {
    return new FormGroup({
      first: new FormControl(entity ? entity.name.first : '', {
        nonNullable: true,
        validators: Validators.required,
      }),
      last: new FormControl(entity ? entity.name.last : '', {
        nonNullable: true,
        validators: Validators.required,
      }),
      gender: new FormControl(entity ? entity.gender : '', {
        nonNullable: true,
        validators: Validators.required,
      }),
      cell: new FormControl(entity ? entity.cell : '', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(8)],
      }),
    }) as UserForm;
  }

  override getFormValue() {
    const formValue: any = this.form().value;
    formValue['name'] = {
      title: '',
      first: formValue.first,
      last: formValue.last,
    };
    return formValue;
  }
}

/**
 * A client component that we'll host the SPMatEntityCrudComponent. We can use
 * this to test SPMatEntityCrudComponent
 */
@Component({
  imports: [
    CommonModule,
    MatTableModule,
    SPMatEntityCrudComponent,
    CreateEditUserComponent,
    SPMatEntityCrudPreviewPaneComponent,
  ],
  template: `
    <div>
      <sp-mat-entity-crud
        entityName="user"
        itemLabel="User"
        itemLabelPlural="Users"
        [endpoint]="endpoint"
        [columns]="columns"
        [newItemSubTypes]="newSubTypes()"
        [itemActions]="itemActions"
        idKey="cell"
        [createEditFormTemplate]="createEdit"
        [previewTemplate]="userPreview"
        listPaneWrapperClass="my-list-pane-wrapper-class"
        previewPaneWrapperClass="my-preview-pane-wrapper-class"
        previewPaneContentClass="my-preview-pane-content-class"
        [pageSize]="50"
        (action)="onAction($event)"
      >
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>FULL NAME</th>
          <td mat-cell *matCellDef="let element">
            {{ element.name.title }}. {{ element.name.first }}
            {{ element.name.last }}
          </td>
        </ng-container>
      </sp-mat-entity-crud>
    </div>

    <ng-template #createEdit let-data>
      <create-edit-user-form
        [bridge]="data.bridge"
        [entity]="data.entity"
      ></create-edit-user-form>
    </ng-template>

    <ng-template #userPreview let-data>
      <sp-mat-entity-crud-preview-pane
        [entity]="data.entity"
        [title]="data.entity.name.first + ' ' + data.entity.name.last"
        [entityCrudComponent]="spEntityCrudComponent()!"
      >
        <div previewContent>
          <h1>{{ data.entity.name.first }} {{ data.entity.name.last }}</h1>
        </div>
      </sp-mat-entity-crud-preview-pane>
    </ng-template>
  `,
})
class SPMatEntityCrudTestComponent implements OnInit {
  displayedColumns = signal<string[]>([]);
  endpoint = 'https://randomuser.me/api/?results=100&nat=us,dk,fr,gb';
  columns = USER_COLUMNS;
  itemActions: MatEntityCrudItemAction<User, 'cell'>[] = [
    { label: 'Edit', role: '_update_' },
    {
      label: 'Delete',
      role: '_delete_',
      disable: (user: User) => user.cell.startsWith('('),
    },
    {
      label: 'Revoke Access',
      role: 'revoke_access',
      httpRequestParameters: {
        method: 'POST',
        urlPath: 'revoke_access/',
      },
    },
  ];
  newSubTypes = input<NewItemSubType[]>();

  spEntityCrudComponent = viewChild(SPMatEntityCrudComponent<User, 'cell'>);
  lastAction!: any;

  ngOnInit(): void {}

  onAction(action: { role: string; entity?: User }) {
    this.lastAction = action;
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
  let fixture!: ComponentFixture<UserEntityCrudComponent>;
  let component!: UserEntityCrudComponent;
  let componentRef!: ComponentRef<UserEntityCrudComponent>;

  async function createCrudComponent() {
    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        SPMatEntityListComponent,
        SPMatEntityCrudTestComponent,
        getTranslocoModule(),
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: { id: '100' } },
          },
        },
      ],
    });
    fixture = TestBed.createComponent(SPMatEntityCrudComponent<User, 'cell'>);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    componentRef.setInput('entityName', 'user');
    componentRef.setInput('itemLabel', 'User');
    componentRef.setInput('itemLabelPlural', 'Users');
    componentRef.setInput('columns', USER_COLUMNS);
  }

  beforeEach(async () => {
    await createCrudComponent();
  });

  const autoDetectChanges = async () => {
    fixture.autoDetectChanges();
    await new Promise((res) => setTimeout(res, 120)); // wait for the async data to be loaded
  };

  it('should create', fakeAsync(() => {
    // await createCrudComponent();
    componentRef.setInput('columns', [
      {
        name: 'name',
        valueFn: (user: User) => user.name.first + ' ' + user.name.last,
      },
      'gender',
      'cell',
    ]);
    componentRef.setInput(
      'endpoint',
      'https://randomuser.me/api/?results=100&nat=us,dk,fr,gb'
    );
    componentRef.setInput('idKey', 'cell');
    const http = TestBed.inject(HttpClient);
    componentRef.setInput('httpReqContext', ['cache', true]);
    let httpReqContextReceived = false;
    spyOn(http, 'get').and.callFake(((url: string, options: any) => {
      httpReqContextReceived = options.context.get('cache') === true;
      return of(USER_DATA);
    }) as any); // 'as any' to suppress TSC function prototype mismatch
    fixture.autoDetectChanges();
    tick(100);
    expect(component).toBeTruthy();
    const rows =
      fixture.debugElement.nativeElement.querySelectorAll('tbody tr');
    // +1 for the <tr> in <thead>
    expect(rows.length).toEqual(USER_DATA.length);
    const paginator =
      fixture.debugElement.nativeElement.querySelector('mat-paginator');
    expect(paginator).toBeFalsy();
    expect(httpReqContextReceived).toBeTrue();
    const columns = rows[0].querySelectorAll('td');
    // +1 for action column
    expect(columns.length).toEqual(USER_COLUMNS.length + 1);
    // check _endpointSansParams() returns URL without the QP
    expect(component._endpointSansParams()).toEqual(
      'https://randomuser.me/api/'
    );
    expect(component.getEntityUrl(USER_DATA[0].cell)).toEqual(
      `https://randomuser.me/api/${USER_DATA[0].cell}/?results=100&nat=us,dk,fr,gb`
    );
  }));

  it('should derive itemLabel[Plural] from entityName', async () => {
    componentRef.setInput('entityName', 'userProfile');
    componentRef.setInput('itemLabel', undefined);
    componentRef.setInput('itemLabelPlural', undefined);
    fixture.detectChanges();
    expect(component._entityNamePlural()).toEqual('userProfiles');
    // userProfile converted to Title Case using lodash.startCase.
    const itemLabel = await firstValueFrom(component._itemLabel());
    expect(itemLabel).toEqual('User Profile');
    // Default pluralization using 'pluralize' library
    const itemLabelPlural = await firstValueFrom(component._itemLabelPlural());
    expect(itemLabelPlural).toEqual('User Profiles');
  });

  it('should accept hybrid column definitions', fakeAsync(() => {
    // await createCrudComponent();
    componentRef.setInput(
      'endpoint',
      'https://randomuser.me/api/?results=100&nat=us,dk,fr,gb'
    );
    componentRef.setInput('idKey', 'cell');
    const http = TestBed.inject(HttpClient);
    spyOn(http, 'get').and.returnValue(of(USER_DATA));
    fixture.autoDetectChanges();
    tick(100);
    expect(component).toBeTruthy();
    const rows = fixture.debugElement.nativeElement.querySelectorAll('tr');
    // +1 for the <tr> in <thead>
    expect(rows.length).toEqual(USER_DATA.length + 1);
    const paginator =
      fixture.debugElement.nativeElement.querySelector('mat-paginator');
    expect(paginator).toBeFalsy();
  }));

  it('should disable all action items if disableItemActions=true', fakeAsync(() => {
    // await createCrudComponent();
    componentRef.setInput(
      'endpoint',
      'https://randomuser.me/api/?results=100&nat=us,dk,fr,gb'
    );
    componentRef.setInput('idKey', 'cell');
    componentRef.setInput('disableItemActions', true);
    componentRef.setInput('itemActions', [
      { label: 'Edit', role: '_update_' },
      { label: 'Delete', role: '_delete_' },
    ]);
    const http = TestBed.inject(HttpClient);
    spyOn(http, 'get').and.returnValue(of(USER_DATA));
    fixture.autoDetectChanges();
    tick(100);
    expect(component).toBeTruthy();
    const rows =
      fixture.debugElement.nativeElement.querySelectorAll('tbody tr');
    // +1 for the <tr> in <thead>
    expect(rows.length).toEqual(USER_DATA.length);
    const paginator =
      fixture.debugElement.nativeElement.querySelector('mat-paginator');
    expect(paginator).toBeFalsy();
    const columns = rows[0].querySelectorAll('td');
    // columns should equal number columns as set in [columns] property value
    expect(columns.length).toEqual(USER_COLUMNS.length + 1);
    // get the action button in the last column
    const actionBtn = columns[columns.length - 1].querySelector('button');
    expect(actionBtn).toBeTruthy();
    actionBtn.click();
    fixture.detectChanges();
    tick(100);
    const matMenu = fixture.debugElement.query(By.directive(MatMenu));
    expect(matMenu).toBeTruthy();
    // mat-menu-item buttons are dynamically crated in the document root
    // and not under <mat-menu> element
    const menuItems = document.querySelectorAll(
      'button[mat-menu-item][disabled="true"]'
    );
    // one for "Update" and one for "Delete"
    expect(menuItems.length).toEqual(2);
  }));

  it('should invoke custom action handlers', fakeAsync(() => {
    // await createCrudComponent();
    componentRef.setInput(
      'endpoint',
      'https://randomuser.me/api/?results=100&nat=us,dk,fr,gb'
    );
    componentRef.setInput('idKey', 'cell');
    componentRef.setInput('disableItemActions', false);

    let customAction2Called = false;
    let customAction3Called = false;
    const ITEM_ACTIONS = [
      {
        label: 'Custom Action 1',
        role: 'custom_action_1/',
        httpRequestParameters: {
          method: 'POST',
          urlPath: 'custom_action_1',
          params: new HttpParams().set('verbose', 'true'),
          body: {
            info: 'some data',
          },
        },
      },
      {
        label: 'Custom Action 2',
        role: 'custom_action_2',
        action: (entity: User) => {
          customAction2Called = true;
        },
      },
      {
        label: 'Custom Action 3',
        role: 'custom_action_3',
        httpRequestParameters: {
          method: 'POST',
          urlPath: 'custom_action_3/',
          params: new HttpParams().set('verbose', 'true'),
          body: {
            info: 'some data',
          },
        },
        action: (entity: User) => {
          customAction3Called = true;
        },
      },
    ];
    componentRef.setInput('itemActions', ITEM_ACTIONS);
    const http = TestBed.inject(HttpClient);
    spyOn(http, 'get').and.returnValue(of(USER_DATA));
    fixture.autoDetectChanges();
    tick(100);
    expect(component).toBeTruthy();
    const rows =
      fixture.debugElement.nativeElement.querySelectorAll('tbody tr');
    // +1 for the <tr> in <thead>
    expect(rows.length).toEqual(USER_DATA.length);
    const columns = rows[0].querySelectorAll('td');
    // columns should equal number columns as set in [columns] property value
    expect(columns.length).toEqual(USER_COLUMNS.length + 1);
    // get the action button in the last column
    const actionBtn = columns[columns.length - 1].querySelector('button');
    expect(actionBtn).toBeTruthy();

    // click action button 1
    {
      actionBtn.click();
      fixture.detectChanges();
      const matMenu = fixture.debugElement.query(By.directive(MatMenu));
      expect(matMenu).toBeTruthy();
      const matMenuItems = fixture.debugElement.queryAll(
        By.directive(MatMenuItem)
      );
      expect(matMenuItems.length).toEqual(ITEM_ACTIONS.length);

      // Custom Action 1
      expect((matMenuItems[0].nativeElement as HTMLElement).innerText).toEqual(
        'Custom Action 1'
      );

      // Validate HTTP POST call for custom action 1
      spyOn(http, 'post').and.callFake(((
        url: string,
        data: any,
        options: any
      ) => {
        expect(url).toContain('custom_action_1/');
        const parts = url.split('?');
        expect(parts[0].endsWith('custom_action_1/')).toBeTrue();
        expect(data).toEqual({ info: 'some data' });
        expect(options.params.get('verbose')).toEqual('true');
        return of({});
      }) as any); // 'as any' to suppress TSC function prototype mismatch

      matMenuItems[0].nativeElement.click();
      fixture.detectChanges();
      expect(http.post).toHaveBeenCalled();
    }

    // Click action button 2
    {
      actionBtn.click();
      fixture.detectChanges();
      const matMenu = fixture.debugElement.query(By.directive(MatMenu));
      expect(matMenu).toBeTruthy();
      const matMenuItems = fixture.debugElement.queryAll(
        By.directive(MatMenuItem)
      );
      expect(matMenuItems.length).toEqual(ITEM_ACTIONS.length);

      expect((matMenuItems[1].nativeElement as HTMLElement).innerText).toEqual(
        'Custom Action 2'
      );
      matMenuItems[1].nativeElement.click();
      fixture.detectChanges();
      expect(customAction2Called).toBeTrue();
    }

    // Verify that action handler is preferred over HTTP request for Custom Action 3
    // even though `httpParameters` is specified.
    {
      actionBtn.click();
      fixture.detectChanges();
      const matMenu = fixture.debugElement.query(By.directive(MatMenu));
      expect(matMenu).toBeTruthy();
      const matMenuItems = fixture.debugElement.queryAll(
        By.directive(MatMenuItem)
      );
      expect(matMenuItems.length).toEqual(ITEM_ACTIONS.length);

      expect((matMenuItems[2].nativeElement as HTMLElement).innerText).toEqual(
        'Custom Action 3'
      );
      matMenuItems[2].nativeElement.click();
      fixture.detectChanges();
      expect(customAction3Called).toBeTrue();
    }
  }));

  it('should not display "New Item" button disableCreate = true', async () => {
    // await createCrudComponent();
    componentRef.setInput(
      'endpoint',
      'https://randomuser.me/api/?results=100&nat=us,dk,fr,gb'
    );
    componentRef.setInput('idKey', 'cell');
    componentRef.setInput('disableCreate', true);
    const http = TestBed.inject(HttpClient);
    spyOn(http, 'get').and.returnValue(of(USER_DATA));
    fixture.autoDetectChanges();
    const matButton = fixture.debugElement.query(By.directive(MatButton));
    expect(matButton).toBeFalsy();
  });

  it("should refresh entity after CREATE when refreshAfterEdit='object'", async () => {
    componentRef.setInput(
      'endpoint',
      'https://randomuser.me/api/?results=100&nat=us,dk,fr,gb'
    );
    componentRef.setInput('idKey', 'cell');
    componentRef.setInput('disableCreate', true);
    componentRef.setInput('crudHttpReqContext', ['cache', true]);
    const http = TestBed.inject(HttpClient);
    let httpPOSTReqContextReceived = false;
    spyOn(http, 'post').and.callFake(((
      url: string,
      data: any,
      options: any
    ) => {
      const cache = options.context.get('cache') === true;
      const crudContextParams: SPMatEntityCrudHttpContext = options.context.get(
        SP_MAT_ENTITY_CRUD_HTTP_CONTEXT
      );
      httpPOSTReqContextReceived =
        !!cache && !!crudContextParams && crudContextParams.op == 'create';
      // console.log(JSON.stringify(crudContextParams, null, 2));
      return of({
        ...USER_DATA[0],
        cell: '83939830309303',
      });
    }) as any); // 'as any' to suppress TSC function prototype mismatch

    let httpGETReqContextReceived = false;
    spyOn(http, 'get').and.callFake(((url: string, options: any) => {
      if (url.includes('/83939830309303/')) {
        // refresh item
        const cache = options.context.get('cache') === true;
        const crudContextParams: SPMatEntityCrudHttpContext =
          options.context.get(SP_MAT_ENTITY_CRUD_HTTP_CONTEXT);
        httpGETReqContextReceived =
          !!cache && !!crudContextParams && crudContextParams.op == 'retrieve';
        return of({
          ...USER_DATA[0],
          cell: '888',
        });
      } else {
        // initial get users request
        return of(USER_DATA);
      }
    }) as any); // 'as any' to suppress TSC function prototype mismatch

    // spyOn(http, 'get').and.returnValue(of(USER_DATA));
    // componentRef.setInput('crudOpFn', crudOpFn);
    componentRef.setInput('refreshAfterEdit', 'object');
    fixture.autoDetectChanges();
    // Mocking object CREATE by calling the bridge method directly
    const res = await firstValueFrom(component.create({}));
    expect(httpPOSTReqContextReceived).toBeTrue();
    expect(httpGETReqContextReceived).toBeTrue();
    expect(res.cell).toEqual('888');
  });

  it('should set common HTTP context for all crud operations', async () => {
    componentRef.setInput(
      'endpoint',
      'https://randomuser.me/api/?results=100&nat=us,dk,fr,gb'
    );
    componentRef.setInput('idKey', 'cell');
    componentRef.setInput('disableCreate', true);
    const CACHE_TOKEN = new HttpContextToken<boolean>(() => true);
    componentRef.setInput('crudHttpReqContext', new HttpContext().set(CACHE_TOKEN, true));
    const http = TestBed.inject(HttpClient);
    let httpPOSTReqContextReceived = false;
    spyOn(http, 'post').and.callFake(((
      url: string,
      data: any,
      options: any
    ) => {
      const cache = options.context.get(CACHE_TOKEN) === true;
      const crudContextParams: SPMatEntityCrudHttpContext = options.context.get(
        SP_MAT_ENTITY_CRUD_HTTP_CONTEXT
      );
      httpPOSTReqContextReceived =
        !!cache && !!crudContextParams && crudContextParams.op == 'create';
      // console.log(JSON.stringify(crudContextParams, null, 2));
      return of({
        ...USER_DATA[0],
        cell: '83939830309303',
      });
    }) as any); // 'as any' to suppress TSC function prototype mismatch

    let httpGETReqContextReceived = false;
    spyOn(http, 'get').and.callFake(((url: string, options: any) => {
      if (url.includes('/83939830309303/')) {
        // refresh item
        const cache = options.context.get(CACHE_TOKEN) === true;
        const crudContextParams: SPMatEntityCrudHttpContext =
          options.context.get(SP_MAT_ENTITY_CRUD_HTTP_CONTEXT);
        httpGETReqContextReceived =
          !!cache && !!crudContextParams && crudContextParams.op == 'retrieve';
        return of({
          ...USER_DATA[0],
          cell: '888',
        });
      } else {
        // initial get users request
        return of(USER_DATA);
      }
    }) as any); // 'as any' to suppress TSC function prototype mismatch

    // spyOn(http, 'get').and.returnValue(of(USER_DATA));
    // componentRef.setInput('crudOpFn', crudOpFn);
    componentRef.setInput('refreshAfterEdit', 'object');
    fixture.autoDetectChanges();
    // Mocking object CREATE by calling the bridge method directly
    const res = await firstValueFrom(component.create({}));
    expect(httpPOSTReqContextReceived).toBeTrue();
    expect(httpGETReqContextReceived).toBeTrue();
    expect(res.cell).toEqual('888');
  });

  it('should set crud specific HTTP context tokens', async () => {
    componentRef.setInput(
      'endpoint',
      'https://randomuser.me/api/?results=100&nat=us,dk,fr,gb'
    );
    componentRef.setInput('idKey', 'cell');
    componentRef.setInput('disableCreate', true);
    componentRef.setInput('crudHttpReqContext', {
      create: ['cache', true],
      retrieve: ['cache', true],
    });
    const http = TestBed.inject(HttpClient);
    let httpPOSTReqContextReceived = false;
    spyOn(http, 'post').and.callFake(((
      url: string,
      data: any,
      options: any
    ) => {
      const cache = options.context.get('cache') === true;
      const crudContextParams: SPMatEntityCrudHttpContext = options.context.get(
        SP_MAT_ENTITY_CRUD_HTTP_CONTEXT
      );
      httpPOSTReqContextReceived =
        !!cache && !!crudContextParams && crudContextParams.op == 'create';
      // console.log(JSON.stringify(crudContextParams, null, 2));
      return of({
        ...USER_DATA[0],
        cell: '83939830309303',
      });
    }) as any); // 'as any' to suppress TSC function prototype mismatch

    let httpGETReqContextReceived = false;
    spyOn(http, 'get').and.callFake(((url: string, options: any) => {
      if (url.includes('/83939830309303/')) {
        // refresh item
        const cache = options.context.get('cache') === true;
        const crudContextParams: SPMatEntityCrudHttpContext =
          options.context.get(SP_MAT_ENTITY_CRUD_HTTP_CONTEXT);
        httpGETReqContextReceived =
          !!cache && !!crudContextParams && crudContextParams.op == 'retrieve';
        return of({
          ...USER_DATA[0],
          cell: '888',
        });
      } else {
        // initial get users request
        return of(USER_DATA);
      }
    }) as any); // 'as any' to suppress TSC function prototype mismatch

    // spyOn(http, 'get').and.returnValue(of(USER_DATA));
    // componentRef.setInput('crudOpFn', crudOpFn);
    componentRef.setInput('refreshAfterEdit', 'object');
    fixture.autoDetectChanges();
    // Mocking object CREATE by calling the bridge method directly
    const res = await firstValueFrom(component.create({}));
    expect(httpPOSTReqContextReceived).toBeTrue();
    expect(httpGETReqContextReceived).toBeTrue();
    expect(res.cell).toEqual('888');
  });

   it('should set crud specific HTTP context', async () => {
     componentRef.setInput(
       'endpoint',
       'https://randomuser.me/api/?results=100&nat=us,dk,fr,gb'
     );
     componentRef.setInput('idKey', 'cell');
     componentRef.setInput('disableCreate', true);

     const CACHE_TOKEN = new HttpContextToken<boolean>(() => true);

     const httpContext = new HttpContext();
     httpContext.set(CACHE_TOKEN, true);

     componentRef.setInput('crudHttpReqContext', {
       create: httpContext,
       retrieve: httpContext,
     });
     const http = TestBed.inject(HttpClient);
     let httpPOSTReqContextReceived = false;
     spyOn(http, 'post').and.callFake(((
       url: string,
       data: any,
       options: any
     ) => {
       const cache = options.context.get(CACHE_TOKEN) === true;
       const crudContextParams: SPMatEntityCrudHttpContext =
         options.context.get(SP_MAT_ENTITY_CRUD_HTTP_CONTEXT);
       httpPOSTReqContextReceived =
         !!cache && !!crudContextParams && crudContextParams.op == 'create';
       // console.log(JSON.stringify(crudContextParams, null, 2));
       return of({
         ...USER_DATA[0],
         cell: '83939830309303',
       });
     }) as any); // 'as any' to suppress TSC function prototype mismatch

     let httpGETReqContextReceived = false;
     spyOn(http, 'get').and.callFake(((url: string, options: any) => {
       if (url.includes('/83939830309303/')) {
         // refresh item
         const cache = options.context.get(CACHE_TOKEN) === true;
         const crudContextParams: SPMatEntityCrudHttpContext =
           options.context.get(SP_MAT_ENTITY_CRUD_HTTP_CONTEXT);
         httpGETReqContextReceived =
           !!cache && !!crudContextParams && crudContextParams.op == 'retrieve';
         return of({
           ...USER_DATA[0],
           cell: '888',
         });
       } else {
         // initial get users request
         return of(USER_DATA);
       }
     }) as any); // 'as any' to suppress TSC function prototype mismatch

     // spyOn(http, 'get').and.returnValue(of(USER_DATA));
     // componentRef.setInput('crudOpFn', crudOpFn);
     componentRef.setInput('refreshAfterEdit', 'object');
     fixture.autoDetectChanges();
     // Mocking object CREATE by calling the bridge method directly
     const res = await firstValueFrom(component.create({}));
     expect(httpPOSTReqContextReceived).toBeTrue();
     expect(httpGETReqContextReceived).toBeTrue();
     expect(res.cell).toEqual('888');
   });

  it("should refresh entity after UPDATE when refreshAfterEdit='object'", async () => {
    componentRef.setInput(
      'endpoint',
      'https://randomuser.me/api/?results=100&nat=us,dk,fr,gb'
    );
    componentRef.setInput('idKey', 'cell');
    componentRef.setInput('disableCreate', true);
    componentRef.setInput('crudHttpReqContext', ['cache', true]);
    const http = TestBed.inject(HttpClient);
    let httpGETReqContextReceived = false;
    spyOn(http, 'get').and.callFake(((url: string, options: any) => {
      if (url.includes('/83939830309303/')) {
        // refresh item
        const cache = options.context.get('cache') === true;
        const crudContextParams: SPMatEntityCrudHttpContext =
          options.context.get(SP_MAT_ENTITY_CRUD_HTTP_CONTEXT);
        httpGETReqContextReceived =
          !!cache && !!crudContextParams && crudContextParams.op == 'retrieve';
        return of({
          ...USER_DATA[0],
          cell: '888',
        });
      } else {
        // initial get users request
        return of(USER_DATA);
      }
    }) as any); // 'as any' to suppress TSC function prototype mismatch
    let httpPATCHReqContextReceived = false;
    spyOn(http, 'patch').and.callFake(((
      url: string,
      data: any,
      options: any
    ) => {
      const cache = options.context.get('cache') === true;
      const crudContextParams: SPMatEntityCrudHttpContext = options.context.get(
        SP_MAT_ENTITY_CRUD_HTTP_CONTEXT
      );
      httpPATCHReqContextReceived =
        !!cache && !!crudContextParams && crudContextParams.op === 'update';
      return of({
        ...USER_DATA[0],
        cell: '83939830309303',
      });
    }) as any); // 'as any' to suppress TSC function prototype mismatch
    componentRef.setInput('refreshAfterEdit', 'object');
    fixture.autoDetectChanges();
    // Mocking object UPDATE by calling the bridge method directly
    await firstValueFrom(
      component.update(USER_DATA[0]['cell'], { gender: 'M' })
    );
    expect(httpPATCHReqContextReceived).toBeTrue();
    expect(httpGETReqContextReceived).toBeTrue();
  });

  it("should refresh all entities after CREATE when refreshAfterEdit='all'", fakeAsync(() => {
    componentRef.setInput(
      'endpoint',
      'https://randomuser.me/api/?results=100&nat=us,dk,fr,gb'
    );
    componentRef.setInput('idKey', 'cell');
    componentRef.setInput('disableCreate', true);
    const http = TestBed.inject(HttpClient);
    const getSpy = spyOn(http, 'get').and.returnValue(of(USER_DATA));
    const patchSpy = spyOn(http, 'patch').and.returnValue(of(USER_DATA[0]));
    // componentRef.setInput('crudOpFn', crudOpFn);
    componentRef.setInput('refreshAfterEdit', 'all');
    fixture.autoDetectChanges();
    tick();
    expect(getSpy).toHaveBeenCalledTimes(1);
    // Mocking object UPDATE by calling the bridge method directly
    // This should result in another call to load all entities as we have
    // set refreshAfterEdit='all'
    firstValueFrom(component.update(USER_DATA[0]['cell'], { gender: 'M' }));
    tick();
    expect(getSpy).toHaveBeenCalledTimes(2);
  }));

  it("should call crudResponseParser after CREATE/UPDATE when refreshAfterEdit='object'", async () => {
    componentRef.setInput(
      'endpoint',
      'https://randomuser.me/api/?results=100&nat=us,dk,fr,gb'
    );
    let crudOpCalled = 0;
    const crudOpFn = (
      op: string,
      id: any,
      entityValue: any,
      entityCrudComponent: SPMatEntityCrudCreateEditBridge
    ) => {
      crudOpCalled++;
      return of({
        ...USER_DATA[0],
        cell: '83939830309303',
      }); // Fake data
    };
    componentRef.setInput('idKey', 'cell');
    componentRef.setInput('disableCreate', true);
    let crudResponseParserCalled = 0;
    const crudResponseParserFn = (
      entityName: string,
      idKey: string,
      method: 'create' | 'retrieve' | 'update' | 'delete',
      resp: any
    ) => {
      crudResponseParserCalled++;
      return {
        ...USER_DATA[0],
        cell: '888', // deliberately return a different value for testing
      };
    };
    componentRef.setInput('crudResponseParser', crudResponseParserFn);
    const http = TestBed.inject(HttpClient);
    spyOn(http, 'get').and.returnValue(of(USER_DATA));
    componentRef.setInput('crudOpFn', crudOpFn);
    componentRef.setInput('refreshAfterEdit', 'object');
    fixture.autoDetectChanges();
    // Mocking object CREATE by calling the bridge method directly
    const res = await firstValueFrom(component.create({}));
    // Once for 'create' and another for 'get' (because refreshAfterEdit='object')
    expect(crudOpCalled).toEqual(2);
    expect(res.cell).toEqual('888'); // --> diff from crudOpFn() reply
    // Once for parsing the 'CREATE' response and the next for parsing
    // refreshAfterEdit='object' response.
    expect(crudResponseParserCalled).toEqual(2);
  });
});

describe('SPMatEntityCrudComponent client configurable behavior', () => {
  let testComponent!: SPMatEntityCrudTestComponent;
  let testComponentFixture!: ComponentFixture<SPMatEntityCrudTestComponent>;
  let testComponentRef!: ComponentRef<SPMatEntityCrudTestComponent>;
  let fixture!: ComponentFixture<UserEntityCrudComponent>;
  let component!: UserEntityCrudComponent;
  let componentRef!: ComponentRef<UserEntityCrudComponent>;

  beforeEach(fakeAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        SPMatEntityCrudTestComponent,
        getTranslocoModule(),
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: { id: '100' } },
          },
        },
      ],
    });
    testComponentFixture = TestBed.createComponent(
      SPMatEntityCrudTestComponent
    );
    testComponent = testComponentFixture.componentInstance;
    testComponentRef = testComponentFixture.componentRef;
    component = testComponent.spEntityCrudComponent()!;
    const http = TestBed.inject(HttpClient);
    spyOn(http, 'get').and.returnValue(of(USER_DATA));
    testComponentFixture.autoDetectChanges();
    tick(100);
  }));

  it('should take matColumnDef from projected content', fakeAsync(() => {
    const rows =
      testComponentFixture.debugElement.nativeElement.querySelectorAll('tr');
    // +1 for the <tr> in <thead>
    expect(rows.length).toEqual(USER_DATA.length + 1);
    const paginator =
      testComponentFixture.debugElement.nativeElement.querySelector(
        'mat-paginator'
      );
    expect(paginator).toBeFalsy();
    const theadRows: Element[] =
      testComponentFixture.debugElement.nativeElement.querySelectorAll(
        'thead tr th'
      );
    // +1 for 'action' column
    expect(theadRows.length).toEqual(USER_COLUMNS.length + 1);
    const nameRow = theadRows[0];
    // Column title set from content project <ng-container matColumnDef..>
    expect(nameRow.textContent).toEqual('FULL NAME');
    const wrapperDiv =
      testComponentFixture.debugElement.nativeElement.querySelector(
        'div.my-list-pane-wrapper-class'
      );
    expect(wrapperDiv).toBeTruthy();
  }));

  it('should show preview pane when a row is clicked', fakeAsync(() => {
    expect(component).toBeTruthy();
    let createEditActivatedEvents: Array<{
      activated: boolean;
      cancelled: boolean | undefined;
      mode: 'edit' | 'preview';
    }> = [];
    const sub = component.entityViewPaneActivated
      .asObservable()
      .pipe(
        tap((event) => {
          createEditActivatedEvents.push(event);
        })
      )
      .subscribe();
    const rows: HTMLElement[] =
      testComponentFixture.debugElement.nativeElement.querySelectorAll(
        'tbody tr'
      );
    expect(rows.length).toEqual(USER_DATA.length);
    rows[0].click(); // click the first row
    testComponentFixture.detectChanges();
    tick();
    const previewPane =
      testComponentFixture.debugElement.nativeElement.querySelector(
        'sp-mat-entity-crud-preview-pane'
      );
    expect(previewPane).toBeTruthy();
    // preview pane wrapper class shpould be set to 'my-preview-pane-wrapper-class'
    expect(
      testComponentFixture.debugElement.nativeElement.querySelector(
        'div.my-preview-pane-wrapper-class'
      )
    ).toBeTruthy();
    // Preview pane should contain a <div class="my-preview-pane-content-class"> which is
    // where the client content is projected.
    expect(
      previewPane.querySelector('div.my-preview-pane-content-class')
    ).toBeTruthy();
    // preview Pane should have the full name of the clicked user
    const h1 = previewPane.querySelector('h1');
    expect(h1).toBeTruthy();
    expect(h1.textContent).toEqual(
      USER_DATA[0].name.first + ' ' + USER_DATA[0].name.last
    );

    const button = previewPane.querySelector('button[aria-label="Close"]');
    if (button) {
      button.click();
    }
    testComponentFixture.autoDetectChanges();
    tick();
    // Test that createEditActivatedEvent was received with the correct args
    expect(createEditActivatedEvents.length).toEqual(2);
    expect(createEditActivatedEvents[0].activated).toBeTrue();
    expect(createEditActivatedEvents[0].mode).toEqual('preview');
    expect(createEditActivatedEvents[0].cancelled).toEqual(undefined);
    expect(createEditActivatedEvents[1].activated).toBeFalse();
    expect(createEditActivatedEvents[1].mode).toEqual('preview');
    expect(createEditActivatedEvents[1].cancelled).toEqual(undefined);

    sub.unsubscribe();
  }));

  it('should show the create form when New button is selected', fakeAsync(() => {
    const http = TestBed.inject(HttpClient);
    const JOHN_SMITH: User = {
      name: { title: 'mr', first: 'John', last: 'Smith' },
      gender: 'female',
      cell: '93039309',
    };
    spyOn(http, 'post').and.returnValue(of(JOHN_SMITH));
    const spEntityCrudComp = testComponent.spEntityCrudComponent();
    let spEntityCrudCompSpy = undefined;
    if (spEntityCrudComp) {
      spEntityCrudCompSpy = spyOn(spEntityCrudComp, 'create').and.callThrough();
    }
    const matButton = testComponentFixture.debugElement.query(
      By.directive(MatButton)
    );
    matButton.nativeElement.click();
    testComponentFixture.detectChanges();
    tick();
    const createEditHost = testComponentFixture.debugElement.query(
      By.directive(CreateEditUserComponent)
    );
    expect(createEditHost).toBeTruthy();
    const inputs =
      testComponentFixture.debugElement.nativeElement.querySelectorAll('input');
    inputs[0].value = JOHN_SMITH.name.first;
    inputs[1].value = JOHN_SMITH.name.last;
    inputs[2].value = JOHN_SMITH.cell;
    inputs.forEach((input: HTMLInputElement) => {
      input.dispatchEvent(new Event('input'));
    });
    // I can't simulate MatSelect selection this way. So setting the gender
    // form control's value directly.
    // const select = testComponentFixture.debugElement.query(By.directive(MatSelect));
    // (select.componentInstance as MatSelect).writeValue(JOHN_SMITH.gender);
    (createEditHost.componentInstance as CreateEditUserComponent).form().controls[
      'gender'
    ].setValue('female');
    testComponentFixture.detectChanges();
    const submitButton =
      testComponentFixture.debugElement.nativeElement.querySelector(
        "button[type='submit']"
      );
    submitButton.click();
    testComponentFixture.detectChanges();
    // verify that create method has been called.
    expect(spEntityCrudCompSpy).toHaveBeenCalled();
    if (spEntityCrudComp) {
      const newCount = spEntityCrudComp
        .spEntitiesList()
        ?.store.query(getEntitiesCount());
      expect(newCount).toEqual(USER_DATA.length + 1);
    }
  }));

  it('should set form control errors when form control validation fails', fakeAsync(() => {
    const http = TestBed.inject(HttpClient);
    const JOHN_SMITH: User = {
      name: { title: 'mr', first: 'John', last: 'Smith' },
      gender: 'female',
      cell: '93039309',
    };
    spyOn(http, 'post').and.returnValue(of(JOHN_SMITH));
    const spEntityCrudComp = testComponent.spEntityCrudComponent();
    let spEntityCrudCompSpy = undefined;
    if (spEntityCrudComp) {
      spEntityCrudCompSpy = spyOn(spEntityCrudComp, 'create').and.callThrough();
    }
    const matButton = testComponentFixture.debugElement.query(
      By.directive(MatButton)
    );
    matButton.nativeElement.click();
    testComponentFixture.detectChanges();
    tick();
    const createEditHost = testComponentFixture.debugElement.query(
      By.directive(CreateEditUserComponent)
    );
    expect(createEditHost).toBeTruthy();
    const inputs =
      testComponentFixture.debugElement.nativeElement.querySelectorAll('input');
    inputs[0].value = JOHN_SMITH.name.first;
    inputs[1].value = JOHN_SMITH.name.last;
    inputs[2].value = JOHN_SMITH.cell.slice(0, 4);
    inputs.forEach((input: HTMLInputElement) => {
      input.dispatchEvent(new Event('input'));
    });
    // I can't simulate MatSelect selection this way. So setting the gender
    // form control's value directly.
    // const select = testComponentFixture.debugElement.query(By.directive(MatSelect));
    // (select.componentInstance as MatSelect).writeValue(JOHN_SMITH.gender);
    (createEditHost.componentInstance as CreateEditUserComponent).form().controls[
      'gender'
    ].setValue('female');
    testComponentFixture.detectChanges();
    const submitButton =
      testComponentFixture.debugElement.nativeElement.querySelector(
        "button[type='submit']"
      );
    submitButton.click();
    testComponentFixture.detectChanges();
    // verify that cell field has errors for not meeting the Validators.minLength
    // requirements. This error should look like {requiredLength: 8, actualLength: 4}
    const cellErrors = (
      createEditHost.componentInstance as CreateEditUserComponent
    ).form().controls['cell'].errors;
    expect(cellErrors).toEqual({
      minlength: { requiredLength: 8, actualLength: 4 },
    });
    // verify that create method has been called.
    expect(spEntityCrudCompSpy).toHaveBeenCalledTimes(0);
    if (spEntityCrudComp) {
      const newCount = spEntityCrudComp
        .spEntitiesList()
        ?.store.query(getEntitiesCount());
      expect(newCount).toEqual(USER_DATA.length);
    }
  }));

  it('should close the form when Bridge.close() is called', fakeAsync(() => {
    const http = TestBed.inject(HttpClient);
    const JOHN_SMITH: User = {
      name: { title: 'mr', first: 'John', last: 'Smith' },
      gender: 'female',
      cell: '93039309',
    };
    spyOn(http, 'post').and.returnValue(of(JOHN_SMITH));
    const spEntityCrudComp = testComponent.spEntityCrudComponent();
    let spEntityCrudCompSpy = undefined;
    if (spEntityCrudComp) {
      spEntityCrudCompSpy = spyOn(spEntityCrudComp, 'create').and.callThrough();
    }
    let createEditActivatedEvents: Array<{
      activated: boolean;
      cancelled: boolean | undefined;
      mode: 'edit' | 'preview';
    }> = [];
    const sub = spEntityCrudComp?.entityViewPaneActivated
      .asObservable()
      .pipe(
        tap((event) => {
          createEditActivatedEvents.push(event);
        })
      )
      .subscribe();
    const matButton = testComponentFixture.debugElement.query(
      By.directive(MatButton)
    );
    matButton.nativeElement.click();
    testComponentFixture.detectChanges();
    tick(100);
    const createEditHost = testComponentFixture.debugElement.query(
      By.directive(CreateEditUserComponent)
    );
    expect(createEditHost).toBeTruthy();
    const inputs =
      testComponentFixture.debugElement.nativeElement.querySelectorAll('input');
    inputs[0].value = JOHN_SMITH.name.first;
    inputs[1].value = JOHN_SMITH.name.last;
    inputs[2].value = JOHN_SMITH.cell;
    inputs.forEach((input: HTMLInputElement) => {
      input.dispatchEvent(new Event('input'));
    });
    // I can't simulate MatSelect selection this way. So setting the gender
    // form control's value directly.
    // const select = testComponentFixture.debugElement.query(By.directive(MatSelect));
    // (select.componentInstance as MatSelect).writeValue(JOHN_SMITH.gender);
    (createEditHost.componentInstance as CreateEditUserComponent).form().controls[
      'gender'
    ].setValue('female');
    testComponentFixture.detectChanges();
    (createEditHost.componentInstance as CreateEditUserComponent)
      .bridge()
      ?.close(false);
    // const submitButton = testComponentFixture.debugElement.nativeElement.querySelector("button[type='submit']");
    // submitButton.click();
    // testComponentFixture.detectChanges();
    // verify that create method has been called.
    expect(spEntityCrudCompSpy).toHaveBeenCalledTimes(0);
    if (spEntityCrudComp) {
      const newCount = spEntityCrudComp
        .spEntitiesList()
        ?.store.query(getEntitiesCount());
      expect(newCount).toEqual(USER_DATA.length);
    }
    // CreateEditHost component should 've been destroyed
    const createEditHostAfter = testComponentFixture.debugElement.query(
      By.directive(CreateEditUserComponent)
    );
    expect(createEditHostAfter).toBeFalsy();
    // Test that createEditActivatedEvent was received with the correct args
    expect(createEditActivatedEvents.length).toEqual(2);
    expect(createEditActivatedEvents[0].activated).toBeTrue();
    expect(createEditActivatedEvents[0].mode).toEqual('edit');
    expect(createEditActivatedEvents[0].cancelled).toEqual(undefined);
    expect(createEditActivatedEvents[1].activated).toBeFalse();
    expect(createEditActivatedEvents[1].mode).toEqual('edit');
    expect(createEditActivatedEvents[1].cancelled).toBeFalse();
    sub?.unsubscribe();
  }));

  it('should show the new subtypes when New button is selected', fakeAsync(() => {
    const http = TestBed.inject(HttpClient);
    const JOHN_SMITH: User = {
      name: { title: 'mr', first: 'John', last: 'Smith' },
      gender: 'female',
      cell: '93039309',
    };
    spyOn(http, 'post').and.returnValue(of(JOHN_SMITH));
    testComponentFixture.componentRef.setInput('newSubTypes', [
      { role: 'car', label: 'Car' },
      { role: 'bike', label: 'Bike' },
    ]);
    testComponentFixture.detectChanges();
    const spEntityCrudComp = testComponent.spEntityCrudComponent();
    let spEntityCrudCompSpy = undefined;
    if (spEntityCrudComp) {
      spEntityCrudCompSpy = spyOn(spEntityCrudComp, 'create').and.callThrough();
    }
    const matButton = testComponentFixture.debugElement.query(
      By.directive(MatButton)
    );
    matButton.nativeElement.click();
    testComponentFixture.detectChanges();
    const matMenu = testComponentFixture.debugElement.query(
      By.directive(MatMenu)
    );
    expect(matMenu).toBeTruthy();
    const matMenuItems = testComponentFixture.debugElement.queryAll(
      By.directive(MatMenuItem)
    );
    expect(matMenuItems.length).toEqual(2);
    expect((matMenuItems[0].nativeElement as HTMLElement).innerText).toEqual(
      'Car'
    );
    expect((matMenuItems[1].nativeElement as HTMLElement).innerText).toEqual(
      'Bike'
    );
    (matMenuItems[0].nativeElement as HTMLElement).click();
    expect(testComponent.lastAction.role).toEqual('car');
    (matMenuItems[1].nativeElement as HTMLElement).click();
    expect(testComponent.lastAction.role).toEqual('bike');
  }));

  it('should show the edit form when Edit context menu item is selected', fakeAsync(() => {
    let editFormComponent = testComponentFixture.debugElement.query(
      By.directive(CreateEditUserComponent)
    );
    expect(editFormComponent).toBeFalsy();
    // simulate item action by calling the mat-context-menu method directly
    component.onItemAction('_update_', USER_DATA[0]);
    tick();
    editFormComponent = testComponentFixture.debugElement.query(
      By.directive(CreateEditUserComponent)
    );
    expect(editFormComponent).toBeTruthy();
  }));
});

/**
 * Tests that the CreateEditUserComponent works in standalone mode. That is
 * without the bridge property set to SPMatentityCrudComponent, which
 * implements SPMatEntityCrudCreateEditBridge.
 *
 * To test this we create the CreateEditUserComponent directly in the test bed.
 * with the baseUrl, entityName and httpReqContext(optional) inputs set.
 * Then we can trigger a form submission and verify that the HTTP request is
 * made correctly.
 */
describe('SPMatEntityCrudFormBase standalone mode tests', () => {
  let fixture!: ComponentFixture<CreateEditUserComponent>;
  let component!: CreateEditUserComponent;

  beforeEach(fakeAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        CreateEditUserComponent,
        getTranslocoModule(),
      ],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    fixture = TestBed.createComponent(CreateEditUserComponent);
    component = fixture.componentInstance;
  }));

  it('should validate baseUrl and entityName inputs are defined', () => {
    fixture.componentRef.setInput('entity', undefined);
    fixture.componentRef.setInput('bridge', undefined);
    fixture.componentRef.setInput('entityName', undefined);
    fixture.componentRef.setInput('baseUrl', undefined);
    expect(() => {
      fixture.detectChanges();
    }).toThrowError(
      'SPMatEntityCrudFormBase: baseUrl and entityName inputs must be defined in standalone mode.'
    );
  });

  it('should validate baseUrl input is defined', () => {
    fixture.componentRef.setInput('entity', undefined);
    fixture.componentRef.setInput('bridge', undefined);
    fixture.componentRef.setInput('entityName', 'user');
    fixture.componentRef.setInput('baseUrl', undefined);
    expect(() => {
      fixture.detectChanges();
    }).toThrowError(
      'SPMatEntityCrudFormBase: baseUrl and entityName inputs must be defined in standalone mode.'
    );
  });

  it('should validate entityName input is defined', () => {
    fixture.componentRef.setInput('entity', undefined);
    fixture.componentRef.setInput('bridge', undefined);
    fixture.componentRef.setInput('entityName', undefined);
    fixture.componentRef.setInput('baseUrl', 'http://randomuser.me/api/');
    expect(() => {
      fixture.detectChanges();
    }).toThrowError(
      'SPMatEntityCrudFormBase: baseUrl and entityName inputs must be defined in standalone mode.'
    );
  });

  it('should create a user', fakeAsync(() => {
    fixture.componentRef.setInput('entity', undefined);
    fixture.componentRef.setInput('bridge', undefined);
    fixture.componentRef.setInput('entityName', 'user');
    fixture.componentRef.setInput('baseUrl', 'http://randomuser.me/api/');
    fixture.componentRef.setInput('idKey', 'cell');
    const http = TestBed.inject(HttpClient);
    const JOHN_SMITH: User = {
      name: { title: 'mr', first: 'John', last: 'Smith' },
      gender: 'female',
      cell: '93039309',
    };
    const postSpy = spyOn(http, 'post').and.callFake((url: string, data: any, options: any) => {
      expect(url).toEqual('http://randomuser.me/api/');
      expect(data).toEqual({
        first: JOHN_SMITH.name.first,
        last: JOHN_SMITH.name.last,
        gender: 'female',
        cell: '93039309',
        name: {
          title: '',
          first: JOHN_SMITH.name.first,
          last: JOHN_SMITH.name.last,
        }
      });
      return of(JOHN_SMITH) as any;
    });
    fixture.autoDetectChanges();
    // spyOn(http, 'post').and.returnValue(of(JOHN_SMITH));
    const matButton = fixture.debugElement.query(
      By.directive(MatButton)
    );
    matButton.nativeElement.click();
    fixture.detectChanges();
    tick();
    const inputs =
      fixture.debugElement.nativeElement.querySelectorAll('input');
    inputs[0].value = JOHN_SMITH.name.first;
    inputs[1].value = JOHN_SMITH.name.last;
    inputs[2].value = JOHN_SMITH.cell;
    inputs.forEach((input: HTMLInputElement) => {
      input.dispatchEvent(new Event('input'));
    });
    // I can't simulate MatSelect selection this way. So setting the gender
    // form control's value directly.
    // const select = testComponentFixture.debugElement.query(By.directive(MatSelect));
    // (select.componentInstance as MatSelect).writeValue(JOHN_SMITH.gender);
    component.form().controls['gender'].setValue('female');
    fixture.detectChanges();
    tick();
    expect(component.form().valid).toBeTrue();
    const submitButton =
      fixture.debugElement.nativeElement.querySelector(
        "button[type='submit']"
      );
    expect(submitButton).toBeTruthy();
    submitButton.click();
    fixture.detectChanges();
    tick();
    expect(postSpy).toHaveBeenCalled();
  }));

  it('should update a user', fakeAsync(() => {
    const JOHN_SMITH: User = {
      name: { title: 'mr', first: 'John', last: 'Smith' },
      gender: 'female',
      cell: '93039309',
    };
    const EXISTING_USER: User = JSON.parse(JSON.stringify(JOHN_SMITH));

    fixture.componentRef.setInput('entity', EXISTING_USER.cell);
    fixture.componentRef.setInput('bridge', undefined);
    fixture.componentRef.setInput('entityName', 'user');
    fixture.componentRef.setInput('baseUrl', 'http://randomuser.me/api/');
    fixture.componentRef.setInput('idKey', 'cell');
    const http = TestBed.inject(HttpClient);
    // Mock the GET request to return JOHN_SMITH copy
    const getSpy = spyOn(http, 'get').and.callFake((url: string, options: any) => {
      expect(url).toEqual('http://randomuser.me/api/93039309/');
      return of(EXISTING_USER) as any;
    });

    fixture.autoDetectChanges();
    tick();  // trigger loadEntity$
    expect(getSpy).toHaveBeenCalled();
    const inputs =
      fixture.debugElement.nativeElement.querySelectorAll('input');
    expect(inputs[0].value).toEqual(JOHN_SMITH.name.first);
    expect(inputs[1].value).toEqual(JOHN_SMITH.name.last);
    expect(inputs[2].value).toEqual(JOHN_SMITH.cell);

    // Change first and last name
    inputs[0].value = JOHN_SMITH.name.first + 'Edited';
    inputs[1].value = JOHN_SMITH.name.last + 'Edited';
    inputs.forEach((input: HTMLInputElement) => {
      input.dispatchEvent(new Event('input'));
    });
    fixture.detectChanges();
    tick();
    expect(component.form().valid).toBeTrue();

    let patchData: any = null;
    const patchSpy = spyOn(http, 'patch').and.callFake((url: string, data: any, options: any) => {
      expect(url).toEqual('http://randomuser.me/api/93039309/');
      patchData = data;
      return of({
        ...EXISTING_USER,
        name: {
          title: '',
          first: EXISTING_USER.name.first + 'Edited',
          last: EXISTING_USER.name.last + 'Edited',
        }
      }) as any;
    });
    const submitButton =
      fixture.debugElement.nativeElement.querySelector(
        "button[type='submit']"
      );
    expect(submitButton).toBeTruthy();
    submitButton.click();
    fixture.detectChanges();
    tick();
    expect(patchSpy).toHaveBeenCalled();
    // Verify that patch request data is correct
    expect(patchData).toEqual({
      first: EXISTING_USER.name.first + 'Edited',
      last: EXISTING_USER.name.last + 'Edited',
      gender: 'female',
      cell: '93039309',
      name: {
        title: '',
        first: EXISTING_USER.name.first + 'Edited',
        last: EXISTING_USER.name.last + 'Edited',
      },
    });
  }));

  it('should set httpReqContext input in HTTP requests', fakeAsync(() => {
    const JOHN_SMITH: User = {
      name: { title: 'mr', first: 'John', last: 'Smith' },
      gender: 'female',
      cell: '93039309',
    };

    const CACHE_TOKEN = new HttpContextToken<boolean>(() => true);

    const httpReqContext = new HttpContext();
    httpReqContext.set(CACHE_TOKEN, true);

    fixture.componentRef.setInput('entity', undefined);
    fixture.componentRef.setInput('bridge', undefined);
    fixture.componentRef.setInput('entityName', 'user');
    fixture.componentRef.setInput('baseUrl', 'http://randomuser.me/api/');
    fixture.componentRef.setInput('idKey', 'cell');
    fixture.componentRef.setInput('httpReqContext', httpReqContext);
    const http = TestBed.inject(HttpClient);
    let httpPOSTReqContextReceived = false;
    const postSpy = spyOn(http, 'post').and.callFake((url: string, data: any, params: any) => {
      const cache = params.context.get(CACHE_TOKEN) === true;
      httpPOSTReqContextReceived = cache;
      return of({
        name: { title: 'mr', first: 'John', last: 'Smith' },
        gender: 'female',
        cell: '93039309',
      }) as any;
    });
    fixture.autoDetectChanges();
    // spyOn(http, 'post').and.returnValue(of(JOHN_SMITH));
    const matButton = fixture.debugElement.query(
      By.directive(MatButton)
    );
    matButton.nativeElement.click();
    fixture.detectChanges();
    tick();
    const inputs =
      fixture.debugElement.nativeElement.querySelectorAll('input');
    inputs[0].value = JOHN_SMITH.name.first;
    inputs[1].value = JOHN_SMITH.name.last;
    inputs[2].value = JOHN_SMITH.cell;
    inputs.forEach((input: HTMLInputElement) => {
      input.dispatchEvent(new Event('input'));
    });
    // I can't simulate MatSelect selection this way. So setting the gender
    // form control's value directly.
    // const select = testComponentFixture.debugElement.query(By.directive(MatSelect));
    // (select.componentInstance as MatSelect).writeValue(JOHN_SMITH.gender);
    component.form().controls['gender'].setValue('female');
    fixture.detectChanges();
    tick();
    expect(component.form().valid).toBeTrue();
    const submitButton =
      fixture.debugElement.nativeElement.querySelector(
        "button[type='submit']"
      );
    expect(submitButton).toBeTruthy();
    submitButton.click();
    fixture.detectChanges();
    tick();
    expect(postSpy).toHaveBeenCalled();
    expect(httpPOSTReqContextReceived).toBeTrue();
  }));

  it('should convert sideloaded CREATE entity response into entity object', fakeAsync(() => {
    const JOHN_SMITH: User = {
      name: { title: 'mr', first: 'John', last: 'Smith' },
      gender: 'female',
      cell: '93039309',
    };

    const CACHE_TOKEN = new HttpContextToken<boolean>(() => true);

    const httpReqContext = new HttpContext();
    httpReqContext.set(CACHE_TOKEN, true);

    fixture.componentRef.setInput('entity', undefined);
    fixture.componentRef.setInput('bridge', undefined);
    fixture.componentRef.setInput('entityName', 'user');
    fixture.componentRef.setInput('baseUrl', 'http://randomuser.me/api/');
    fixture.componentRef.setInput('idKey', 'cell');
    fixture.componentRef.setInput('httpReqContext', httpReqContext);
    const http = TestBed.inject(HttpClient);
    let httpPOSTReqContextReceived = false;
    const CREATE_RESPONSE = {
      user: {
        name: { title: 'mr', first: 'John', last: 'Smith' },
        gender: 'female',
        cell: '93039309',
      }
    };
    const postSpy = spyOn(http, 'post').and.callFake(
      (url: string, data: any, params: any) => {
        const cache = params.context.get(CACHE_TOKEN) === true;
        httpPOSTReqContextReceived = cache;
        return of(CREATE_RESPONSE) as any;
      }
    );
    const postCreateSpy = spyOn(component, 'onPostCreate').and.callThrough();
    fixture.autoDetectChanges();
    // spyOn(http, 'post').and.returnValue(of(JOHN_SMITH));
    const matButton = fixture.debugElement.query(By.directive(MatButton));
    matButton.nativeElement.click();
    fixture.detectChanges();
    tick();
    const inputs = fixture.debugElement.nativeElement.querySelectorAll('input');
    inputs[0].value = JOHN_SMITH.name.first;
    inputs[1].value = JOHN_SMITH.name.last;
    inputs[2].value = JOHN_SMITH.cell;
    inputs.forEach((input: HTMLInputElement) => {
      input.dispatchEvent(new Event('input'));
    });
    // I can't simulate MatSelect selection this way. So setting the gender
    // form control's value directly.
    // const select = testComponentFixture.debugElement.query(By.directive(MatSelect));
    // (select.componentInstance as MatSelect).writeValue(JOHN_SMITH.gender);
    component.form().controls['gender'].setValue('female');
    fixture.detectChanges();
    tick();
    expect(component.form().valid).toBeTrue();
    const submitButton = fixture.debugElement.nativeElement.querySelector(
      "button[type='submit']"
    );
    expect(submitButton).toBeTruthy();
    submitButton.click();
    fixture.detectChanges();
    tick();
    expect(postSpy).toHaveBeenCalled();
    expect(httpPOSTReqContextReceived).toBeTrue();
    expect(postCreateSpy).toHaveBeenCalledOnceWith(CREATE_RESPONSE.user);
  }));

  it('should convert sideloaded UPDATE entity response into entity object', fakeAsync(() => {
    const JOHN_SMITH: User = {
      name: { title: 'mr', first: 'John', last: 'Smith' },
      gender: 'female',
      cell: '93039309',
    };
    const EXISTING_USER: User = JSON.parse(JSON.stringify(JOHN_SMITH));

    fixture.componentRef.setInput('entity', EXISTING_USER.cell);
    fixture.componentRef.setInput('bridge', undefined);
    fixture.componentRef.setInput('entityName', 'user');
    fixture.componentRef.setInput('baseUrl', 'http://randomuser.me/api/');
    fixture.componentRef.setInput('idKey', 'cell');
    const http = TestBed.inject(HttpClient);
    // Mock the GET request to return JOHN_SMITH copy
    const getSpy = spyOn(http, 'get').and.callFake(
      (url: string, options: any) => {
        expect(url).toEqual('http://randomuser.me/api/93039309/');
        return of({ user: EXISTING_USER }) as any;
      }
    );

    fixture.autoDetectChanges();
    tick(); // trigger loadEntity$
    expect(getSpy).toHaveBeenCalled();
    const inputs = fixture.debugElement.nativeElement.querySelectorAll('input');
    expect(inputs[0].value).toEqual(JOHN_SMITH.name.first);
    expect(inputs[1].value).toEqual(JOHN_SMITH.name.last);
    expect(inputs[2].value).toEqual(JOHN_SMITH.cell);

    // Change first and last name
    inputs[0].value = JOHN_SMITH.name.first + 'Edited';
    inputs[1].value = JOHN_SMITH.name.last + 'Edited';
    inputs.forEach((input: HTMLInputElement) => {
      input.dispatchEvent(new Event('input'));
    });
    fixture.detectChanges();
    tick();
    expect(component.form().valid).toBeTrue();

    const postUpdateSpy = spyOn(component, 'onPostUpdate').and.callThrough();
    const PATCHED_USER = JSON.parse(JSON.stringify(JOHN_SMITH));
    PATCHED_USER.name.first = JOHN_SMITH.name.first + 'Edited';
    PATCHED_USER.name.last = JOHN_SMITH.name.last + 'Edited';
    let patchData: any = null;
    const patchSpy = spyOn(http, 'patch').and.callFake(
      (url: string, data: any, options: any) => {
        expect(url).toEqual('http://randomuser.me/api/93039309/');
        patchData = data;
        return of({
          user: PATCHED_USER
        }) as any;
      }
    );
    const submitButton = fixture.debugElement.nativeElement.querySelector(
      "button[type='submit']"
    );
    expect(submitButton).toBeTruthy();
    submitButton.click();
    fixture.detectChanges();
    tick();
    expect(patchSpy).toHaveBeenCalled();
    // Verify that patch request data is correct
    expect(patchData).toEqual({
      first: EXISTING_USER.name.first + 'Edited',
      last: EXISTING_USER.name.last + 'Edited',
      gender: 'female',
      cell: '93039309',
      name: {
        title: '',
        first: EXISTING_USER.name.first + 'Edited',
        last: EXISTING_USER.name.last + 'Edited',
      },
    });
    expect(postUpdateSpy).toHaveBeenCalledOnceWith(PATCHED_USER);
  }));

  it('should reset the form when reset button is clicked', fakeAsync(() => {
    const JOHN_SMITH: User = {
      name: { title: 'mr', first: 'John', last: 'Smith' },
      gender: 'female',
      cell: '93039309',
    };
    const EXISTING_USER: User = JSON.parse(JSON.stringify(JOHN_SMITH));

    fixture.componentRef.setInput('entity', EXISTING_USER.cell);
    fixture.componentRef.setInput('bridge', undefined);
    fixture.componentRef.setInput('entityName', 'user');
    fixture.componentRef.setInput('baseUrl', 'http://randomuser.me/api/');
    fixture.componentRef.setInput('idKey', 'cell');
    const http = TestBed.inject(HttpClient);
    // Mock the GET request to return JOHN_SMITH copy
    const getSpy = spyOn(http, 'get').and.callFake(
      (url: string, options: any) => {
        expect(url).toEqual('http://randomuser.me/api/93039309/');
        return of(EXISTING_USER) as any;
      }
    );

    fixture.autoDetectChanges();
    tick(); // trigger loadEntity$
    expect(getSpy).toHaveBeenCalled();
    const inputs = fixture.debugElement.nativeElement.querySelectorAll('input');
    expect(inputs[0].value).toEqual(JOHN_SMITH.name.first);
    expect(inputs[1].value).toEqual(JOHN_SMITH.name.last);
    expect(inputs[2].value).toEqual(JOHN_SMITH.cell);

    // Change first and last name
    inputs[0].value = JOHN_SMITH.name.first + 'Edited';
    inputs[1].value = JOHN_SMITH.name.last + 'Edited';
    inputs[2].value = JOHN_SMITH.cell + '3';
    inputs.forEach((input: HTMLInputElement) => {
      input.dispatchEvent(new Event('input'));
    });
    fixture.detectChanges();
    tick();
    expect(component.form().valid).toBeTrue();
    const resetButton = fixture.debugElement.nativeElement.querySelector(
      "button[type='button']"
    );
    expect(resetButton).toBeTruthy();
    resetButton.click();
    fixture.detectChanges();
    tick();

    // Reset should revert values back to the original values
    expect(inputs[0].value).toEqual(JOHN_SMITH.name.first);
    expect(inputs[1].value).toEqual(JOHN_SMITH.name.last);
    expect(inputs[2].value).toEqual(JOHN_SMITH.cell);
  }));

});
