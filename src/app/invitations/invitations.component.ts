import { Component } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-invitations',
    imports: [RouterModule, MatButtonModule],
    template: `
  <h2>Invitations</h2>
    <button mat-raised-button routerLink="./new">New Invitation</button>
  `,
    styles: []
})
export class InvitationsComponent {}
