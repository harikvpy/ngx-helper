import {
  TranslocoTestingModule,
  TranslocoTestingOptions,
} from '@jsverse/transloco';
const en = {}
const de = {}
const zhHant = {}

export function getTranslocoModule(options: TranslocoTestingOptions = {}) {
  return TranslocoTestingModule.forRoot({
    langs: {
      en,
      de,
      zhHant
    },
    translocoConfig: {
      availableLangs: ['en', 'de', 'zhHant'],
      defaultLang: 'en',
    },
    preloadLangs: true,
    ...options,
  });
}
