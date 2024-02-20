import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-posts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="posts-container">
      <div class="h2">Posts</div>
    </div>
  `,
  styles: [
    `
      .posts-container {
        border: 1px solid teal;
        height: 1500px;
      }
      .h2 {
        font-size: 1.3em;
        font-weight: 800;
      }
    `,
  ],
})
export class PostsComponent {}
