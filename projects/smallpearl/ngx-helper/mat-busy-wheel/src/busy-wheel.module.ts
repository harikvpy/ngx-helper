import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SPMatBusyWheelComponent } from './busy-wheel.component';
import { SPMatHostBusyWheelDirective } from './host-busy-wheel.directive';

@NgModule({
  declarations: [SPMatHostBusyWheelDirective, SPMatBusyWheelComponent],
  imports: [CommonModule, MatProgressSpinnerModule],
  exports: [SPMatHostBusyWheelDirective, SPMatBusyWheelComponent],
  providers: [],
})
export class SPBusyWheelModule {}
