import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-toolbar-title',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatMenuModule, MatIconModule],
  template: `
    <button mat-button [matMenuTriggerFor]="otherCommunitiesMenu">
      <h4 class="community-name">Signature Park</h4>
      <mat-icon iconPositionEnd>arrow_drop_down</mat-icon>
    </button>
    <mat-menu #otherCommunitiesMenu="matMenu">
      <button mat-menu-item>Cavenagh Garden</button>
      <button mat-menu-item>Cashew Heights</button>
    </mat-menu>
  `,
  styles: [
    `
      .community-name {
        font-size: 1.5em;
        font-weight: 800;
      }
    `,
  ],
})
export class ToolbarTitleComponent {}
