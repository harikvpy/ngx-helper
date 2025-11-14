import {
  AfterViewInit,
  Directive,
  EventEmitter,
  Input,
  OnDestroy,
  Output
} from '@angular/core';
import { MatSelect } from '@angular/material/select';
import { Subject } from 'rxjs';
import { delay, takeUntil } from 'rxjs/operators';
import { MatSelectInfiniteScrollService } from './mat-select-infinite-scroll.service';

/** The height of the select items in `em` units. */
const SELECT_ITEM_HEIGHT_EM = 3;

@Directive({
  selector: '[msInfiniteScroll]',
  providers: [MatSelectInfiniteScrollService],
  standalone: true,
})
export class MatSelectInfiniteScrollDirective
  implements OnDestroy, AfterViewInit
{
  @Input() threshold = '15%';
  @Input() debounceTime = 150;
  @Input() complete!: boolean;
  @Output() infiniteScroll = new EventEmitter<void>();

  private destroyed$ = new Subject<boolean>();

  constructor(
    protected matSelect: MatSelect,
    private infiniteScrollService: MatSelectInfiniteScrollService
  ) {}

  ngAfterViewInit() {
    this.matSelect.openedChange
      .pipe(
        //Wait for the panel to be rendered (https://github.com/angular/components/issues/30596)
        delay(0),
        takeUntil(this.destroyed$)
      )
      .subscribe((opened) => {
        if (opened) {
          const panel = this.matSelect.panel.nativeElement;
          const selectItemHeightPx = this.getSelectItemHeightPx(panel);
          this.infiniteScrollService.initialize(panel, selectItemHeightPx, {
            threshold: this.threshold,
            debounceTime: this.debounceTime,
            complete: this.complete,
          });

          this.infiniteScrollService.registerScrollListener(() =>
            this.infiniteScroll.emit()
          );
        }
      });
  }

  getSelectItemHeightPx(panel: Element): number {
    return parseFloat(getComputedStyle(panel).fontSize) * SELECT_ITEM_HEIGHT_EM;
  }

  ngOnDestroy() {
    this.destroyed$.next(true);
    this.destroyed$.complete();

    this.infiniteScrollService.destroy();
  }
}
