import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SPMatMenuLayoutComponent } from './mat-menu-layout.component';

describe('NgxMatMenuLayoutComponent', () => {
  let component: SPMatMenuLayoutComponent;
  let fixture: ComponentFixture<SPMatMenuLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SPMatMenuLayoutComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SPMatMenuLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
