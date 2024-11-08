import { ChangeDetectionStrategy, Component, Inject, input, OnInit, Optional } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { SPMatEntityCrudComponentBase } from './mat-entity-crud-internal-types';
import { SPMatEntityCrudConfig } from './mat-entity-crud-types';
import { SP_MAT_ENTITY_CRUD_CONFIG } from './providers';
import { getConfig } from './default-config';

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
        <h2>{{ title() }}</h2>&nbsp;
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
export class SPMatEntityCrudPreviewPaneComponent implements OnInit {

  title = input.required<string>();
  entityCrudComponent = input.required<SPMatEntityCrudComponentBase>();
  config!: SPMatEntityCrudConfig;

  constructor(
    @Optional()
    @Inject(SP_MAT_ENTITY_CRUD_CONFIG)
    crudConfig: SPMatEntityCrudConfig,
  ) {
    this.config = getConfig(crudConfig);
  }

  ngOnInit() {}

  onClose() {
    this.entityCrudComponent().closePreview();
  }
}
