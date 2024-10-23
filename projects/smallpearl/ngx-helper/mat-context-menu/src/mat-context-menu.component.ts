import { NgFor, NgIf } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  input,
  Output,
  EventEmitter,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { RouterModule } from '@angular/router';
import { HoverDropDownDirective } from '@smallpearl/ngx-helper/hover-dropdown';

/**
 * Describes each item in the context menu.
 */
export interface ContextMenuItem {
  // Menu item label
  label: string;
  // Menu icon, A material icon
  icon?: string;
  // Angular route to navigate to when the menu item is selected.
  route?: string | string[];
  // Argument to the (selected) event when this menu item is selected
  // by the user and the corresponding ContextMenuItem does not have a
  // 'route' property value.
  role?: string;
}

@Component({
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    HoverDropDownDirective,
  ],
  selector: 'sp-mat-context-menu',
  template: `
    <button
      #menuTrigger="matMenuTrigger"
      mat-icon-button
      [matMenuTriggerFor]="contextMenu"
      hoverDropDown
      [menu]="contextMenu"
      [hoverTrigger]="disableHover() ? null : menuTrigger"
    >
      @if (menuIconName()) {
      <mat-icon>{{ menuIconName() }}</mat-icon>
      }
      {{ label() }}
    </button>
    <mat-menu #contextMenu="matMenu" hasBackdrop="false">
      @for (menuItem of menuItems(); track $index) {
      <button
        mat-menu-item
        [routerLink]="menuItem.route ? menuItem.route : undefined"
        (click)="$event.preventDefault(); onSelectMenuItem(menuItem)"
      >
        @if (menuItem.icon) {
        <mat-icon>{{ menuItem.icon }}</mat-icon>
        }
        {{ menuItem.label }}
      </button>
      }
    </mat-menu>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SPMatContextMenuComponent implements OnInit {
  /**
   * The menu items to display. Refer to ContextMenuItem doc for details
   * on the menu items.
   */
  menuItems = input.required<ContextMenuItem[]>();
  /**
   * Label to display for the context menu. If omitted will just show the
   * menuIcon.
   */
  label = input<string>('');
  /**
   * Button icon. defaults to more_vert.
   */
  menuIconName = input<string>('more_vert');
  /**
   * By default the context menu is activated whenever the mouse cursor hovers
   * over the button. Set this to 'true' to disable this feature.
   */
  disableHover = input<boolean>(false);
  /**
   * Event generated when use selects an item in the context menu. This event
   * is generated only if the context menu item does not specify a route to
   * activate. The string event parameter is ContextMenuItem.role property
   * value.
   */
  @Output() selected = new EventEmitter<string>();

  constructor() {}

  ngOnInit() {}

  onSelectMenuItem(item: ContextMenuItem) {
    if (!item.route) {
      this.selected.emit(item?.role || item.label);
    }
  }
}
