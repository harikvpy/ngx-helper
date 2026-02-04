import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { SPMatMenuLayoutComponent } from './mat-menu-layout.component';
import { SPMatMenuListItemComponent } from './mat-menu-list-item.component';
import { SPMatMenuPaneComponent } from './mat-menu-pane.component';
import { NavItem } from './nav-item';

const menuItems: NavItem[] = [
  {
    route: 'posts',
    text: 'ANNOUNCEMENTS',
    icon: 'post_add',
  },
  {
    route: 'feedback',
    text: 'FEEDBACK',
    icon: 'edit_square',
  },
];

describe('SPMatMenuLayoutComponent', () => {
  let component: SPMatMenuLayoutComponent;
  let fixture: ComponentFixture<SPMatMenuLayoutComponent>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
      imports: [
        MatSidenavModule,
        MatToolbarModule,
        MatIconModule,
        MatButtonModule,
        MatMenuModule,
        MatDialogModule,
        MatListModule,
      ],
      declarations: [
        SPMatMenuLayoutComponent,
        SPMatMenuPaneComponent,
        SPMatMenuListItemComponent,
      ],
    });

    fixture = TestBed.createComponent(SPMatMenuLayoutComponent);
    component = fixture.componentInstance;
    component.menuItems = menuItems;
    component.appTitle = 'QQDEN';
    component.brandingImage = 'assets/angular.png';
    component.brandingText = 'SMALLPEARL';
    component.contentContainerClass = 'abc-container';
    fixture.detectChanges();
  });

  afterEach(() => {
    // document.body.removeChild(fixture.nativeElement);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(fixture.debugElement.query(By.css('.branding'))).toBeTruthy();
    const logoEl = (
      fixture.debugElement.query(By.css('.branding-logo'))
        .nativeElement as HTMLElement
    ).children[0] as HTMLImageElement;
    expect(logoEl.src.endsWith('assets/angular.png')).toBeTruthy();
    expect(
      (
        fixture.debugElement.query(By.css('.branding-text'))
          .nativeElement as HTMLElement
      ).innerHTML,
    ).toContain('SMALLPEARL');
    expect(
      fixture.debugElement.query(By.directive(SPMatMenuPaneComponent)),
    ).toBeTruthy();
    expect(
      fixture.debugElement.queryAll(By.directive(SPMatMenuListItemComponent))
        .length,
    ).toEqual(2);
    // Check that contentContainerClass attribute is set
    expect(fixture.debugElement.query(By.css('.abc-container'))).toBeTruthy();
    // div with [class]='contentContainerClass' should have <router-outlet> as its only child.
    expect(
      fixture.debugElement.query(By.css('.abc-container')).children.length,
    ).toEqual(1);
    const container = fixture.debugElement.query(By.css('.abc-container'))
      .nativeElement as HTMLElement;
    expect(container.children[0].tagName).toEqual('ROUTER-OUTLET');
  });
});
