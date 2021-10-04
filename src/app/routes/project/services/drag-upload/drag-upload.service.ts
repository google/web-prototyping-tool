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

import { Injectable, OnDestroy } from '@angular/core';
import { Subscription, fromEvent, BehaviorSubject } from 'rxjs';
import { IProjectState, getPanelsState, PanelSetActivityForced } from '../../store';
import { Store, select } from '@ngrx/store';
import { IPanelsState } from '../../interfaces/panel.interface';
import { IActivityConfig } from '../../interfaces/activity.interface';
import { PanelConfig } from '../../configs/project.config';
import { deepCopy } from 'cd-utils/object';
import { ToastsService } from 'src/app/services/toasts/toasts.service';
import { getFilesFromDrag, isFileDrag, getUrlDataFromDrag, dragContainsTypes } from 'cd-utils/drag';
import { AssetsUploadService } from '../assets/assets-upload.service';
import { DesignSystemService } from '../design-system/design-system.service';
import { ClipboardService } from '../clipboard/clipboard.service';
import { isImageMime, isJsonMime } from 'cd-utils/files';
import { FileMime, IToast } from 'cd-interfaces';

const UPLOAD_TOAST_ID = 'upload-toast';
const URL_ERROR = 'Unable to load remote asset, try downloading';

@Injectable()
export class DragUploadService implements OnDestroy {
  private _panelActivityBeforeDrag?: IActivityConfig;
  private _subscriptions = new Subscription();
  private _panelsState?: IPanelsState;

  public showDropZone$ = new BehaviorSubject<boolean>(false);
  public lastTarget: EventTarget | null = null;
  public isDragItemJson = false;

  constructor(
    private _projectStore: Store<IProjectState>,
    private _dsService: DesignSystemService,
    private _toastService: ToastsService,
    private _clipboardService: ClipboardService,
    private _assetUploadService: AssetsUploadService
  ) {
    const config = { capture: true };
    const dragEnterEvent$ = fromEvent<DragEvent>(document, 'dragenter', config);
    const dragLeaveEvent$ = fromEvent<DragEvent>(document, 'dragleave', config);
    const dropEvent$ = fromEvent<DragEvent>(document, 'drop', config);
    const dragOver$ = fromEvent<DragEvent>(document, 'dragover', config);
    const dragStart$ = fromEvent<DragEvent>(document, 'dragstart', config);

    this._subscriptions.add(dragStart$.subscribe(this.preventDefaultDrag));
    this._subscriptions.add(dragOver$.subscribe(this.preventDefaultDrag));
    this._subscriptions.add(dragEnterEvent$.subscribe(this.onDragEnter));
    this._subscriptions.add(dragLeaveEvent$.subscribe(this.onDragLeave));
    this._subscriptions.add(dropEvent$.subscribe(this.onDrop));

    const panelsState$ = this._projectStore.pipe(select(getPanelsState));
    this._subscriptions.add(panelsState$.subscribe(this.onPanelsStateSubscription));
  }

  get showDropZone(): boolean {
    return this.showDropZone$.value;
  }

  set showDropZone(show: boolean) {
    if (this.showDropZone$.value === show) return;
    this.showDropZone$.next(show);

    if (show) {
      this.showAssetsPanel();
      this.showDropToast();
    } else {
      this.hideAssetsPanel();
      this.removeToast(UPLOAD_TOAST_ID);
    }
  }

  onPanelsStateSubscription = (panelsState: IPanelsState) => {
    this._panelsState = panelsState;
  };

  private preventDefaultDrag = (e: DragEvent) => {
    e.preventDefault();
  };

  private onDragEnter = (e: DragEvent) => {
    this.lastTarget = e.target;
    this.isDragItemJson = dragContainsTypes(e, [FileMime.JSON]);
    this.showDropZone = true;
  };

  private onDragLeave = ({ target }: DragEvent) => {
    if (target === this.lastTarget || target === document) {
      this.showDropZone = false;
    }
  };

  private showDropToast() {
    const msgSuffix = this.isDragItemJson ? '' : ' image';
    const message = `Drop anywhere to upload ${msgSuffix}`;
    this.showToast({
      id: UPLOAD_TOAST_ID,
      iconName: 'cloud_upload',
      hideDismiss: true,
      message,
    });
  }

  uploadJSON(files: FileList) {
    // For now users can only upload design systems
    this._dsService.import(files[0]);
  }

  private onDrop = (e: DragEvent) => {
    e.preventDefault();
    this.showDropZone = false;
    const files = isFileDrag(e) ? Array.from(getFilesFromDrag(e) as FileList) : null;
    if (files) return this.handleFiles(files);
    const url = getUrlDataFromDrag(e);
    if (url) return this.handleURL(url);
  };

  handleFileUploadForType(file: File) {
    if (isImageMime(file.type)) return this._assetUploadService.uploadImageFile(file);
    if (isJsonMime(file.type)) return this._dsService.import(file);
  }

  handleFiles(files: File[]) {
    for (const file of files) {
      this.handleFileUploadForType(file);
    }
  }

  handleURL(_url: string) {
    this.showToast({ iconName: 'warning', message: URL_ERROR });
  }

  removeToast(toastId: string) {
    this._toastService.removeToast(toastId);
  }

  showToast(config: Partial<IToast>, toastId?: string) {
    this._toastService.addToast(config, toastId);
  }

  async uploadAsset(img: File | null | undefined, density?: number) {
    if (!img) return;
    const upload = await this._assetUploadService.uploadImageFile(img, density);
    if (!upload) return;
    this._clipboardService.pasteImage(upload.assetId, upload.metadata);
  }

  setPanelState(activity: IActivityConfig) {
    this._projectStore.dispatch(new PanelSetActivityForced(activity, {}));
  }

  hideAssetsPanel() {
    const { _panelActivityBeforeDrag } = this;
    if (!_panelActivityBeforeDrag) return;
    if (_panelActivityBeforeDrag === PanelConfig.Assets) return;
    this.setPanelState(_panelActivityBeforeDrag);
  }

  copyCurrentState(): IActivityConfig | undefined {
    const { _panelsState } = this;
    if (!_panelsState) return;
    if (!_panelsState.leftPanel.visible) return;
    if (!_panelsState.currentActivity) return;
    return deepCopy(_panelsState.currentActivity);
  }

  showAssetsPanel() {
    const { _panelsState, isDragItemJson } = this;
    if (isDragItemJson) return;
    if (!_panelsState) return;
    const state = this.copyCurrentState();
    this._panelActivityBeforeDrag = state;
    this.setPanelState(PanelConfig.Assets);
  }

  ngOnDestroy(): void {
    this.lastTarget = null;
    this._subscriptions.unsubscribe();
  }
}
