/*
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// prettier-ignore
import { Component, ChangeDetectionStrategy, Output, EventEmitter, OnDestroy, Input, ChangeDetectorRef, OnInit, } from '@angular/core';
import { AbstractOverlayContentDirective, OverlayInitService } from 'cd-common';
import { UploadService } from 'src/app/routes/project/services/upload/upload.service';
import { storagePathForCodeComponentBundle } from 'src/app/utils/storage.utils';
import { tagNameValidator } from 'src/app/routes/project/utils/tagname.utils';
import { INPUT_VALIDATION_DEBOUNCE_TIME } from 'cd-common/consts';
import { createCodeComponent } from 'cd-common/utils';
import { debounceTime } from 'rxjs/operators';
import { Subject, Subscription } from 'rxjs';
import * as config from 'src/app/routes/project/configs/custom-component.config';
import * as cd from 'cd-interfaces';
import { createId } from 'cd-utils/guid';

const NAME_REQUIRED_ERROR: cd.IRichTooltip = { text: 'Code component name is required' };

@Component({
  selector: 'app-code-components-modal',
  templateUrl: './code-components-modal.component.html',
  styleUrls: ['./code-components-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodeComponentsModalComponent
  extends AbstractOverlayContentDirective
  implements OnDestroy, OnInit
{
  private _subscriptions = new Subscription();
  private _nameValidation$ = new Subject<string>();
  private _tagNameValidation$ = new Subject<string>();

  public file?: File;
  public fileSizeErrorMessage?: string;
  public GUIDE_URL = config.GUIDE_URL;
  public nameErrorText?: cd.IRichTooltip;
  public STARTER_PROJECTS_URL = config.STARTER_PROJECTS_URL;
  public tagName = '';
  public tagNameErrorText?: cd.IRichTooltip;
  public tagNameHelpText = config.TAG_NAME_HELP_TEXT;
  public title = '';
  public uploadInProgress = false;
  public uploadProgress = 0;

  @Input() projectId?: string;
  // Once everything is successful, emit out with ID of code component record
  @Output() confirm = new EventEmitter<cd.ICodeComponentDocument>();
  @Output() cancel = new EventEmitter<void>();

  get nextDisabled() {
    return (
      !this.title ||
      !this.tagName ||
      !this.file ||
      this.fileSizeErrorMessage ||
      this.nameErrorText ||
      this.tagNameErrorText
    );
  }

  constructor(
    public overlayInit: OverlayInitService,
    private uploadService: UploadService,
    private cdRef: ChangeDetectorRef
  ) {
    super(overlayInit);
  }

  ngOnInit(): void {
    const nameDebounce$ = this._nameValidation$.pipe(debounceTime(INPUT_VALIDATION_DEBOUNCE_TIME));
    const tagNameDebounce$ = this._tagNameValidation$.pipe(
      debounceTime(INPUT_VALIDATION_DEBOUNCE_TIME)
    );
    this._subscriptions.add(nameDebounce$.subscribe(this.validateName));
    this._subscriptions.add(tagNameDebounce$.subscribe(this.validateTagName));
  }

  ngOnDestroy() {
    this._subscriptions.unsubscribe();
  }

  onFileRefChange(files: FileList | File[]) {
    if (!files.length) return;
    this.file = files[0];
    this.validateFile(this.file);
  }

  onNext() {
    const { projectId, file } = this;
    if (!projectId || !file) return;
    const { title, tagName, onUploadProgress, onUploadComplete, onUploadError } = this;
    // Double check that all fields are valid before proceeding since there can be a slight
    // delay in disabling the next button due to the debounce
    const nameValid = this.validateName(title);
    const tagNameValid = this.validateTagName(tagName);
    const fileValid = this.validateFile(file);
    if (!nameValid || !tagNameValid || !fileValid) return;
    // Create a separate id and unique path for the file. This enables multiple code component documents
    // referencing this same same JS file which will occur when a project id duplicated.
    const id = createId();
    const uploadPath = storagePathForCodeComponentBundle(id, file.name);

    this.uploadInProgress = true;
    this.uploadService.uploadFile(
      file,
      uploadPath,
      onUploadComplete,
      onUploadError,
      onUploadProgress
    );
  }

  onUploadProgress = (progress: number) => {
    this.uploadProgress = progress;
    this.cdRef.markForCheck();
  };

  onUploadComplete = (filePath: string) => {
    const { projectId, title, tagName } = this;
    if (!projectId || !title || !tagName) return;
    const id = createId();
    const codeCmp = createCodeComponent(id, projectId, title, tagName, filePath);
    this.uploadProgress = 100;
    this.cdRef.markForCheck();

    // Complete progress bar animation before closing modal
    setTimeout(() => {
      this.confirm.emit(codeCmp);
    }, 200);
  };

  onUploadError = (e: any) => {
    console.error(e);
    this.uploadInProgress = false;
    this.cdRef.markForCheck();
  };

  onCancel() {
    this.cancel.emit();
  }

  onNameInput(e: Event) {
    const { value } = e.target as HTMLInputElement;
    this.title = value;
    this._nameValidation$.next(value);
  }

  onTagNameInput(e: Event) {
    const { value } = e.target as HTMLInputElement;
    this.tagName = value;
    this._tagNameValidation$.next(value);
  }

  private validateName = (name: string): boolean => {
    const isValid = !!name;
    this.nameErrorText = isValid ? undefined : NAME_REQUIRED_ERROR;
    this.cdRef.markForCheck();
    return isValid;
  };

  private validateTagName = (tagName: string): boolean => {
    const [isValid, errorText] = tagNameValidator(tagName);
    this.tagNameErrorText = errorText;
    this.cdRef.markForCheck();
    return isValid;
  };

  private validateFile = (file?: File) => {
    const isValid = !!(file && file.size <= config.FILE_SIZE_LIMIT);
    this.fileSizeErrorMessage = isValid ? undefined : config.FILE_SIZE_LIMIT_ERROR;
    this.cdRef.markForCheck();
    return isValid;
  };
}
