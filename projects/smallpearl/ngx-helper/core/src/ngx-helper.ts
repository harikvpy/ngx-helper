/** Version of the ngx-helper library */
import { inject, InjectionToken } from '@angular/core';

export interface SPNgxHelperConfig {
  i18nTranslate: (label: string, context?: any) => string;
}

export const SP_NGX_HELPER_CONFIG = new InjectionToken<SPNgxHelperConfig>(
  'SPNgxHelperConfig'
);

export function getNgxHelperConfig(): SPNgxHelperConfig {
  const defaultNgxHelperConfig: SPNgxHelperConfig = {
    i18nTranslate: (label: string, context?: any) => label
  }
  const helperConfig = inject(SP_NGX_HELPER_CONFIG)
  return {
    ...defaultNgxHelperConfig,
    ...(helperConfig ?? {}),
  }
}
