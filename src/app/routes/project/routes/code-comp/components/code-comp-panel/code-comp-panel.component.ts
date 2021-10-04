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
import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, ChangeDetectorRef, OnDestroy, OnInit } from '@angular/core';
import { TAG_NAME_HELP_TEXT } from 'src/app/routes/project/configs/custom-component.config';
import { sizeConfig } from '../../../../configs/root-element.properties.config';
import { tagNameValidator } from 'src/app/routes/project/utils/tagname.utils';
import { CodeCompPanelState } from '../../code-comp.interfaces';
import { debounceTime } from 'rxjs/operators';
import { selectFiles } from 'cd-utils/files';
import { Subject, Subscription } from 'rxjs';
import { prefixUrlWithHTTPS } from 'cd-utils/url';
import * as config from '../../../../configs/outlet-frame.config';
import * as consts from 'cd-common/consts';
import * as cd from 'cd-interfaces';

const DESC_EMPTY_MESSAGE = 'Click to add a description.';

@Component({
  selector: 'app-code-comp-panel',
  templateUrl: './code-comp-panel.component.html',
  styleUrls: ['./code-comp-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodeCompPanelComponent implements OnDestroy, OnInit {
  private _tagNameValidation$ = new Subject<string>();
  private _subscriptions = new Subscription();

  public sizeConfig = sizeConfig;
  public maxBoardSize = config.OUTLET_FRAME_MAX_SIZE;
  public minBoardSize = config.OUTLET_FRAME_MIN_SIZE;
  public ImporterState = CodeCompPanelState;
  public PublishType = cd.PublishType;
  public PropertyGroupType = consts.PropertyGroupType;
  public descriptionEmptyStateMessage = DESC_EMPTY_MESSAGE;
  public tagNameHelpText = TAG_NAME_HELP_TEXT;
  public tagNameErrorText?: cd.IRichTooltip;

  @Input() userCanEdit = false;
  @Input() codeComponent?: cd.ICodeComponentDocument;
  @Input() designSystem?: cd.IDesignSystem;
  @Input() panelState: CodeCompPanelState = CodeCompPanelState.Default;
  @Input() jsBundleMetadata?: cd.IFirebaseStorageFileMetadata;
  @Input() datasetsMenuItems: cd.ISelectItem[] = [];

  @Output() panelChange = new EventEmitter<CodeCompPanelState>();
  @Output() componentChange = new EventEmitter<Partial<cd.ICodeComponentDocument>>();
  @Output() inputDefaultValueChange = new EventEmitter<[string, cd.PropertyValue]>();
  @Output() updateJSBundle = new EventEmitter<File>();
  @Output() downloadJsBundle = new EventEmitter<void>();

  constructor(private _cdRef: ChangeDetectorRef) {}

  ngOnInit(): void {
    const validate$ = this._tagNameValidation$.pipe(
      debounceTime(consts.INPUT_VALIDATION_DEBOUNCE_TIME)
    );
    this._subscriptions.add(validate$.subscribe(this.validateTagName));
  }

  ngOnDestroy() {
    this._subscriptions.unsubscribe();
  }

  onStateChange(state: CodeCompPanelState) {
    if (this.panelState === state) return;
    this.panelState = state;
    this.panelChange.emit(state);
  }

  onFrameSizeChange(partialFrame: Partial<cd.ILockingRect>) {
    const currentFrame = this.codeComponent?.frame;
    if (!currentFrame) return;
    const frame = { ...currentFrame, ...partialFrame };
    this.componentChange.emit({ frame });
  }

  onIconChange(icon: string, oldIcon: string | undefined) {
    if (icon === oldIcon) return;
    this.componentChange.emit({ icon });
  }

  onChildrenAllowedChange(childrenAllowed: boolean) {
    this.componentChange.emit({ childrenAllowed });
  }

  onPreventResizeChange(value: boolean) {
    const preventResize = !value;
    this.componentChange.emit({ preventResize });
  }

  onTagNameChange(value: cd.InputValueType) {
    const tagName = value as string;
    if (!this.validateTagName(tagName)) return;
    this.componentChange.emit({ tagName });
  }

  onTitleChange(value: cd.InputValueType) {
    const title = value as string;
    this.componentChange.emit({ title });
  }

  onInputsChange(properties: cd.IPropertyGroup[]) {
    this.componentChange.emit({ properties });
  }

  onDefaultValueChange(change: [string, cd.PropertyValue]) {
    this.inputDefaultValueChange.emit(change);
  }

  onOutputsChange(outputs: cd.IOutputProperty[]) {
    this.componentChange.emit({ outputs });
  }

  onFontListChange(fontList: cd.IFontFamily[]) {
    this.componentChange.emit({ fontList });
  }

  onDescriptionChange(value: cd.InputValueType) {
    const description = value as string;
    this.componentChange.emit({ description });
  }

  onRepositoryURLChange(value: cd.InputValueType) {
    const repositoryUrl = prefixUrlWithHTTPS(value as string);
    this.componentChange.emit({ repositoryUrl });
  }

  onUpdateJsBundle = async () => {
    const files = await selectFiles([cd.FileMime.JS], false);
    if (!files?.length) return;
    const newFile = files[0];
    this.updateJSBundle.emit(newFile);
  };

  onDownloadJsBundle = () => {
    this.downloadJsBundle.emit();
  };

  requestTagNameValidation(inputEvent: Event) {
    const { value } = inputEvent.target as HTMLInputElement;
    this._tagNameValidation$.next(value);
  }

  private validateTagName = (tagName: string): boolean => {
    const [isValid, errorText] = tagNameValidator(tagName, this.codeComponent?.tagName);
    this.tagNameErrorText = errorText;
    this._cdRef.markForCheck();
    return isValid;
  };
}
