# MatFileInput

A file input control, that shows the file's thumbnail, if the selected file is
an image files. Supported image files are PNG, JPEG, GIF & WEBP.

# Dependencies

* Angular
  - ReactiveFormsModule
* Material
  - MatIconModule
  - MatFormFieldModule

# How to use

For the reactive form:-

  ```
  form: FormGroup = formBuilder.group({
    image: [imageUrl, Validators.required]
  })
  ```

Place the component inside a mat-form-field element as below:

  ```
  <mat-form-field class="w-100 pb-0" [formGroup]="createUpdateForm">
    <qq-mat-file-input
      formControlName="image"
      accept="image/jpeg,image/png,image/gif"
      class="w-100"
    ></qq-mat-file-input>
    <mat-hint>{{ 'communityImageHint' | transloco }}</mat-hint>
  </mat-form-field>
  ```

This will display an input control which the user can click (or tap) to select
a file from the local machine. The selected file will be loaded into a `File`
object, which will be set as the value of `form.controls['image']`.

This also marks the parent form's state as `touched`.

# Inputs
The control provides the follwing inputs:

| Input  | Desc |
|--------|-------------------------------------------------------- |
| accept | File mime types, to be accepted in the file open dialog. Defaults to all files. |
| imageFile | If set to true, set's accept to common image file types. |
| thumbnailImageUrl | URL to the file thumbnail, if its different from the control's value. |
| multiple | Wheter to select a single file or multiple files. Defaults to false. |
| placeholder | Place holder string, displayed if control doesn't have a value. |
| required | If the control input is required. |
| disabled | If the control is disabled. |

# Events
This control does not raise any events.

# Notes
The control's current value may be initialized to the full URL of the existing
file. In this case, if the URL is for an image file (determined by its
extension) and if the `thumbnailImageUrl` property is not set, then that will be
used as the thumbnail image for the file.
