import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Subject, takeUntil } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [RouterModule, TranslocoModule],
  template: ` <router-outlet></router-outlet> `,
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'ui-components';
  destroy$ = new Subject<void>();

  constructor(private t: TranslocoService)  {
  }

  ngOnInit() {
    const lang = 'en';
    this.t.selectTranslation(lang).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      console.log(`${lang} loaded, testString: ${this.t.translate('testString')}`);
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
