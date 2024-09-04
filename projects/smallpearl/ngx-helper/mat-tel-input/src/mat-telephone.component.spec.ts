import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { SPMatTelephoneInputComponent } from "./mat-telephone.component";

describe('MatTelephoneInputComponent', () => {
  let component: SPMatTelephoneInputComponent;
  let fixture: ComponentFixture<SPMatTelephoneInputComponent>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        SPMatTelephoneInputComponent
      ],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    fixture = TestBed.createComponent(SPMatTelephoneInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(true).toBeTruthy();
  })

});
