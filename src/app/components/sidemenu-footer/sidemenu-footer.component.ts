import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidemenu-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="text-align: center; font-size: 0.8em;">
      <select name="language" id="language">
        <option value="en">English</option>
        <option value="zh">中文</option>
      </select>
      <br />
      <small>2.3.102</small>
    </div>
  `,
  styles: [],
})
export class SidemenuFooterComponent {}
