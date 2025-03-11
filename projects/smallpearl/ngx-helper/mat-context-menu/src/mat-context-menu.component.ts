import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  input,
  OnInit,
  Output,
  signal,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { RouterModule } from '@angular/router';
import { HoverDropDownDirective } from '@smallpearl/ngx-helper/hover-dropdown';

/**
 * Describes each item in the context menu.
 */
export interface SPContextMenuItem {
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
  // Whether the menu item should be disabled
  disable?: (arg: any) => boolean;
}

@Component({
    imports: [
        RouterModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        HoverDropDownDirective,
    ],
    selector: 'sp-mat-context-menu',
    template: `
    <button
      #menuTrigger
      mat-icon-button
      [matMenuTriggerFor]="contextMenu"
      hoverDropDown
      [menu]="contextMenu"
      (click)="$event.stopImmediatePropagation(); showMenu()"
    >
      @if (menuIconName()) {
      <mat-icon>{{ menuIconName() }}</mat-icon>
      }
      {{ label() }}
    </button>
    <mat-menu #contextMenu="matMenu" [hasBackdrop]="hasBackdrop()">
      @for (menuItem of _menuItems(); track $index) {
        @if (menuItem.role) {
            <button
              mat-menu-item
              [routerLink]="menuItem.route ? menuItem.route : undefined"
              (click)="$event.preventDefault(); onSelectMenuItem(menuItem)"
              [disabled]="itemDisabled(menuItem)"
            >
              @if (menuItem.icon) {
              <mat-icon>{{ menuItem.icon }}</mat-icon>
              }
              {{ menuItem.label }}
            </button>
        } @else {
          <div style="padding: .2em 0.6em;">
            <strong>{{ menuItem.label }}</strong>
          </div>
        }
      <!-- <button
        mat-menu-item
        [routerLink]="menuItem.route ? menuItem.route : undefined"
        (click)="$event.preventDefault(); onSelectMenuItem(menuItem)"
        [disabled]="itemDisabled(menuItem)"
      >
        @if (menuItem.icon) {
        <mat-icon>{{ menuItem.icon }}</mat-icon>
        }
        {{ menuItem.label }}
      </button> -->
      }
    </mat-menu>
  `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SPMatContextMenuComponent implements OnInit {
  /**
   * The menu items to display. Refer to ContextMenuItem doc for details
   * on the menu items. This can be an array ofSPContextMenuItem objects or
   * a function that returns an array of SPContextMenuItem objects.
   * If it is a function, the function will be called with the contextData
   * as the argument when the user clicks on the menu trigger button.
   */
  menuItems = input.required<SPContextMenuItem[]|((contextData?: any) => SPContextMenuItem[])>();

  _menuItems = signal<SPContextMenuItem[]>([])
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
  enableHover = input<boolean>(false);
  /**
   * Context data for menu item disabled callback
   */
  contextData = input<any>();
  /**
   * enable menu backdrop
   */
  hasBackdrop = input<boolean>(false);
  /**
   * Event generated when use selects an item in the context menu. This event
   * is generated only if the context menu item does not specify a route to
   * activate. The string event parameter is ContextMenuItem.role property
   * value.
   */
  @Output() selected = new EventEmitter<string>();

  menuTrigger = viewChild(MatMenuTrigger);

  constructor() {}

  ngOnInit() {}

  showMenu() {
    const menuTrigger = this.menuTrigger();
    const menuItems = this.menuItems();
    if (typeof menuItems === 'function') {
      this._menuItems.set(menuItems(this.contextData()));
    } else {
      this._menuItems.set(menuItems);
    }
    if (menuTrigger) {
      menuTrigger.openMenu();
    }
  }

  onSelectMenuItem(item: SPContextMenuItem) {
    if (!item.route) {
      this.selected.emit(item?.role || item.label);
    }
  }

  itemDisabled(menuItem: SPContextMenuItem) {
    return menuItem?.disable && menuItem.disable(this.contextData());
  }
}
