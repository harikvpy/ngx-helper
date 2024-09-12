import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogModule } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { MatListModule } from "@angular/material/list";
import { MatMenuModule } from "@angular/material/menu";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatToolbarModule } from "@angular/material/toolbar";
import { By } from "@angular/platform-browser";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { RouterTestingModule } from "@angular/router/testing";
import { SPMatMenuListItemComponent } from "./mat-menu-list-item.component";
import { SPMatMenuPaneComponent } from "./mat-menu-pane.component";
import { NavItem } from "./nav-item";
import { DebugElement } from "@angular/core";

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

describe('MatMenuPaneComponent', () => {
  let component: SPMatMenuPaneComponent;
  let fixture: ComponentFixture<SPMatMenuPaneComponent>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        RouterTestingModule,
        MatSidenavModule,
        MatToolbarModule,
        MatIconModule,
        MatButtonModule,
        MatMenuModule,
        MatListModule,
        MatDialogModule,
      ],
      declarations: [
        SPMatMenuPaneComponent, SPMatMenuListItemComponent
      ],
    }).compileComponents(); // Required as scss is specified as an external file

    fixture = TestBed.createComponent(SPMatMenuPaneComponent);
    component = fixture.componentInstance;
    component.menuItems = menuItems;
    fixture.detectChanges();
  });

  afterEach(() => {
    document.body.removeChild(fixture.nativeElement);
  })

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(fixture.debugElement.queryAll(By.directive(SPMatMenuListItemComponent)).length).toEqual(2);
  });

  it('should show back button', () => {
    document.body.removeChild(fixture.nativeElement);
    fixture = TestBed.createComponent(SPMatMenuPaneComponent);
    component = fixture.componentInstance;
    component.menuItems = menuItems;
    component.showBackButton = true;
    component.backButtonText = 'GO BACK';
    component.defaultBackButtonHref  = 'https://www.smallpearl.com';
    window.history.pushState(undefined, 'hello', window.location.origin);
    fixture.detectChanges();
    expect(component.backButtonNavItem).toBeTruthy();
    const matMenuItems = fixture.debugElement.queryAll(By.directive(SPMatMenuListItemComponent));
    expect(matMenuItems.length).toEqual(menuItems.length+1);
    const backMenuItem = matMenuItems[0];
    backMenuItem.query
  })
});
