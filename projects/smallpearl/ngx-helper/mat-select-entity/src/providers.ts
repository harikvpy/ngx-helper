import { InjectionToken } from '@angular/core';

export interface SPMatSelectEntityConfig {
  i18n: {
    search: string;
    notFound: string;
    // Any embedded "{{ item }}" in the addItem string will be replaced
    // with entityName property value. If entityName is not specified
    // "Item" will be used as the value for "{{ item }}".
    addItem: string;
  };
}

export const SP_MAT_SELECT_ENTITY_CONFIG = new InjectionToken<SPMatSelectEntityConfig>(
    'SPMatSelectEntityConfig'
  );
