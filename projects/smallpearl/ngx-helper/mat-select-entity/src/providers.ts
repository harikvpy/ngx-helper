import { InjectionToken } from '@angular/core';

export interface SPMatSelectEntityComponentConfig {
  i18n: {
    search: string;
    notFound: string;
    addItem: string;
  };
}

export const DEFAULT_SP_MAT_SELECT_ENTITY_COMPONENT_CONFIG: SPMatSelectEntityComponentConfig =
  {
    i18n: {
      search: 'Search',
      notFound: 'Not found',
      addItem: 'Add Item',
    },
  };

export const SP_MAT_SELECT_ENTITY_COMPONENT_CONFIG =
  new InjectionToken<SPMatSelectEntityComponentConfig>(
    '_SPMatSelectEntityComponentConfig_'
  );
