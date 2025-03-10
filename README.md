# ngx-helper

`NOTE: THIS LIBRARY IS UNDER ACTIVE DEVELOPMENT. EXPECT BREAKING CHANGES BETWEEN RELEASES. USE IT AT YOUR OWN RISK.`

This is a library of angular components and other utility code that are not part of the standard angular/material library. Some components are composite components in that they combile multiple standard material library widgets for a common use case scenario.

This is meant to be a private library for my own consumption. But being a project derived from open source, I'm making it a public. Consequently, documentation is lacking and unit tests are at a bare minumum. Both are areas that I hope to address, but time is working against me.

The best way to start using the components is to refer to code in the included `testapp` application. Each library feature is shown in a separate app page and can be seen by running the app (`ng serve`). The app's layout is driven by the `sp-mat-menu-layout` component which leverages material's sidemenu component to deliver a responsive hierarchical layout mechanism.

# Components

| Component      | Description      |
| ------------- | ------------- |
| `sp-mat-menu-layout` | A responsive sidemenu layout framework that consists of a top bar with app branding and title. |
| `sp-mat-select-entity`| A component to render foreignkey relationships where the entities are loaded from a remote and displayed. |
| `sp-mat-file-input` | A component that can replace the standard ugly HTML file input. |
| `sp-mat-tel-input` | A component to input telephone numbers. Numbers are validated at client using `google-libphonenumber`. |
| `sp-mat-entity-list` | A component to display a table of entities loaded from the remote. This allows the columns to be specified as entity field names or as functors that return a `string` or `number`. |
| `sp-mat-entity-crud` | A component that builds on top of `sp-mat-entity-list` providing a framework for doing CRUD operations. Note that the forms for the CRUD operations still have to be written by the consumer. However the framework provides a standard UX and a facade for common patterns such as prompting for save any changes made before navigating away, entity preview, etc. |
| `sp-mat-context-menu` | A component to display a context menu. The menu items can be organized as groups with a title. Leverages `mat-menu` for implementations. |
| `sp-mat-busy-wheel`| A component to show a spinner over any element in the page. This comes with a RxJS operator that can be added to the operator pipeline to show/hide the busy wheel when the async task is in progress. |

# Pipes

| Pipe      | Description      |
| ------------- | ------------- |
| spCurrency | A pipe to render a number as a currency value with the currency prefix. |
| spDate | A pipe to render a date as locale sensitive date string |
