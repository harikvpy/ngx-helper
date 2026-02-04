import { Component } from '@angular/core';

import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-feedback',
    imports: [RouterModule],
    template: `
  <h2>Feedback</h2>
  <a [routerLink]="['../allmembers']" [queryParams]="{preview: 100}">Members</a>
  `,
    styles: []
})
export class FeedbackComponent {}
