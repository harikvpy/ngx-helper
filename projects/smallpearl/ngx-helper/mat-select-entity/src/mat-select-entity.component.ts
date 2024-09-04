import { BooleanInput, coerceBooleanProperty } from '@angular/cdk/coercion';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  Self,
  ViewChild
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NgControl, ReactiveFormsModule } from '@angular/forms';
import { MAT_FORM_FIELD, MatFormField, MatFormFieldControl } from '@angular/material/form-field';
import { MatSelect, MatSelectChange, MatSelectModule } from '@angular/material/select';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  Observable,
  of,
  ReplaySubject,
  Subject,
  switchMap,
  takeUntil,
  tap
} from 'rxjs';
import { SP_MAT_SELECT_ENTITY_CONFIG, SPMatSelectEntityConfig } from './providers';

const DEFAULT_SP_MAT_SELECT_ENTITY_CONFIG: SPMatSelectEntityConfig =
  {
    i18n: {
      search: 'Search',
      notFound: 'Not found',
      addItem: 'New Item',
    },
  };

/**
 * This is a generic component to display a <mat-select> for a FK field
 * where the select's options are dynamically loaded from the server using
 * the given url (or URL). The objects thus retrieved should have a
 * unique 'id' field that will be used as the value of each `option` element.
 * Therefore upon selection of an `option` element, the `select` value will
 * be set to the object's `id` property. By default 'id' is used as its id,
 * but this can be customized by specifying the `idKey' property value.
 */
@Component({
  selector: 'sp-mat-select-entity',
  template: `
    <mat-select
      [placeholder]="placeholder"
      (opened)="onSelectOpened($event)"
      (selectionChange)="onSelectionChange($event)"
      [multiple]="multiple"
      [(ngModel)]="selectValue"
    >
      <mat-select-trigger>
        {{ selectTriggerValue }}
        @if (selectTriggerValueAsArray.length > 1) {
        <span class="addl-selection-count"> (+{{ selectTriggerValueAsArray.length - 1 }}) </span>
        }
      </mat-select-trigger>

      <mat-option>
        <ngx-mat-select-search
          [(ngModel)]="filterStr"
          (ngModelChange)="this.filter$.next($event)"
          [placeholderLabel]="searchText"
          [noEntriesFoundLabel]="notFoundText"
          [searching]="searching"
        >
        </ngx-mat-select-search>
      </mat-option>

      <span *ngIf="(filteredValues | async) as entities">
        <mat-option class="sel-entity-option" *ngFor="let entity of entities" [value]="entityId(entity)">
          {{ entityLabelFn(entity) }}
        </mat-option>
      </span>
      <mat-option *ngIf="!multiple && inlineNew" class="add-item-option" value="0" (click)="$event.stopPropagation()"
        >⊕ {{ addItemText }}</mat-option
      >
    </mat-select>
  `,
  styles: [
    `
      .add-item-option {
        padding-top: 2px;
        border-top: 1px solid gray;
      }
      .addl-selection-count {
        opacity: 0.75;
        font-size: 0.8em;
      }
    `
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatSelectModule, NgxMatSelectSearchModule],
  providers: [{ provide: MatFormFieldControl, useExisting: SPMatSelectEntityComponent }]
})
export class SPMatSelectEntityComponent<TEntity extends { [P in IdKey]: PropertyKey }, IdKey extends string = 'id'>
  implements
    OnInit,
    OnDestroy,
    AfterViewInit,
    ControlValueAccessor,
    MatFormFieldControl<string | number | string[] | number[]>
{
  @ViewChild(MatSelect) matSel!: MatSelect;

  // REQUIRED PROPERTIES //
  /**
   * Entity label function. Given an entity return its natural label
   * to display to the user.
   */
  @Input({ required: true }) entityLabelFn!: (entity: TEntity) => string;

  // OPTIONAL PROPERTIES //
  /**
   * Entity filter function - return a boolean if the entity is to be included
   * in the filtered entities list.
   * @param entity: TEntity object to test for 'search' string.
   * @param search - search string
   */
  @Input({ required: false }) entityFilterFn!: (entity: TEntity, search: string) => boolean;
  /**
   * Entity idKey, if idKey is different from the default 'id'.
   */
  @Input({ required: false }) idKey = 'id';
  /**
   * URL of the remote from where entities are to be loaded.
   * This won't be used if `loadFromRemoteFn` is specified.
   */
  @Input({ required: false }) url!: string;
  /**
   * Parameters to be added to the HTTP request to retrieve data from
   * remote. This won't be used if `loadFromRemoteFn` is specified.
   */
  @Input({ required: false }) httpParams!: HttpParams;
  /**
   * Function to load entities from remote.
   */
  @Input({ required: false }) loadFromRemoteFn!: () => Observable<TEntity[]>;

  /**
   * The entities to be displayed in the select -> option elements. Specifying
   * this is useful in two scenarios:-
   *  1. To display a limited set of values (usually one value) to reflect
   *     current value while editing an item which already has a value
   *  2. Providing entities which have been cached locally and therefore
   *     loading from remote is not required. In this case, also set
   *     doNoLoadFromRemote=true.
   */
  // @Input({ required: false }) entities: TEntity[] = [];

  @Input({ required: false }) inlineNew: boolean = false;
  @Input({ required: false }) entityName!: string;

  // Set to true to allow multiple option selection. The returned value
  // would be an array of entity ids.
  @Input({ required: false }) multiple = false;

  @Output() selectionChange = new EventEmitter<TEntity|TEntity[]>();
  @Output() createNewItemSelected = new EventEmitter<void>();

  // allow per component customization
  @Input() searchText!: string;
  @Input() notFoundText!: string;
  @Input() addItemText!: string;

  _entities = new Map<PropertyKey, TEntity>();

  stateChanges = new Subject<void>();
  focused = false;
  touched = false;

  selectValue!: string | number | string[] | number[];
  searching = false;
  filterStr: string = '';

  filter$ = new BehaviorSubject<string>('');
  // ControlValueAccessor callback
  onChanged = (_: any) => {};
  onTouched = () => {};
  @ViewChild(MatSelect) matSelect!: MatSelect;

  filteredValues = new ReplaySubject<TEntity[]>(1);
  destroy = new Subject<void>();
  private loaded = false;
  private load$ = new BehaviorSubject<boolean>(false);

  static nextId = 0;
  @HostBinding() id = `sp-select-entity-${SPMatSelectEntityComponent.nextId++}`;
  private _placeholder!: string;

  constructor(
    protected http: HttpClient,
    protected cdr: ChangeDetectorRef,
    protected _elementRef: ElementRef<HTMLElement>,
    @Optional() @Inject(MAT_FORM_FIELD) public _formField: MatFormField,
    @Optional() @Self() public ngControl: NgControl,
    @Optional() @Inject(SP_MAT_SELECT_ENTITY_CONFIG) private config: SPMatSelectEntityConfig
  ) {
    if (this.ngControl != null) {
      this.ngControl.valueAccessor = this;
    }
  }

  ngOnInit() {
    this._initStrings();
    combineLatest([this.filter$.pipe(debounceTime(400)), this.load$])
      .pipe(
        takeUntil(this.destroy),
        switchMap(([str, load]) => {
          if (load && !this.loaded) {
            this.searching = true;
            this.cdr.detectChanges();
            return this.loadFromRemote();
          } else {
            return of(this.entities ?? []);
          }
        }),
        tap(() => {
          this.filterValues(this.filterStr);
          this.cdr.detectChanges();
        })
      )
      .subscribe();
  }
  ngOnDestroy(): void {
    this.destroy.next();
    this.stateChanges.complete();
  }
  
  ngAfterViewInit(): void {
  }

  private _initStrings() {
    const config: SPMatSelectEntityConfig = this.config ?? DEFAULT_SP_MAT_SELECT_ENTITY_CONFIG;
    if (!this.searchText) { this.searchText = config.i18n.search; }
    if (!this.notFoundText) { this.notFoundText = config.i18n.notFound; }
    if (!this.addItemText) { this.addItemText = config.i18n.addItem.replace(/\{\{\s*item\s*}}/, this.entityName ?? "**Item"); }
  }

  addEntity(entity: TEntity) {
    this._entities.set((entity as any)[this.idKey], entity);
    // So that the newly added entity will be added to the <mat-option> list.
    this.filterValues(this.filterStr);
    this.cdr.detectChanges();
  }

  get selectTriggerValue() {
    if (this.selectValue) {
      const firstSelected = Array.isArray(this.selectValue) ? this.selectValue[0] : this.selectValue;
      const selectedEntity = this._entities.get(firstSelected);
      return selectedEntity ? this.entityLabelFn(selectedEntity) : '';
    }
    return '';
  }

  get selectTriggerValueAsArray() {
    return Array.isArray(this.selectValue) ? (this.selectValue as Array<string | number>) : [];
  }

  entityId(entity: TEntity) {
    return (entity as any)[this.idKey];
  }

  writeValue(entityId: string | number | string[] | number[]): void {
    if (Array.isArray(entityId)) {
      if (this.multiple) {
        const selectedValues: any[] = [];
        entityId.forEach(id => {
          if (this._entities.has(id)) {
            selectedValues.push(id);
          }
        });
        this.selectValue = selectedValues;
        this.cdr.detectChanges();
      }
    } else {
      if (this._entities.has(entityId)) {
        this.selectValue = entityId;
        if (this.filterStr) {
          this.filterStr = '';
          this.filterValues(this.filterStr);
        }
        this.cdr.detectChanges();
      }
    }
  }
  registerOnChange(fn: any): void {
    this.onChanged = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  @Input()
  get entities(): TEntity[] {
    return Array.from(this._entities.values());
  }

  set entities(items: TEntity[]) {
    items.forEach(item => {
      this._entities.set((item as any)[this.idKey], item);
    });
  }

  @Input()
  get value(): string | number | string[] | number[] {
    return this.selectValue;
  }
  set value(val: string | number | string[] | number[]) {
    this.selectValue = val;
    this.stateChanges.next();
  }
  get shouldLabelFloat() {
    return this.focused || !this.empty;
  }

  @Input('aria-describedby') userAriaDescribedBy!: string;

  @Input()
  get placeholder(): string {
    return this._placeholder;
  }
  set placeholder(value: string) {
    this._placeholder = value;
    this.stateChanges.next();
  }

  @Input()
  get required() {
    return this._required;
  }
  set required(req: boolean) {
    this._required = coerceBooleanProperty(req);
    this.stateChanges.next();
  }
  private _required = false;

  @Input()
  get disabled(): boolean {
    return this._disabled;
  }
  set disabled(value: BooleanInput) {
    const disabled = coerceBooleanProperty(value);;
    if (disabled !== this._disabled) {
      this._disabled = coerceBooleanProperty(value);
      this.setDisabledState(this._disabled);
      this.stateChanges.next();
    }
  }
  private _disabled = false;

  get empty() {
    // TODO
    return !this.value;
  }
  get errorState(): boolean {
    // TODO
    return false;
  }

  onFocusIn(event: FocusEvent) {
    if (!this.focused) {
      this.focused = true;
      this.stateChanges.next();
    }
  }

  onFocusOut(event: FocusEvent) {
    if (!this._elementRef.nativeElement.contains(event.relatedTarget as Element)) {
      this.touched = true;
      this.focused = false;
      this.onTouched();
      this.stateChanges.next();
    }
  }

  setDescribedByIds(ids: string[]) {}

  onContainerClick() {
    // this._focusMonitor.focusVia(this.countrySelect, 'program');
    // if (this.parts.controls.national.valid) {
    //   this._focusMonitor.focusVia(this.nationalInput, 'program');
    // } else if (this.parts.controls.country.valid) {
    //   this._focusMonitor.focusVia(this.nationalInput, 'program');
    // // } else if (this.parts.controls.national.valid) {
    // //   this._focusMonitor.focusVia(this.nationalInput, 'program');
    // } else {
    //   this._focusMonitor.focusVia(this.countrySelect, 'program');
    // }
  }

  setDisabledState(isDisabled: boolean): void {
    if (this.matSelect) {
      this.matSelect.setDisabledState(isDisabled);
      this.cdr.detectChanges();
    }
  }
  onSelectOpened(ev: any) {
    // If values have not been loaded from remote, trigger a load.
    if (!this.loaded) {
      this.load$.next(true); // this will trigger the loadFromRemote() call.
    }
  }
  onSelectionChange(ev: MatSelectChange) {
    // console.log('SelectionChange - sel:', ev);
    if (Array.isArray(ev.value)) {
      this.selectValue = ev.value;
      this.onTouched();
      this.onChanged(ev.value);
      const selectedEntities: TEntity[] = ev.value.map(id => this._entities.get(id)) as TEntity[];
      this.selectionChange.emit(selectedEntities);
    } else {
      if (ev.value !== '0') {
        this.selectValue = ev.value;
        this.onTouched();
        this.onChanged(ev.value);
        this.selectionChange.emit(this._entities.get(ev.value));
      } else {
        // inlineNew activated, return value to previous value
        ev.source.value = this.selectValue;
        this.createNewItemSelected.emit();
      }
    }
  }

  filterValues(search: string) {
    const searchLwr = search.toLocaleLowerCase();
    if (!this.entities) {
      return;
    }
    if (!search) {
      this.filteredValues.next(this.entities.slice());
    } else {
      this.filteredValues.next(
        this.entities.filter((member) => {
          if (this.entityFilterFn) {
            return this.entityFilterFn(member, search);
          }
          return this.entityLabelFn(member).toLocaleLowerCase().includes(searchLwr);
        })
      );
    }
  }
  loadFromRemote() {
    if (!this.url && !this.loadFromRemoteFn) {
      // If user had initialized entities, they will be dispalyed
      // in the options list. If not, options would be empty.
      return this.entities;
    }

    let obs: Observable<TEntity[]>;
    if (this.loadFromRemoteFn) {
      obs = this.loadFromRemoteFn();
    } else {
      let params!: HttpParams;
      if (this.httpParams) {
        params = new HttpParams({
          fromString: this.httpParams.toString()
        })
      } else {
        params = new HttpParams();
      }
      params = params.set('paginate', false)
      obs = this.http.get<TEntity[]>(this.url, { params });
    }
    return obs.pipe(
      tap((entities) => {
        this.searching = false; // remote loading done, will hide the loading wheel
        if (!Array.isArray(entities) && entities['results'] && Array.isArray(entities['results'])) {
          entities = entities['results'];
        }
        if (Array.isArray(entities)) {
          this.entities = entities;
        }
        this.loaded = true;
        this.cdr.detectChanges();
      })
    );
  }
}
