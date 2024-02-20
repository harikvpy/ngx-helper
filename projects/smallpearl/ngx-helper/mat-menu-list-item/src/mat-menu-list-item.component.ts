import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  Event as RouterEvent,
} from '@angular/router';
import { filter, tap } from 'rxjs';
import { NavItem } from './nav-item';

@Component({
  selector: 'qq-mat-menu-list-item',
  template: `
    <a
      mat-list-item
      [ngStyle]="{ 'padding-left': depth * 10 + 'px' }"
      [disabled]="item.disabled"
      [attr.routerLink]="!item.children ? item.route : null"
      class="menu-list-item"
      [ngClass]="{
        highlighted: this.highlighted,
        'not-highlighted': !this.highlighted
      }"
      routerLinkActive="is-active"
      (click)="onItemSelected($event, item)"
    >
      <mat-icon
        *ngIf="!item.iconType || item.iconType == 'mat'"
        class="menu-item-color"
        matListItemIcon
        >{{ item.icon }}</mat-icon
      >
      <i
        *ngIf="item.iconType != 'mat'"
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
      <qq-mat-menu-list-item
        class="menu-child"
        [ngStyle]="{ display: expanded ? 'inherit' : 'none' }"
        *ngFor="let child of item.children"
        [item]="child"
        [parent]="this"
        [depth]="depth + 1"
      ></qq-mat-menu-list-item>
    </div>
  `,
  styles: [
    `
      .menu-list-item {
        margin-right: 8px !important;
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
        background-color: var(--qq-menu-item-bg-color) !important;
        color: var(--qq-menu-item-fg-color) !important;
      }
      .highlighted {
        background-color: var(--qq-highlighted-menu-item-bg-color) !important;
        color: var(--qq-highlighted-menu-item-fg-color) !important;
      }
      .highlighted .menu-item-color {
        background-color: var(--qq-highlighted-menu-item-bg-color) !important;
        color: var(--qq-highlighted-menu-item-fg-color) !important;
      }
      .mdc-list-item {
        padding-right: 0px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('indicatorRotate', [
      state('collapsed', style({ transform: 'rotate(0deg)' })),
      state('expanded', style({ transform: 'rotate(180deg)' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4,0.0,0.2,1)')
      ),
    ]),
  ],
  standalone: true,
  imports: [CommonModule, MatIconModule, MatListModule, MatDialogModule],
})
export class QQMatMenuListItemComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  expanded = false;
  highlighted = false;
  @HostBinding('attr.aria-expanded') ariaExpanded = this.expanded;

  // The NavItem associated with this item.
  @Input() item!: NavItem;

  // This is an implementation property that is used to control with offset
  // of the menu item from the start of the screen to indicate that an item
  // is a child of a parent menu item.
  @Input() depth!: number;

  // The parent of this menu item. Set only for child items. Will be undefined
  // for top level menu items
  @Input() parent!: QQMatMenuListItemComponent;

  // All child MenuListItemComponents so that we can check each one if
  // the current url ends with the child component's NavItem.route.
  // If it does then we have to mark this component as expanded.
  @ViewChildren(QQMatMenuListItemComponent)
  children!: QueryList<QQMatMenuListItemComponent>;

  // Trap router's NavigationEnd event to change the currently select/deselect
  // MenuItem components. That is select the MenuListItem matching the newly
  // navigated to url, while deslecting the previous selection.
  private sub$ = this.router.events
    .pipe(
      filter((event: RouterEvent) => event instanceof NavigationEnd),
      tap((event: RouterEvent) => {
        const ne = event as NavigationEnd;
        const url = ne.urlAfterRedirects;
        if (this.item?.route) {
          if (url.endsWith(this.item.route)) {
            this.highlighted = true;
            if (this.parent) {
              this.parent.expand();
            }
            this.cdr.detectChanges();
          } else {
            if (this.highlighted) {
              this.highlighted = false;
              // If the item has a parent and current url is not for a sibling
              // item, collapse parent.
              if (this.parent && !this.parent.curUrlEndsWithChildItemRoute()) {
                this.parent.collapse();
              }
              this.cdr.detectChanges();
            }
          }
        }
      })
    )
    .subscribe();

  constructor(
    public route: ActivatedRoute,
    public router: Router,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {
    if (this.depth === undefined) {
      this.depth = 0;
    }
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.sub$.unsubscribe();
  }

  /**
   * We need to override this to select the correct menu item for the
   * applications starting URL.
   */
  ngAfterViewInit(): void {
    if (this.curUrlEndsWithSelfOrChildItemRoute()) {
      if (this.item?.route) {
        this.highlighted = true;
      }
      if (this.parent) {
        this.parent.expand();
      }
      this.cdr.detectChanges();
    }
  }

  /**
   * Tests if the current URL ends with the route of one of the
   * child menu item's NavItem.route.
   *
   * @returns boolean
   */
  curUrlEndsWithChildItemRoute(): boolean {
    const curUrl = this.router.routerState.snapshot.url;
    if (this.children && this.children.length) {
      if (
        this.children.find(
          (component) =>
            !!(component.item?.route && curUrl.endsWith(component.item.route))
        ) !== undefined
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Tests if the current URL ends with the route of one of the
   * child menu item's NavItem.route or this.item?.route.
   *
   * @returns boolean
   */
  curUrlEndsWithSelfOrChildItemRoute(): boolean {
    const curUrl = this.router.routerState.snapshot.url;
    return (
      this.curUrlEndsWithChildItemRoute() ||
      !!(this.item.route && curUrl.endsWith(this.item.route))
    );
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
}
