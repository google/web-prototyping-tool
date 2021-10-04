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

import {
  Component,
  ChangeDetectionStrategy,
  Output,
  Input,
  EventEmitter,
  ElementRef,
  ViewChild,
  OnDestroy,
} from '@angular/core';
import { DataPickerDirective } from 'cd-common';
import { fromEvent, Subscription } from 'rxjs';
import { copyToClipboard } from 'cd-utils/clipboard';
import { ToastsService } from 'src/app/services/toasts/toasts.service';
import * as config from '../../data-panel.config';
import * as cd from 'cd-interfaces';

@Component({
  selector: 'li[app-dataset-list-item]',
  templateUrl: './dataset-list-item.component.html',
  styleUrls: ['./dataset-list-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetListItemComponent implements OnDestroy {
  public _subscription = Subscription.EMPTY;
  public _editSubscription = Subscription.EMPTY;
  public _editing = false;

  public datasetMenuItems = config.DATASET_LIST_ITEM_MENU_DATA;

  @Input() dataset?: cd.ProjectDataset;

  @Output() rename = new EventEmitter<string>();
  @Output() duplicate = new EventEmitter<cd.ProjectDataset>();
  @Output() delete = new EventEmitter<cd.ProjectDataset>();
  @Output() replace = new EventEmitter<cd.ProjectDataset>();
  @Output() download = new EventEmitter<cd.ProjectDataset>();
  @Output() activePicker = new EventEmitter<boolean>();

  @ViewChild('nameInput', { read: ElementRef, static: true })
  nameInput!: ElementRef<HTMLInputElement>;

  @ViewChild(DataPickerDirective, { read: DataPickerDirective, static: true })
  dataPicker?: DataPickerDirective;

  constructor(private _elemRef: ElementRef, private toastsService: ToastsService) {}

  get elem() {
    return this._elemRef.nativeElement;
  }

  get inputElement(): HTMLInputElement {
    return this.nameInput.nativeElement;
  }

  get editing() {
    return this._editing;
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
    this._editSubscription.unsubscribe();
  }

  onMenuItemSelect = (menuItem: cd.IMenuConfig) => {
    // prettier-ignore
    switch (menuItem.id) {
      case config.DataSetAction.Rename:    return this.onRenameDataset();
      case config.DataSetAction.Duplicate: return this.duplicate.emit(this.dataset);
      case config.DataSetAction.Replace:   return this.replace.emit(this.dataset);
      case config.DataSetAction.Download:  return this.download.emit(this.dataset);
      case config.DataSetAction.Delete:    return this.delete.emit(this.dataset);
      case config.DataSetAction.CopyId:    return this.onCopyDatasetId();
    }
  };

  onOpenDataView = (openEditor = false) => {
    const { dataset } = this;
    if (!dataset) return;
    this.dataPicker?.createDataPickerForSingleSource(dataset.id, openEditor);
    this.activePicker.emit(true);
  };

  openDataset = () => {
    if (this._editing) return;
    this.onOpenDataView(false);
  };

  onClosePicker() {
    this.activePicker.emit(false);
  }

  onRenameDataset = () => {
    const { inputElement } = this;
    inputElement.setSelectionRange(0, inputElement.value.length);
    inputElement.focus();
    this._editSubscription = new Subscription();
    const blurEvent = fromEvent(this.inputElement, 'blur');
    const focusEvent = fromEvent(this.inputElement, 'focus');
    this._editing = true;
    this._editSubscription.add(blurEvent.subscribe(this.onBlur));
    this._editSubscription.add(focusEvent.subscribe(this.onFocus));
  };

  onCopyDatasetId = async () => {
    const { dataset } = this;
    if (!dataset) return;
    await copyToClipboard(dataset.id);
    this.toastsService.addToast({ message: config.COPY_ID_MESSAGE });
  };

  onFocus = () => {
    this._editing = true;
  };

  onBlur = () => {
    this._editing = false;
    this._editSubscription.unsubscribe();
  };

  onNameChange() {
    this.rename.emit(this.inputElement.value);
  }
}
