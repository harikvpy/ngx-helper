import { ComponentRef } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
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

  it('should show menu items on click', fakeAsync(() => {
    const menuItems: SPContextMenuItem[] = [
      {
        label: 'Edit',
        role: 'edit',
      },
      {
        label: 'Delete',
        role: 'delete',
      },
    ];
    // Test with menuItems as an array of SPContextMenuItem
    componentRef.setInput('menuItems', menuItems);
    fixture.detectChanges()
    const items = fixture.debugElement.nativeElement.querySelectorAll('button');
    items[0].click();
    fixture.detectChanges()
    const menuButtons1 = document.querySelector('div.mat-mdc-menu-content')!.children;
    expect(menuButtons1.length).toEqual(menuItems.length);

    // Test with menuItems as a function returning an array of SPContextMenuItem
    const fn = () => menuItems;
    componentRef.setInput('menuItems', fn);
    fixture.detectChanges()
    fixture.debugElement.nativeElement.querySelectorAll('button');
    items[0].click();
    fixture.detectChanges()
    // await new Promise(res => setTimeout(res, 100));
    const menuButtons2 = document.querySelector('div.mat-mdc-menu-content')!.children;
    expect(menuButtons2.length).toEqual(menuItems.length);

  }));
});
