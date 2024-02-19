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
        >{{ item.iconName }}</mat-icon
      >
      <i
        *ngIf="item.iconType != 'mat'"
        [class]="'menu-item-color ' + item.iconName"
      ></i>
      <span class="menu-item-color text-uppercase">{{ item.displayName }}</span>
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
export class MenuListItemComponent implements OnInit, OnDestroy, AfterViewInit {
  expanded = false;
  highlighted = false;
  @HostBinding('attr.aria-expanded') ariaExpanded = this.expanded;
  @Input() item!: NavItem;
  @Input() depth!: number;
  @Input() parent!: MenuListItemComponent;

  // All child MenuListItemComponents so that we can check each one if
  // the current url ends with the child component's NavItem.route.
  // If it does then we have to mark this component as expanded.
  @ViewChildren(MenuListItemComponent)
  children!: QueryList<MenuListItemComponent>;

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
              if (this.parent) {
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
    if (this.sub$) {
      this.sub$.unsubscribe();
    }
  }

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

  curUrlEndsWithSelfOrChildItemRoute(): boolean {
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
    return !!(this.item.route && curUrl.endsWith(this.item.route));

    // return (
    //   (this.item.route && curUrl.endsWith(this.item.route)) ||
    //   (this.item.children &&
    //     this.item.children.find(
    //       (item) => item.route && curUrl.endsWith(item.route)
    //     ))
    // );
  }

  onItemSelected(ev: Event, item: NavItem): void {
    this.dialog.closeAll();

    // Leaf menu item
    if (!item.children) {
      if (item.route) {
        this.router.navigate([item.route], { relativeTo: this.route });
      }
    } else {
      // Sub menu items, toogle the item to show/hide the children
      ev.preventDefault();
      ev.stopImmediatePropagation();
      this.expanded = !this.expanded;
      this.cdr.detectChanges();
    }
  }

  expand() {
    this.expanded = this.ariaExpanded = true;
    this.cdr.detectChanges();
    if (this.parent) {
      this.parent.expand();
    }
  }

  collapse() {
    this.expanded = this.ariaExpanded = false;
    this.cdr.detectChanges();
  }
}
