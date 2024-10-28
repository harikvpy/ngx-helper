import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { BusyWheelModule, hideBusyWheel, showBusyWheel } from '@smallpearl/ngx-helper/mat-busy-wheel';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    BusyWheelModule,
  ],
  selector: 'app-busy-wheel-demo',
  template: `
  <h2>Busy Wheel Demo</h2>
  <div class="w-100 container">
    <div class="row">
      <div class="col-6 p-1 h-300px border rounded d-flex align-items-top justify-content-center" spHostBusyWheel="busyWheel1">
        <button mat-raised-button color="primary" (click)="onStart1()">Start</button>
      </div>
      <div class="col-6 p-1 h-300px border rounded d-flex align-items-end justify-content-center" spHostBusyWheel="busyWheel2">
      <button mat-raised-button color="primary" (click)="onStart2()">Start</button>
      </div>
    </div>
  </div>
  `,
  styles: `
  .h-300px {
    height: 300px;
  }
  `
})

export class BusyWheelDemoComponent implements OnInit {
  constructor() { }

  ngOnInit() { }

  onStart1() {
    showBusyWheel('busyWheel1');
    setTimeout(() => hideBusyWheel('busyWheel1'), 3000);
  }

  onStart2() {
    showBusyWheel('busyWheel2');
    setTimeout(() => hideBusyWheel('busyWheel2'), 3000);
  }
}
