import { Routes } from "@angular/router";

export const INVITATION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./invitations.component').then(m => m.InvitationsComponent)
  },
  {
    path: 'new',
    loadComponent: () => import('./new-invitation.component').then(m => m.NewInvitationComponent)
  }
]
