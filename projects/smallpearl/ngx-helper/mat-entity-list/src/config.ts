import { inject } from '@angular/core';
import { SPMatEntityListConfig } from './mat-entity-list-types';
import { SP_MAT_ENTITY_LIST_CONFIG } from './providers';

export const DefaultSPMatEntityListConfig: SPMatEntityListConfig = {
  urlResolver: (endpoint: string) => endpoint,
  paginator: undefined,
  defaultPageSize: 50,
  pageSizes: [10, 25, 50, 100],
};

/**
 * To be called from an object's constructor.
 */
export function getEntityListConfig(): SPMatEntityListConfig {
  const entityListConfig = inject(SP_MAT_ENTITY_LIST_CONFIG, {
    optional: true,
  });
  return {
    ...DefaultSPMatEntityListConfig,
    ...(entityListConfig ?? {}),
  };
}
