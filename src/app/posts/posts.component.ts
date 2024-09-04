import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SPMatSelectEntityComponent } from '@smallpearl/ngx-helper/mat-select-entity';
import { of, tap } from 'rxjs';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

/**
 */
interface User {
  id: number;
  name: string;
}

const USER_DATA = [
  { id: 1, name: 'Mariam Trevarthen' },
  { id: 2, name: 'Lanny Nathanson' },
  { id: 3, name: 'Jaye Nevin' },
  { id: 4, name: 'Cordelia Blauser' },
  { id: 5, name: 'Talisha Houk' },
  { id: 6, name: 'Kirsten Jerkins' },
  { id: 7, name: 'Kandace Oleary' },
  { id: 8, name: 'Tammara Michell' },
  { id: 9, name: 'Lily Rainwater' },
  { id: 10, name: 'Izola Silversmith' },
];

@Component({
  selector: 'app-posts',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SPMatSelectEntityComponent],
  template: `
    <div class="posts-container">
      <h2>Posts</h2>
      <div class="">
        <form [formGroup]="form">
          <sp-mat-select-entity
            [loadFromRemoteFn]="loadDataFromRemote"
            entityName="User"
            [entityLabelFn]="entityLabelFn"
            formControlName="user"
            (selectionChange)="onEntitySelected($event)"
            [multiple]="true"
            [inlineNew]="true"
          ></sp-mat-select-entity>
        </form>
      </div>
    </div>
  `,
  styles: [
    `
      .posts-container {
        height: 1500px;
      }
      .h2 {
        font-size: 1.3em;
        font-weight: 800;
      }
    `,
  ],
})
export class PostsComponent {

  loadDataFromRemote = () => {
    return of(USER_DATA);
  };
  entityLabelFn = (u: User) => u.name;
  entities = USER_DATA;
  form!: FormGroup;
  @ViewChild(SPMatSelectEntityComponent) selectEntityCtrl!: SPMatSelectEntityComponent<User>;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      user: [undefined]
    });
    this.form.valueChanges.pipe(
      tap(values => {
        console.log(`Selected user Id: ${values.user}`);
      })
    ).subscribe();

    setTimeout(() => {
      if (this.selectEntityCtrl) {
        const DET_MOOSA = {id: 100000, name: "Moosa Marikkar"};
        console.log('Adding new user after 2 secs:', DET_MOOSA.name);
        this.selectEntityCtrl.addEntity(DET_MOOSA);
        // this.form.controls['user'].setValue(DET_MOOSA.id);
      } else {
        console.log('selectEntityCtrl is not resolved.');
      }
    }, 2000);

    // setTimeout(() => {
    //   console.log('Disabling mat-select-entity');
    //   this.form.controls['user'].disable();
    // }, 5000);
  }

  onEntitySelected(ev: User|User[]) {
    console.log(`onEntitySelected - ev: ${JSON.stringify(ev)}`);
  }
}
