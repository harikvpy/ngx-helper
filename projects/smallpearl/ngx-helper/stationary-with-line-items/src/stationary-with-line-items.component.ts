import { UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, OnInit } from '@angular/core';
import { getNgxHelperConfig } from '@smallpearl/ngx-helper/core';
import { spFormatDate } from '@smallpearl/ngx-helper/locale';
import { spFormatCurrency } from '@smallpearl/ngx-helper/locale';
import { SPEntityFieldSpec } from './stationary-types';


@Component({
  standalone: true,
  imports: [],
  selector: 'sp-string-or-object-renderer',
  template: `
    @if (isString()) {
      {{ value() }}
    } @else {
      <table>
        @for (row of objectAsArray(); track $index) {
          <tr>
            @for (col of row; track $index) {
              <td [style]="'text-align: ' + valueAlignment()">{{ col }}</td>
            }
          </tr>
        }
      </table>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StringOrObjectRendererComponent implements OnInit {
  value = input.required<any>();
  valueAlignment = input<string>()
  isString = computed(() => typeof this.value() === 'string');
  objectAsArray = computed(() => {
    const arrayValues = [];
    const value = this.value();
    if (typeof value !== 'string') {
      for (const key in this.value()) {
        const keyValue = this.value()[key];
        arrayValues.push([key, keyValue]);
      }
    }
    return arrayValues;
  });

  constructor() { }

  ngOnInit() { }
}

@Component({
  standalone: true,
  imports: [],
  selector: 'sp-fields-renderer',
  template: `
    @if (isString()) {
      {{ stringValue() }}
    } @else {
      <div class="">
        <table>
          <tbody>
          @for (field of namedFields(); track $index) {
            <tr>
              <td>{{ getFieldLabel(field) }}&colon;</td>
              <td>{{ getFieldValue(field) }}</td>
            </tr>
          }
          </tbody>
        </table>
      </div>
      <!-- @for (field of namedFields(); track $index) {
        <div class="field-values">
            {{ getFieldLabel(field) }}&colon;&nbsp;&nbsp;&nbsp;&nbsp;
            {{ getFieldValue(field) }}
        </div>
      } -->
    }
  `,
  styles: `
  .field-values {
    padding: 0.2em 0;
    text-align: end;
  }
  tr td:first-of-type {
    padding-right: 1em;
  }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FieldsRendererComponent<
  TEntity extends { [P in IdKey]: PropertyKey },
  IdKey extends string = 'id'
> implements OnInit {
  entity = input.required<TEntity>();
  fields = input.required<Array<SPEntityFieldSpec<TEntity> | string>|string|undefined>();
  namedFields = computed<SPEntityFieldSpec<TEntity>[]>(() => {
    const fields = this.fields();
    let cols: SPEntityFieldSpec<TEntity>[] = [];
    if (fields && typeof fields !== 'string') {
      fields.forEach((colDef) => {
        if (typeof colDef === 'string') {
          cols.push({ name: String(colDef) });
        } else if (typeof colDef === 'object') {
          cols.push(colDef as SPEntityFieldSpec<TEntity>);
        }
      });
    }
    return cols;
  });

  isString = computed(() => typeof this.fields() === 'string');

  // If the field is a single string, looks up entity's properties
  // for matching field name as the string and if it doesn't exist returns
  // the string itself as the value.
  stringValue = computed(() => {
    const fields = this.fields();
    if (typeof fields === 'string') {
      return (this.entity() as any)[fields] ?? fields;
    }
    return '';
  })

  ngxHelperConfig = getNgxHelperConfig();

  constructor() {
  }

  ngOnInit() { }

  getFieldLabel(field: SPEntityFieldSpec<TEntity>) {
    const label = field?.label ? field.label : field.name;
    return this.ngxHelperConfig && this.ngxHelperConfig?.i18nTranslate
      ? this.ngxHelperConfig?.i18nTranslate(label)
      : label;
  }

  getFieldValue(
    column: SPEntityFieldSpec<TEntity>
  ) {
    let val = undefined;
    if (!column.valueFn) {
      // if (
      //   this.config?.columnValueFns &&
      //   this.config.columnValueFns.has(column.name)
      // ) {
      //   val = this.config.columnValueFns.get(column.name)!(entity, column.name);
      // } else {
      //   val = (entity as any)[column.name];
      // }
      val = (this.entity() as any)[column.name];
    } else {
      val = column.valueFn(this.entity());
    }
    if (val instanceof Date) {
      return spFormatDate(val);
    } else if (typeof val === 'number' && column?.valueOptions?.isCurrency) {
      return spFormatCurrency(val, column?.valueOptions?.numberCurrency)
    } else if (typeof val === 'boolean') {
      return val ? '✔' : '✖';
    }
    return val;
  }
}

/**
 * A component that renders a stationary with line items, such as invoice,
 * payment receipt, bill, bill payment record, journal entry, etc. All these
 * documents have a uniform format and this component abstracts out the
 * information displayed in this type of document as properties that the client
 * can provide while it takes care of the rendering.
 *
 * Ideally we would declare this as a wrapper class with the actual rendering
 * to be performed by an inner replaceable component. This way the app will be
 * able to support multiple stationary designs, which eventually can be
 * chosen by the user. Perhaps even providing them a feature to design the
 * stationary.
 *
 * This is the first towards that long path ahead.
 */
@Component({
  standalone: true,
  imports: [
    UpperCasePipe,
    // StringOrObjectRendererComponent,
    FieldsRendererComponent
],
  selector: 'sp-stationary-with-line-items',
  template: `
  <div class="stationary-wrapper mat-body">
    <div class="title">{{ title() }}</div>
    @if (number()) {
      <div class="number">#{{ number() }}</div>
    }
    <div class="header">
      <div class="left-header">
        @if (leftHeader()) {
          <sp-fields-renderer
            [entity]="entity()"
            [fields]="leftHeader()"
          ></sp-fields-renderer>
          <!-- <sp-string-or-object-renderer
            [value]="leftHeader()"
          ></sp-string-or-object-renderer> -->
        }
      </div>
      <div class="right-header">
        @if (rightHeader()) {
          <sp-fields-renderer
            [entity]="entity()"
            [fields]="rightHeader()"
          ></sp-fields-renderer>
        }
      </div>
    </div> <!-- end <div class="header"> -->

    <!-- items -->
    @if (itemColumns()) {
      <div class="items">
        <table>
          <thead>
            @for (col of _itemColumns(); track $index) {
              <th>{{ getColumnLabel(col) | uppercase }}</th>
            }
          </thead>
          <tbody>
          <!-- enumerate each element of the 'items' array and render the
          specified columns for each. -->
            @for (row of _items(); track $index) {
              <tr>
              @for (col of _itemColumns(); track $index) {
                <td [innerHtml]="getItemColumnValue(row, col)"></td>
              }
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
    <!-- end items -->
    <!-- footer -->
    <div class="footer">
      <div class="left-footer">
        @if (leftFooter()) {
          <sp-fields-renderer
            [entity]="entity()"
            [fields]="leftFooter()"
          ></sp-fields-renderer>
          <!-- <sp-string-or-object-renderer
            [value]="leftFooter()"
          ></sp-string-or-object-renderer> -->
        }
      </div>
      <div class="right-footer">
        @if (rightFooter()) {
          <sp-fields-renderer
            [entity]="entity()"
            [fields]="rightFooter()"
          ></sp-fields-renderer>
          <!-- <sp-string-or-object-renderer
            [value]="rightFooter()"
          ></sp-string-or-object-renderer> -->
        }
      </div>
    </div>
  </div>
  `,
  styles: `
  .stationary-wrapper {
    padding: 2em 1em;
  }
  .title {
    font-size: 1.6em;
    font-weight: 600;
    text-align: end;
    margin-bottom: 0.5em;
  }
  .number {
    font-size: 1.1em;
    font-weight: 500;
    text-align: end;
    margin-bottom: 0.5em;
  }
  .header, .footer {
    display: flex;
    flex-direction: row;
    margin-top: 1em;
  }
  .left-header, .left-footer {
    display: flex;
    align-items: bottom;
    text-align: start;
    padding-right: 1em;
    min-width: 50%;
    overflow-wrap: break-word;
    text-wrap: wrap;
  }
  .right-header, .right-footer {
    display: flex;
    justify-content: flex-end;
    min-width: 50%;
    overflow: clip;
  }
  .items {
    margin: 2em 0;
  }
  .items table {
    width: 100%;
    border: 0px solid lightgray;
  }
  .items table thead {
    background-color: black;
    color: white;
    & th {
      padding: 0.4em;
    }
  }
  .items table td {
    padding: 0.9em;
    padding-left: 0.4em;
    border-bottom: 1px solid lightgray;
    border-right: 0px solid lightgray
  }
  .footer {

  }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StationaryWithLineItemsComponent<
  TEntity extends { [P in IdKey]: PropertyKey },
  IdKey extends string = 'id'
> implements OnInit {
  entity = input.required<TEntity>();
  title = input.required<string>();
  number = input<string|number>();
  leftHeader = input<Array<SPEntityFieldSpec<TEntity> | string>|string>();
  rightHeader = input<Array<SPEntityFieldSpec<TEntity> | string>|string>();

  items = input<{[key: string]: string}[]>();

  leftFooter = input<Array<SPEntityFieldSpec<TEntity> | string>|string>();
  rightFooter = input<Array<SPEntityFieldSpec<TEntity> | string>|string>();

  itemFieldName = input<string>('items');
  itemColumns = input<Array<SPEntityFieldSpec<TEntity> | string>>();
  _itemColumns = computed<SPEntityFieldSpec<TEntity>[]>(() => {
    let cols: SPEntityFieldSpec<TEntity>[] = [];
    const columns = this.itemColumns();
    if (columns) {
      columns.forEach((colDef) => {
        if (typeof colDef === 'string') {
          cols.push({ name: String(colDef) });
        } else if (typeof colDef === 'object') {
          cols.push(colDef as SPEntityFieldSpec<TEntity>);
        }
      });
    }
    return cols;
  });
  _items = computed(() => (this.entity() as any)[this.itemFieldName()]);

  ngxHelperConfig = getNgxHelperConfig();

  constructor() {}

  ngOnInit() {}

  getColumnLabel(column: SPEntityFieldSpec<TEntity>) {
    return this.ngxHelperConfig && this.ngxHelperConfig?.i18nTranslate
      ? this.ngxHelperConfig.i18nTranslate(column?.label || column.name)
      : column?.label || column.name;
  }

  getColumnValue(
    entity: any,
    column: SPEntityFieldSpec<TEntity>
  ) {
    let val = undefined;
    if (!column.valueFn) {
      // if (
      //   this.config?.columnValueFns &&
      //   this.config.columnValueFns.has(column.name)
      // ) {
      //   val = this.config.columnValueFns.get(column.name)!(entity, column.name);
      // } else {
      //   val = (entity as any)[column.name];
      // }
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

  getItemColumnValue(
    itemEntity: any,
    column: SPEntityFieldSpec<TEntity>
  ) {
    let val = undefined;
    if (!column.valueFn) {
      val = (itemEntity as any)[column.name];
    } else {
      val = column.valueFn(itemEntity);
    }
    if (val instanceof Date) {
      return spFormatDate(val);
    } else if (typeof val === 'number' && column?.valueOptions?.isCurrency) {
      return spFormatCurrency(val, column?.valueOptions?.numberCurrency)
    } else if (typeof val === 'boolean') {
      return val ? '✔' : '✖';
    }
    return val;
  }
}
