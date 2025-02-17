import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  TemplateRef,
  viewChildren
} from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { NavigationEnd, Router, Event as RouterEvent } from '@angular/router';
import { Subject, filter, takeUntil, tap } from 'rxjs';
import { LayoutService, SideMenuLayoutProps } from './layout.service';
import { SPMatMenuListItemComponent } from './mat-menu-list-item.component';
import { NavItem } from './nav-item';

@Component({
    selector: 'ngx-mat-menu-pane',
    template: `
    <div class="menu-pane-wrapper">
      <div class="sidenav-branding mat-toolbar-single-row">
        <div class="branding branding-logo">
          <img *ngIf="brandingImage" [src]="brandingImage" />
        </div>
        <h4 class="mat-typography branding branding-text">
          {{ brandingText }}
        </h4>
      </div>
      <div class="sidenav-menu">
        <div *ngIf="menuTitle" class="mat-body title">{{ menuTitle }}</div>
        <mat-nav-list>
          <ngx-mat-menu-list-item
            *ngIf="backButtonNavItem"
            [item]="backButtonNavItem"
          ></ngx-mat-menu-list-item>
          <ngx-mat-menu-list-item
            *ngFor="let item of menuItems"
            [item]="item"
            [showIcon]="showIcons"
          ></ngx-mat-menu-list-item>
        </mat-nav-list>
      </div>
      <div class="sidenav-version" *ngIf="menuPaneFooterContent">
        <ng-container *ngTemplateOutlet="menuPaneFooterContent"> </ng-container>
      </div>
    </div>
  `,
    styleUrls: ['./mat-menu-pane.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class SPMatMenuPaneComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {
  @Input() menuTitle: string = '';
  @Input() showBackButton: boolean = false;
  @Input() defaultBackButtonHref: string = '';
  @Input() backButtonText: string = 'BACK';
  @Input() menuItems: NavItem[] = [];
  @Input() brandingText: string = 'BRAND';
  @Input() brandingImage: string = '';
  @Input() matSideNav: MatSidenav | undefined;
  @Input() appVersion: string = '0.0';
  @Input() menuPaneFooterContent!: TemplateRef<any>;
  @Input() showIcons: boolean = true;
  @Input() baseUrl = '';
  layout!: SideMenuLayoutProps;

  backButtonNavItem: NavItem | undefined;
  destroy = new Subject<void>();

  menuItemComps = viewChildren(SPMatMenuListItemComponent);

  constructor(
    public cdr: ChangeDetectorRef,
    private layoutService: LayoutService,
    private router: Router
  ) {}

  ngOnInit() {
    this.layoutService.layoutChanged
      .pipe(
        takeUntil(this.destroy),
        tap((newLayout) => {
          // console.log(
          //   'Layout changed - new toolbar height:',
          //   newLayout.toolbarHeight
          // );
          this.layout = newLayout;
          this.cdr.detectChanges();
        })
      )
      .subscribe();

    if (this.showBackButton) {
      this.backButtonNavItem = {
        route: this.layoutService.previousUrl
          ? this.layoutService.previousUrl
          : this.defaultBackButtonHref,
        text: this.backButtonText,
        icon: 'arrow_back',
        backButton: true,
        backHref: window.history.state ? window.history.state['backHref'] : '#',
      };
      this.cdr.detectChanges();
    }

    this.router.events
      .pipe(
        takeUntil(this.destroy),
        filter((e) => e instanceof NavigationEnd),
        tap((e: RouterEvent) => {
          if (this.matSideNav && this.layout.smallScreen) {
            this.matSideNav.close();
          }
          const ne = e as NavigationEnd;
          this.highlightUrlMenuItem(ne.urlAfterRedirects);
        })
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy.next();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['backButtonText']) {
      if (this.backButtonNavItem) {
        this.backButtonNavItem = {
          ...this.backButtonNavItem,
          text: this.backButtonText,
        };
        this.cdr.detectChanges();
      }
    }
  }

  ngAfterViewInit(): void {
    this.highlightUrlMenuItem(this.router.routerState.snapshot.url);
  }

  /**
   * Highlights the menu item for the specified URL.
   *
   * @param url the full url of the current navigation
   *
   * The way this function works is like this.
   *
   * It first finds the NavItem matching the given URL in url arg. It does
   * this by removing the baseUrl from the url and then comparing the
   * NavItem.route attached to each SPMatMenuListItemComponent. This is done
   * recursively covering all NavItem.children. When a matching NavItem is
   * found, the function goes on to find the SPMatMenuListItemComponent which
   * has this NavItem attached to it. This too is done recursively to find
   * the innermost NavItem with matching URL.
   *
   * When a matching SPMatMenuListItemComponent is found, it first deselects
   * the previous SPMatMenuListItemComponent selection and then goes on to
   * select the newly matched SPMatMenuListItemComponent. If the
   * SPMatMenuListItemComponent is a child of a parent NavItem, the parent
   * NavItem is expanded. Similarly when deselecting the current selection,
   * if it belongs to a parent NavItem and the parent is not shared by the
   * currently matched SPMatMenuListItemComponent, it collapses the parent
   * of the previously selected SPMatMenuListItemComponent. (Quite a mouthful
   * of a sentence, but it's exactly how it works.)
   */
  highlightUrlMenuItem(url: string) {
    // Remove baseUrl from our url-to-SPMatMenuListItem matching logic
    const baseUrl = this.baseUrl.startsWith('/') ? this.baseUrl.substring(1) : this.baseUrl;
    const baseUrlIndex = url.search(baseUrl);
    if (baseUrlIndex != -1) {
      url = url.substring(baseUrlIndex+baseUrl.length);
    }

    // Filter out empty strings so that we avoid a pointless iteration of the
    // menuItemComps() array.
    const urlParts = url.split('/').filter(u => !!u);
    url = urlParts.join('/');
    // console.log(`highlightCurrentUrlMenuItem - baseUrl: ${this.baseUrl} url: ${url}, urlParts: ${urlParts}`);
    let highlightedItemFound = false;

    // Function to find the NavItem for for the given url. Returns a NavItem
    // if a matching NavItem is found, undefined otherwise.
    const findNavItemForUrl = (baseUrl: string, navItem: NavItem): NavItem|undefined => {
      let matchingItem: NavItem|undefined = undefined;
      if (navItem.children) {
        for (let index = 0; !matchingItem && index < navItem.children.length; index++) {
          matchingItem = findNavItemForUrl(baseUrl + (navItem?.route ?? ''), navItem.children[index]);
        }
      } else if (navItem.route) {
        if (url === navItem.route) {
          matchingItem = navItem;
        }
      }
      return matchingItem;
    }

    let matchingNavItem: NavItem|undefined = undefined;
    for (let index = 0; !matchingNavItem && index < this.menuItemComps().length; index++) {
      const element = this.menuItemComps()[index];
      if (element?.item) {
        matchingNavItem = findNavItemForUrl(url, element?.item);
      }
    }

    // Function to find the SPMatMenuListItemComponent for the given NavItem.
    // Returns SPMatMenuListItemComponent if a match is found, undefined
    // otherwise.
    const findMenuItemCompForNavItem = (
      menuItemComp: SPMatMenuListItemComponent,
      target: NavItem
    ): SPMatMenuListItemComponent | undefined => {
      let matchingMenuItemComp: SPMatMenuListItemComponent | undefined = undefined;
      if (menuItemComp.item === target) {
        matchingMenuItemComp = menuItemComp;
      } else if (menuItemComp.item?.children) {
        for (let index = 0; !matchingMenuItemComp && index < menuItemComp.children.length; index++) {
          matchingMenuItemComp = findMenuItemCompForNavItem(menuItemComp.children.get(index)!, target);
        }
      }
      return matchingMenuItemComp;
    };

    let matchingMenuItemComp: SPMatMenuListItemComponent | undefined = undefined;
    if (matchingNavItem) {
      for (let index = 0; !matchingMenuItemComp && index < this.menuItemComps().length; index++) {
        const element = this.menuItemComps()[index];
        matchingMenuItemComp = findMenuItemCompForNavItem(this.menuItemComps()[index], matchingNavItem);
      }
    }

    if (matchingMenuItemComp) {
      this.highlightMenuItemComp(matchingMenuItemComp);
    }

  // old logic, which is a little confusing and depends on state stored
  // in SPMatMenuListItemComponent.
  /*
    for (let index = 0; !highlightedItemFound && index < urlParts.length; index++) {
      const lastUrlSegment = urlParts[index];
      this.menuItemComps().find(menuItemComp => {
        const route = menuItemComp.item?.route;
        if (route === lastUrlSegment) {
          if (!menuItemComp.item?.children) {
            menuItemComp.toggleHighlight(true);
            highlightedItemFound = true;
          } else if (menuItemComp.checkChildrenForHighlight(lastUrlSegment)) {
            menuItemComp.expand();
            highlightedItemFound = true;
          }
        } else {
          menuItemComp.toggleHighlight(false);
          if (menuItemComp.item?.children) {
            if (menuItemComp.checkChildrenForHighlight(lastUrlSegment)) {
              menuItemComp.expand();
              highlightedItemFound = true
            };
          }
        }
      });
    }
  */
  }

  // To keep track of current highlighted SPMatMenuListItemComponent.
  private _curHighlitedMenuItemComp!: SPMatMenuListItemComponent|undefined;
  highlightMenuItemComp(menuItemComp: SPMatMenuListItemComponent) {
    // Deslect currently highliged SPMatMenuListItemComponent if it's different
    // from the menuItemComp arg.
    const lastHighlitedMenuItemComp = this._curHighlitedMenuItemComp;
    if (this._curHighlitedMenuItemComp && this._curHighlitedMenuItemComp !== menuItemComp) {
      this._curHighlitedMenuItemComp.toggleHighlight(false);
      this._curHighlitedMenuItemComp = undefined;
    }
    menuItemComp.toggleHighlight(true);
    if (lastHighlitedMenuItemComp && lastHighlitedMenuItemComp?.parent) {
      lastHighlitedMenuItemComp.parent.collapse();
    }
    if (menuItemComp.parent) {
      menuItemComp.parent.expand();
    }
    this._curHighlitedMenuItemComp = menuItemComp;
  }
}
