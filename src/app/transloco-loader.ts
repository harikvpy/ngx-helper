import { inject, Injectable } from '@angular/core';
import { Translation, TranslocoLoader } from '@jsverse/transloco';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  private http = inject(HttpClient);

  getTranslation(lang: string) {
    console.log(`TranslocoHttpLoader.getTranslation - lang: ${lang}`);
    return this.http.get<Translation>(`./assets/i18n/${lang}.json`).pipe(
      tap(translation => {
        console.log(`TranslocoHttpLoader.getTranslation - translation: ${JSON.stringify(translation, undefined, 2)}`);
      })
    );
  }
}
