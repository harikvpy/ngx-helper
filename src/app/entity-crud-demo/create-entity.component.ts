import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  selector: 'app-create-entity-demo',
  template: `
  <h2>Create Entity</h2>
  `
})

export class CreateEntityDemoComponent implements OnInit {
  constructor() { }

  ngOnInit() { }
}
