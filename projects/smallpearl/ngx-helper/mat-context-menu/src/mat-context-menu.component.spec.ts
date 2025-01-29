import { ComponentRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { SPContextMenuItem, SPMatContextMenuComponent } from './mat-context-menu.component';

describe('SPMatContextMenuComponent', () => {
  let fixture!: ComponentFixture<SPMatContextMenuComponent>;
  let component!: SPMatContextMenuComponent;
  let componentRef!: ComponentRef<SPMatContextMenuComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, SPMatContextMenuComponent],
      providers: [provideRouter([])],
    });
    fixture = TestBed.createComponent(SPMatContextMenuComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    componentRef.setInput('label', 'More');
    componentRef.setInput('enableHover', false);
  });

  it('should create', async () => {
    expect(component).toBeTruthy();
  })

  it('should show menu items on click', async () => {
    const menuItems: SPContextMenuItem[] = [
      {
        label: 'Edit',
      },
      {
        label: 'Delete',
      },
    ];
    componentRef.setInput('menuItems', menuItems);
    fixture.detectChanges()
    const items = fixture.debugElement.nativeElement.querySelectorAll('button');
    items[0].click();
    // await new Promise(res => setTimeout(res, 100));
    const menuButtons = document.querySelector('div.mat-mdc-menu-content')!.children;
    expect(menuButtons.length).toEqual(menuItems.length);
  });
});
