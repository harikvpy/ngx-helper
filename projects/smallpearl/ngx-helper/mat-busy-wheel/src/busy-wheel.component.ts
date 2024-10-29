import { Component, ElementRef, input, OnDestroy, OnInit } from '@angular/core';

@Component({
  selector: 'sp-mat-busy-wheel',
  template: `
    <div class="busy-wheel-wrapper">
      <span>
        <div class="busy-wheel-container" id="{{ wheelId() }}">
          <!--
          We can replace mat-spinner with the following div, which will
          remove the MatProgressSpinnerModule dependency. But the downside is
          that the spinner will not follow the global material theme.
          <div class="busy-wheel"></div>
          -->
          <mat-spinner mode="indeterminate" diameter="32"></mat-spinner>
        </div>
      </span>
    </div>
  `,
  styles: [
    `
      .busy-wheel-wrapper {
        position: absolute;
        top: 0;
        left: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        z-index: 9999999;
        background-color: rgba(255, 255, 255, 0.35);
      }
      .busy-wheel-container {
        display: flex;
        position: relative;
        top: 0;
        height: 100%;
        width: 100%;
      }
    `
  ]
})
export class SPMatBusyWheelComponent implements OnInit, OnDestroy {
  wheelId = input('id_busy-wheel');
  viewport = input(false);

  constructor(public elRef: ElementRef) {}

  ngOnInit() {}

  ngOnDestroy() {}
}
