import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoService } from '@jsverse/transloco';

@Component({
    selector: 'app-sidemenu-footer',
    imports: [CommonModule],
    template: `
    <div style="text-align: center; font-size: 0.8em;">
      <select name="language" id="language" (change)="changeLanguage($event)">
        <option value="en">English</option>
        <option value="zh-hant">中文(TW)</option>
      </select>
      <br />
      <small>2.3.102</small>
    </div>
  `,
    styles: []
})
export class SidemenuFooterComponent {
  constructor(private transloco: TranslocoService) {
  }
  changeLanguage(event: any) {
    console.log(`SidemenuFooterComponent.changeLanguage - event: ${event.target.value}`);
    if (event.target.value !== this.transloco.getActiveLang()) {
      this.transloco.setActiveLang(event.target.value);
    }
  }
}
