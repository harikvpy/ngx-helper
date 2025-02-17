import { SPNgxHelperConfig } from '@smallpearl/ngx-helper/core';
import {
  spFormatCurrency,
  spFormatDate,
  SPIntlDateFormat,
} from '@smallpearl/ngx-helper/locale';
import { SPEntityFieldConfig } from './provider';

/**
 * This structure defines the data formatting details for a field of the
 * entity. All entity fields need not necessarily be actual entity object's
 * properties. Fields can also be computed fields, in which case the valueFn
 * should be initialized with a valid function to provide the field's value.
 */
export type SPEntityFieldSpec<TEntity extends { [P in IdKey]: PropertyKey },  IdKey extends string = 'id'> = {
  // Column name. If valueFn is not specified, this will be used as the
  // key name to retrieve the value for the column from TEntity.
  name: string;
  // If omitted, 'name' will be used as field label.
  label?: string;
  // Column value specific formatting options. Currently, only used for
  // Date types.
  valueOptions?: {
    // Specify the same format string argument that is passed to DatePipe.
    dateTimeFormat?: SPIntlDateFormat;
    // If boolean, number field will be formatted using spFormatCurrency()
    // using the current currency or 'currency' value below.
    isCurrency?: boolean;
    // Currency code, if different from default locale.
    currency?: string;
    // CSS class name; if provided will be applied to field value's wrapper
    // element. This will be <td> & <th>.
    class?: string;
    // Alignment options. Field's value will be aligned based on this.
    alignment?: 'start'|'center'|'end';
    // A fixed string or a function that returns an array of strings
    // to be used as the routerlink for the column value.
    routerLink?: ((e: TEntity) => string[])|[string];
  };
  // If the column value cannot be derived by simple TEntity[name] lookup,
  // use this function to return a custom computed or formatted value.
  valueFn?: (item: TEntity) => string | number | Date | boolean;
};

/**
 * A class that represents a SPEntityFieldSpec<>. This is typically used
 * by the library to evaluate a SPEntityFieldSpec<> object.
 */
export class SPEntityField<TEntity extends { [P in IdKey]: PropertyKey }, IdKey extends string = 'id'> {
  public _fieldSpec!: SPEntityFieldSpec<TEntity, IdKey>;

  constructor(
    spec: SPEntityFieldSpec<TEntity, IdKey> | string,
    public helperConfig: SPNgxHelperConfig,
    public fieldConfig?: SPEntityFieldConfig
  ) {
    if (typeof spec === 'string') {
      this._fieldSpec = {
        name: spec,
      };
    } else {
      this._fieldSpec = spec;
    }
  }

  get spec() {
    return this._fieldSpec;
  }

  /**
   * Returns the effective fieldValueOptions by merging the global field
   * options (if one has been spefified) with the local field value options.
   * @returns SPEntityFieldSpec<any>['valueOptions']
   */
  get options() {
    let globalFieldValueOptions: SPEntityFieldSpec<any>['valueOptions'] = {};
    if (this.fieldConfig?.fieldValueOptions && this.fieldConfig.fieldValueOptions.has(this._fieldSpec.name)) {
      globalFieldValueOptions = this.fieldConfig.fieldValueOptions.get(this._fieldSpec.name);
    }
    return {
      ...globalFieldValueOptions,
      ...(this._fieldSpec?.valueOptions ?? {})
    };
  }
  /**
   * @returns the label for the field.
   */
  label() {
    return this.helperConfig.i18nTranslate(
      this._fieldSpec.label ?? this._fieldSpec.name
    );
  }

  /**
   * Given an entity, returns the value of the field matching the
   * SPEntityFieldSpec<> in fieldSpec.
   * @param entity TEntity instance which will be evaluated for
   * SPEntityFieldSpec<>.
   * @returns
   */
  value(entity: TEntity) {
    let val = undefined;
    if (!this._fieldSpec.valueFn) {
      if (
        this.fieldConfig?.fieldValueFns &&
        this.fieldConfig.fieldValueFns.has(this._fieldSpec.name)
      ) {
        val = this.fieldConfig.fieldValueFns.get(this._fieldSpec.name)!(entity, this._fieldSpec.name);
      } else {
        val = (entity as any)[this._fieldSpec.name];
      }
    } else {
      val = this._fieldSpec.valueFn(entity);
    }
    const valueOptions = this.options;
    if (val instanceof Date) {
      val = spFormatDate(val);
    } else if (
      typeof val === 'number' &&
      valueOptions?.isCurrency
    ) {
      val = spFormatCurrency(val, this._fieldSpec?.valueOptions?.currency);
    } else if (typeof val === 'boolean') {
      val = val ? '✔' : '✖';
    }
    return val;
  }

  /**
   * If specified, will be added to the CSS classes of the field's wrapper
   * element.
   */
  get class() {
    return this._fieldSpec?.valueOptions?.class ?? '';
  }

  hasRouterLink(entity: TEntity) {
    return !!this._fieldSpec?.valueOptions?.routerLink;
  }

  getRouterLink(entity: TEntity) {
    const rl = this._fieldSpec?.valueOptions?.routerLink;
    if (rl) {
      if (typeof rl == 'function') {
        return rl(entity);
      }
      return rl
    }
    return [];
  }
}
