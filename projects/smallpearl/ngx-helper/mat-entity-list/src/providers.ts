import { InjectionToken } from '@angular/core';

export interface SPMatEntityListConfig {
  urlResolver?: (endpoint: string) => string;

}

export const SP_MAT_SELECT_ENTITY_CONFIG = new InjectionToken<SPMatEntityListConfig>(
    'SPMatEntityListConfig'
  );
