import { getNgxHelperConfig } from "@smallpearl/ngx-helper/core";
import { spFormatCurrency, spFormatDate, SPIntlDateFormat } from "@smallpearl/ngx-helper/locale";

/**
 * Each column is represented by a column definition. An <ng-container matColumnDef=""></ng-container>
 * will be created for each this.fieldSpec.
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
    isCurrency?: boolean;   // if boolean, number field will be formatted using
                            // spFormatCurrency() using the current currency or
                            // numberCurrency.
    numberCurrency?: string; // currency code
    alignment?: 'start'|'center'|'end';     // defaults to inherit
  };
  // If the column value cannot be derived by simple TEntity[name] lookup,
  // use this function to return a custom computed or formatted value.
  valueFn?: (item: TEntity) => string|number|Date|boolean;
}

export class SPEntityField<TEntity> {
  public fieldSpec!: SPEntityFieldSpec<TEntity>;

  constructor(spec: SPEntityFieldSpec<TEntity>|string) {
    if (typeof spec === 'string') {
      this.fieldSpec = {
        name: spec
      }
    } else {
      this.fieldSpec = spec;
    }
  }

  label() {
    const config = getNgxHelperConfig();
    return config.i18nTranslate(
      this.fieldSpec.label ?? this.fieldSpec.name
    );
  }

  value(entity: TEntity) {
    let val = undefined;
    if (!this.fieldSpec.valueFn) {
      val = (entity as any)[this.fieldSpec.name];
    } else {
      val = this.fieldSpec.valueFn(entity);
    }
    if (val instanceof Date) {
      return spFormatDate(val);
    } else if (typeof val === 'number' && this.fieldSpec?.valueOptions?.isCurrency) {
      return spFormatCurrency(val, this.fieldSpec?.valueOptions?.numberCurrency)
    } else if (typeof val === 'boolean') {
      return val ? '✔' : '✖';
    }
    return val;
  }
}
