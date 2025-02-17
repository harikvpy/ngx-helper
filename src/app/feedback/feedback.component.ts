import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-feedback',
    imports: [CommonModule, RouterModule],
    template: `
  <h2>Feedback</h2>
  <a [routerLink]="['../allmembers']" [queryParams]="{preview: 100}">Members</a>
  `,
    styles: []
})
export class FeedbackComponent {}
