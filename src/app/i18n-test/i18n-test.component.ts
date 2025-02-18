import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { setSPLocaleConfig, SPDatePipe, SPCurrencyPipe } from '@smallpearl/ngx-helper/locale';
import { BehaviorSubject } from 'rxjs';

@Component({
    selector: 'app-i18n-test',
    imports: [CommonModule, RouterModule, SPCurrencyPipe, SPDatePipe],
    template: `
    <h2>i18n Pipes Test</h2>
    <div class="p-1">
    <label for="locale">Locale: </label>
    <select name="locale" id="id_locale" (change)="onLocaleChange($event)">
        <option value="en-US">English (US)</option>
        <option value="en-UK">English (UK)</option>
        <option value="en-IN">English (IN)</option>
        <option value="zh-TW">Chinese (Taiwan)</option>
        <option value="ja-JP">Japanese</option>
      </select>
      <br/>
      <label for="currency">Currency: </label>
      <select name="currency" id="id_currency" (change)="onCurrencyChange($event)">
        <option value="INR">Indian Rupee</option>
        <option value="USD">US Dollar</option>
        <option value="CAD">Canadian Dollar</option>
        <option value="TWD">New Taiwan Dollar</option>
        <option value="JPY">Japanese Yen</option>
        <option value="CNY">Chinese Yuan</option>
        <option value="EUR">Euro</option>
      </select>
      <br/>
      <label for="dateFormat">Date Format: </label>
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
      <br/>

      @if (refresh$ | async) {
        <h4>Currency pipe</h4>
        Amount1: {{ amount1 | spCurrency }}<br/>
        Amount2: {{ amount2 | spCurrency }}<br/>
        <br/>
        <h4>Date pipe</h4>
        Date1: {{ date1 | spDate }}<br/>
        Date2: {{ date2 | spDate }}
      }
    </div>
  `,
    styles: [`
  .p-1 {
    padding: .4em;
  }
  select {
    border-color: lightgray;
    border-radius: 4px;
    padding: 0.3em;
    margin: 0.2em;
  }
  h4 {
    font-size: larger;
    padding: 0 0;
    margin: 6px 0;
  }
  `]
})
export class I18nTestComponent {

  amount1 = 938930490.39;
  amount2 = 4893.39738;
  date1 = new Date();
  date2 = new Date();

  refresh$ = new BehaviorSubject<boolean>(true);

  constructor(private cdr: ChangeDetectorRef) {
    this.date2.setFullYear(this.date2.getFullYear()-2);
    setSPLocaleConfig({
      locale: 'en-US',
      currency: 'INR',
      timezone: 'UTC',
      datetimeFormat: 'longTime',
    });
  }

  onLocaleChange(ev: any) {
    setSPLocaleConfig({ locale: ev.target.value });
    this.refreshValues();
  }

  onCurrencyChange(ev: any) {
    setSPLocaleConfig({ currency: ev.target.value });
    this.refreshValues();
  }

  onDateFormatChange(ev: any) {
    setSPLocaleConfig({ datetimeFormat: ev.target.value });
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
