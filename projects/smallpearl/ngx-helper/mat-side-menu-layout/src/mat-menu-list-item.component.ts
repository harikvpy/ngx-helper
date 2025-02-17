import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostBinding,
  Input,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { NavItem } from './nav-item';

@Component({
    selector: 'ngx-mat-menu-list-item',
    template: `
    <a
      *ngIf="item.children || item.route; else divider"
      mat-list-item
      [ngStyle]="{ 'padding-left': depth * 8 + 'px' }"
      [disabled]="item.disabled"
      [attr.routerLink]="!item.children ? item.route : null"
      class="menu-list-item pl-8"
      [ngClass]="{
        highlighted: this.highlighted,
        'not-highlighted': !this.highlighted,
      }"
      routerLinkActive="is-active"
      (click)="onItemSelected($event, item)"
    >
      <mat-icon
        *ngIf="
          (item.icon && showIcon && !item.iconType) || item.iconType == 'mat'
        "
        class="menu-item-color"
        matListItemIcon
        >{{ item.icon }}</mat-icon
      >
      <i
        *ngIf="item.icon && showIcon && item.iconType != 'mat'"
        [class]="'menu-item-color ' + item.icon"
      ></i>
      <span class="menu-item-color text-uppercase">{{ item.text }}</span>
      <span class="twistie-separator"></span>
      <span *ngIf="item.children && item.children.length">
        <mat-icon
          class="menu-twistie menu-item-color"
          [@indicatorRotate]="expanded ? 'expanded' : 'collapsed'"
        >
          expand_more
        </mat-icon>
      </span>
    </a>
    <div>
      <ngx-mat-menu-list-item
        class="menu-child"
        [showIcon]="showIcon"
        [ngStyle]="{ display: expanded ? 'inherit' : 'none' }"
        *ngFor="let child of item.children"
        [item]="child"
        [parent]="this"
        [depth]="depth + 1"
      ></ngx-mat-menu-list-item>
    </div>
    <ng-template #divider>
      <div class="menu-divider"></div>
    </ng-template>
  `,
    styles: [
        `
      .menu-list-item {
        margin-right: 8px !important;
      }
      .pl-8 {
        padding-left: 8px;
      }
      .twistie-separator {
        flex: 1 1 0%;
      }
      .routeIcon {
        margin-right: 10px;
        font-size: 16pt;
      }
      .menu-item-text {
        font-size: 10pt;
      }
      .menu-twistie {
        font-size: 10pt;
        height: 12px;
        width: 12px;
      }
      mat-icon {
        margin-left: 8px !important;
        margin-right: 8px !important;
      }
      .menu-item-color {
        background-color: var(--sp-mat-menu-menu-item-bg-color) !important;
        color: var(--sp-mat-menu-menu-item-fg-color) !important;
      }
      .highlighted {
        background-color: var(
          --sp-mat-menu-highlighted-menu-item-bg-color
        ) !important;
        color: var(--sp-mat-menu-highlighted-menu-item-fg-color) !important;
      }
      .highlighted .menu-item-color {
        background-color: var(
          --sp-mat-menu-highlighted-menu-item-bg-color
        ) !important;
        color: var(--sp-mat-menu-highlighted-menu-item-fg-color) !important;
      }
      .mdc-list-item {
        padding-right: 0px;
      }
      .menu-divider {
        height: 1em;
      }
    `,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        trigger('indicatorRotate', [
            state('collapsed', style({ transform: 'rotate(0deg)' })),
            state('expanded', style({ transform: 'rotate(180deg)' })),
            transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4,0.0,0.2,1)')),
        ]),
    ],
    standalone: false
})
export class SPMatMenuListItemComponent implements OnInit, OnDestroy {
  expanded = false;
  @Input() highlighted = false;
  @HostBinding('attr.aria-expanded') ariaExpanded = this.expanded;

  // The NavItem associated with this item.
  @Input() item!: NavItem;

  // This is an implementation property that is used to control with offset
  // of the menu item from the start of the screen to indicate that an item
  // is a child of a parent menu item.
  @Input() depth!: number;

  // The parent of this menu item. Set only for child items. Will be undefined
  // for top level menu items
  @Input() parent!: SPMatMenuListItemComponent;

  @Input() showIcon: boolean = true;

  // All child MenuListItemComponents so that we can check each one if
  // the current url ends with the child component's NavItem.route.
  // If it does then we have to mark this component as expanded.
  @ViewChildren(SPMatMenuListItemComponent)
  children!: QueryList<SPMatMenuListItemComponent>;

  constructor(
    public route: ActivatedRoute,
    public router: Router,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {
    if (this.depth === undefined) {
      this.depth = 1;
    }
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {}

  // Return highlighted status
  get isHighlighted() {
    return this.highlighted;
  }

  toggleHighlight(highlight: boolean) {
    if (highlight != this.highlighted) {
      this.highlighted = highlight;
      this.cdr.detectChanges();
    }
  }

  /**
   * Expand a parent container menu item.
   */
  expand() {
    if (!this.item?.route && !this.expanded) {
      this.expanded = this.ariaExpanded = true;
      this.cdr.detectChanges();
      if (this.parent) {
        this.parent.expand();
      }
    }
  }

  /**
   * Collapse an expanded parent container menu item.
   */
  collapse() {
    if (!this.item?.route && this.expanded) {
      this.expanded = this.ariaExpanded = false;
      this.cdr.detectChanges();
    }
  }

  checkChildrenForHighlight(lastUrlSegment: string) {
    let childHighlighted = false;
    this.children.forEach((childItem) => {
      if (childItem.item.route === lastUrlSegment) {
        childItem.toggleHighlight(true);
        childHighlighted = true;
      } else {
        childItem.toggleHighlight(false);
        if (childItem.item?.children) {
          if (childItem.checkChildrenForHighlight(lastUrlSegment)) {
            childHighlighted = true;
          }
        }
        childItem.expand(); // open the childItem
      }
    });
    return childHighlighted; // Return highlighted state so that caller can
    // expand itself.
  }

  // Item selection handler
  onItemSelected(ev: Event, item: NavItem): void {
    this.dialog.closeAll();

    // Leaf menu item, navigate the router to the item's route.
    if (!item.children) {
      if (item?.backButton && item?.backHref) {
        // Idiotic way to implement Back button! This will conflict
        // with the browser history as the current satellite app
        // page would become the previous page to backHref page! A complex
        // mechanism to navigate back accurately, by popping all the
        // intermediate pages is beyond our scope for now.
        this.router.navigateByUrl(item.backHref);
      } else if (item.route) {
        this.router.navigate([item.route], {
          relativeTo: this.route,
          state: {
            backHref: window.location.pathname,
          },
        });
      }
    } else {
      // Sub menu items, toogle the item to show/hide the child menu items.
      ev.preventDefault();
      ev.stopImmediatePropagation();
      this.expanded = !this.expanded;
      this.cdr.detectChanges();
    }
  }
}
