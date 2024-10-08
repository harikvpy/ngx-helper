import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { getSPI18nConfig, setSPI18nConfig, SPCurrencyPipe } from '@smallpearl/ngx-helper/i18n';
import { BehaviorSubject } from 'rxjs';
import { SPDatePipe } from '@smallpearl/ngx-helper/i18n/src/date.pipe';

@Component({
  selector: 'app-i18n-test',
  standalone: true,
  imports: [CommonModule, RouterModule, SPCurrencyPipe, SPDatePipe],
  template: `
    <h2>i18n Pipes Test</h2>
    <div class="p-1">
      <select name="locale" id="id_locale" (change)="onLocaleChange($event)">
        <option value="en-US">English (US)</option>
        <option value="en-UK">English (UK)</option>
        <option value="en-IN">English (IN)</option>
        <option value="zh-TW">Chinese (Taiwan)</option>
        <option value="ja-JP">Japanese</option>
      </select>
      <br/>
      <select name="currency" id="id_currency" (change)="onCurrencyChange($event)">
        <option value="INR">Indian Rupee</option>
        <option value="USD">US Dollar</option>
        <option value="CAD">Canadian Dollar</option>
        <option value="JPY">Japanese Yen</option>
        <option value="CNY">Chinese Yuan</option>
        <option value="EUR">Euro</option>
      </select>
      <br/>
      <br/>
      <select name="dateFormat" id="id_dateFormat" (change)="onDateFormatChange($event)">
        <option value="short">Short</option>
        <option value="medium">Medium</option>
        <option value="long">Long</option>
        <option value="full">Full</option>
        <option value="shortDate">Short Date</option>
        <option value="mediumDate">Medium Date</option>
        <option value="longDate">Long Date</option>
      </select>
      <br/>

      @if (refresh$ | async) {
        Amount1: {{ amount1 | spCurrency }}<br/>
        Amount2: {{ amount2 | spCurrency }}<br/>
        <br/>
        Date1: {{ date1 | spDate }}<br/>
        Date2: {{ date2 | spDate }}
      }
    </div>
  `,
  styles: [`
  .p-1 {
    padding: .4em;
  }
  `],
})
export class I18nTestComponent {

  amount1 = 938930490.39;
  amount2 = 4893.39738;
  date1 = new Date();
  date2 = new Date();

  refresh$ = new BehaviorSubject<boolean>(true);

  constructor(private cdr: ChangeDetectorRef) {
    this.date2.setFullYear(this.date2.getFullYear()-2);
    setSPI18nConfig({
      locale: 'en-US',
      currency: 'INR',
      timezone: 'UTC',
      datetimeFormat: 'longTime',
    });
  }

  onLocaleChange(ev: any) {
    setSPI18nConfig({ locale: ev.target.value });
    this.refreshValues();
  }

  onCurrencyChange(ev: any) {
    setSPI18nConfig({ currency: ev.target.value });
    this.refreshValues();
  }

  onDateFormatChange(ev: any) {
    setSPI18nConfig({ datetimeFormat: ev.target.value });
    this.refreshValues();
  }

  refreshValues() {
    this.date1 = new Date(this.date1.setDate(this.date1.getDate()+1));
    this.date2 = new Date(this.date2.setDate(this.date2.getDate()+1));
    this.amount1 += Math.floor(Math.random()*1000);
    this.amount2 += Math.floor(Math.random()*1000);
    // console.log(`SPI18nConfig: ${JSON.stringify(getSPI18nConfig())}`);
    this.refresh$.next(true);
  }
}
