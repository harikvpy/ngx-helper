import { SPNgxHelperConfig } from '@smallpearl/ngx-helper/core';
import {
  spFormatCurrency,
  spFormatDate,
  SPIntlDateFormat,
} from '@smallpearl/ngx-helper/locale';

/**
 * Each column is represented by a column definition.
 */
export type SPEntityFieldSpec<TEntity> = {
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
    isCurrency?: boolean; // if boolean, number field will be formatted using
    // spFormatCurrency() using the current currency or
    // numberCurrency.
    currency?: string; // currency code
    class?: string; // css class name, if provided will be applied to field
    // value's wrapper element.
  };
  // If the column value cannot be derived by simple TEntity[name] lookup,
  // use this function to return a custom computed or formatted value.
  valueFn?: (item: TEntity) => string | number | Date | boolean;
};

/**
 * A class that represents a SPEntityFieldSpec<>. This is typically used
 * by the library to evaluate a SPEntityFieldSpec<> object.
 */
export class SPEntityField<TEntity> {
  public fieldSpec!: SPEntityFieldSpec<TEntity>;

  constructor(
    spec: SPEntityFieldSpec<TEntity> | string,
    public config: SPNgxHelperConfig
  ) {
    if (typeof spec === 'string') {
      this.fieldSpec = {
        name: spec,
      };
    } else {
      this.fieldSpec = spec;
    }
  }

  /**
   * @returns the label for the field.
   */
  label() {
    return this.config.i18nTranslate(
      this.fieldSpec.label ?? this.fieldSpec.name
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
    if (!this.fieldSpec.valueFn) {
      val = (entity as any)[this.fieldSpec.name];
    } else {
      val = this.fieldSpec.valueFn(entity);
    }
    if (val instanceof Date) {
      val = spFormatDate(val);
    } else if (
      typeof val === 'number' &&
      this.fieldSpec?.valueOptions?.isCurrency
    ) {
      val = spFormatCurrency(val, this.fieldSpec?.valueOptions?.currency);
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
    return this.fieldSpec?.valueOptions?.class ?? '';
  }
}
