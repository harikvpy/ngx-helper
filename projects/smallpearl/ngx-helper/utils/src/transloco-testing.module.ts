import { TranslocoTestingModule, TranslocoTestingOptions } from '@jsverse/transloco';

const en = {};
const de = {};
const zhHant = {};

export function getTranslocoModule(langs?: any, options: TranslocoTestingOptions = {}) {
  return TranslocoTestingModule.forRoot({
    langs: langs ?? { en, de, zhHant },
    translocoConfig: {
      availableLangs: ['en', 'de', 'zhHant'],
      defaultLang: 'en',
    },
    preloadLangs: true,
    ...options,
  });
}
