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
        background-color: rgba(255, 255, 255, 0.3);
      }
      .busy-wheel-container {
        display: flex;
        position: relative;
        top: 0;
        height: 100%;
        width: 100%;
      }
      .wh-100 {
        width: 100%;
        height: 100%;
      }
      .busy-wheel,
      .busy-wheel:after {
        border-radius: 50%;
        width: 4em;
        height: 4em;
      }
      .busy-wheel {
        margin: auto auto;
        font-size: 8px;
        position: relative;
        text-indent: -9999em;
        border-top: 0.5em solid rgba(0, 0, 0, 0.8);
        border-right: 0.5em solid rgba(0, 0, 0, 0.8);
        border-bottom: 0.5em solid rgba(0, 0, 0, 0.8);
        border-left: 0.5em solid #ffffff;
        -webkit-transform: translateZ(0);
        -ms-transform: translateZ(0);
        transform: translateZ(0);
        -webkit-animation: load8 1.1s infinite linear;
        animation: load8 1.1s infinite linear;
      }
      @-webkit-keyframes load8 {
        0% {
          -webkit-transform: rotate(0deg);
          transform: rotate(0deg);
        }
        100% {
          -webkit-transform: rotate(360deg);
          transform: rotate(360deg);
        }
      }
      @keyframes load8 {
        0% {
          -webkit-transform: rotate(0deg);
          transform: rotate(0deg);
        }

        100% {
          -webkit-transform: rotate(360deg);
          transform: rotate(360deg);
        }
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
