import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-new-invitation',
  template: `<h2>New Invitation</h2>`,
  styles: [],
})

export class NewInvitationComponent implements OnInit {
  constructor() { }

  ngOnInit() { }
}
