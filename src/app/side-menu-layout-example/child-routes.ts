import { Routes } from '@angular/router';

export default [
  {
    path: 'posts',
    loadComponent: () =>
      import('../posts/posts.component').then((m) => m.PostsComponent),
  },
  {
    path: 'feedback',
    loadComponent: () =>
      import('../feedback/feedback.component').then((m) => m.FeedbackComponent),
  },
  {
    path: '',
    redirectTo: 'posts',
    pathMatch: 'full',
  },
] satisfies Routes;
