import { InjectionToken } from '@angular/core';
import { SPMatEntityListPaginator } from './mat-entity-list-types';

export interface SPMatEntityListConfig {
  urlResolver?: (endpoint: string) => string;
  paginator?: SPMatEntityListPaginator;
}

export const SP_MAT_ENTITY_LIST_CONFIG = new InjectionToken<SPMatEntityListConfig>(
  'SPMatEntityListConfig'
);
