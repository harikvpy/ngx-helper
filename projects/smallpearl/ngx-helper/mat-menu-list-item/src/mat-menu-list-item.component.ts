import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostBinding,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { Router } from '@angular/router';
import { Subscription, tap } from 'rxjs';
import { NavItem } from './nav-item';
import { NavService } from './nav.service';

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
    <div *ngIf="expanded">
      <qq-mat-menu-list-item
        class="menu-child"
        *ngFor="let child of item.children"
        [item]="child"
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
export class MenuListItemComponent implements OnInit, OnDestroy {
  expanded = false;
  highlighted = false;
  @HostBinding('attr.aria-expanded') ariaExpanded = this.expanded;
  @Input() item!: NavItem;
  @Input() depth!: number;
  private sub$ = this.navService
    .getCurrentUrl()
    .pipe(
      tap((url: string) => {
        if (this.item.route) {
          const expanded = url.indexOf(`${this.item.route}`) === 0;
          const highlighted = url.localeCompare(this.item.route) == 0;
          if (expanded !== this.expanded || highlighted !== this.highlighted) {
            this.highlighted = highlighted;
            this.expanded = this.ariaExpanded = expanded;
            this.cdr.detectChanges();
          }
        }
      })
    )
    .subscribe();

  constructor(
    public navService: NavService,
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

  onItemSelected(ev: Event, item: NavItem): void {
    this.dialog.closeAll();

    if (!item.children || !item.children.length) {
      if (item.route) {
        this.router.navigate([item.route]);
      }
    }

    if (item.children && item.children.length) {
      ev.preventDefault();
      ev.stopImmediatePropagation();
      this.expanded = !this.expanded;
      this.cdr.detectChanges();
    }
  }
}
