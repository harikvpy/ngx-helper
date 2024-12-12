import { ChangeDetectionStrategy, Component, Inject, input, OnDestroy, OnInit, Optional } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { SPMatEntityCrudComponentBase } from './mat-entity-crud-internal-types';
import { SPMatEntityCrudConfig } from './mat-entity-crud-types';
import { SP_MAT_ENTITY_CRUD_CONFIG } from './providers';
import { getEntityCrudConfig } from './default-config';

/**
 * A preview pane container to provide a consistent UX for all preview panes.
 * It consits of a toolbar on the top and a container div below that takes up
 * the rest of the preview pane area.
 */
@Component({
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule, MatIconModule],
  selector: 'sp-mat-entity-crud-preview-pane',
  template: `
  <div class="preview-wrapper">
    <mat-toolbar>
      <mat-toolbar-row>
        @if (title()) {
          <h2>{{ title() }}</h2>&nbsp;
        }
        @if (!hideUpdate()) {
          <button mat-icon-button aria-label="Edit" (click)="onEdit()" [disabled]="disableUpdate()">
            <mat-icon>edit</mat-icon>
          </button>
        }
        @if (!hideDelete()) {
          <button mat-icon-button aria-label="Delete" (click)="onDelete()" [disabled]="disableDelete()">
            <mat-icon>delete</mat-icon>
          </button>
        }
        <ng-content select="[previewToolbarContent]"></ng-content>
        <span class="spacer"></span>
        <button mat-icon-button aria-label="Close" (click)="onClose()">
          <mat-icon>close</mat-icon>
        </button>
      </mat-toolbar-row>
    </mat-toolbar>
    <div [class]="'preview-content ' + (config.previewPaneContentClass ?? '')">
      <ng-content select="[previewContent]"></ng-content>
    </div>
  </div>
  `,
  styles: [`
    .preview-wrapper {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .spacer {
      flex: 1 1 auto;
    }
    .preview-content {
      flex-grow: 1;
      overflow: scroll;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SPMatEntityCrudPreviewPaneComponent<TEntity> implements OnInit, OnDestroy {

  entity = input.required<TEntity>();
  entityCrudComponent = input.required<SPMatEntityCrudComponentBase<TEntity>>();
  title = input<string>();
  disableUpdate = input<boolean>(false);
  hideUpdate = input<boolean>(false);
  disableDelete = input<boolean>(false);
  hideDelete = input<boolean>(false);
  config!: SPMatEntityCrudConfig;

  constructor() {
    this.config = getEntityCrudConfig();
  }

  ngOnInit() {
  }

  ngOnDestroy(): void {
  }

  onEdit() {
    this.entityCrudComponent().triggerEntityUpdate(this.entity());
  }

  onDelete() {
    this.entityCrudComponent().triggerEntityDelete(this.entity());
  }

  onClose() {
    this.entityCrudComponent().closePreview();
  }
}
