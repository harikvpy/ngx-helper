import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-posts',
  standalone: true,
  imports: [CommonModule],
  template: `<h2>Posts</h2> `,
  styles: [
    `
      .mt-0 {
        margin-top: 0px;
      }
      .pt-0 {
        padding-top: 0px;
      }
    `,
  ],
})
export class PostsComponent {}
