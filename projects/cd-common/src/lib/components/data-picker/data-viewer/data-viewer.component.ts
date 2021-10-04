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
  Input,
  ChangeDetectorRef,
  EventEmitter,
  Output,
  ViewChild,
  OnInit,
  Optional,
  Inject,
  ElementRef,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { lookupValueInData, validateKeysInData } from 'cd-common/utils';
import { IPickerDataset, DataPickerType, IDataBoundValue } from 'cd-interfaces';
import { DATA_FORMATTER_TOKEN, IDataFormatterService } from '../../../formatter.token';
import { DataTreeComponent } from '../data-tree/data-tree.component';
import { OverlayService } from '../../overlay/overlay.service';
import { Subscription } from 'rxjs';

const DATA_TREE_FOOTER_HEIGHT = 48;
const MAX_CHAR_LEN = 20;
const FOCUS_TIMEOUT = 60;

@Component({
  selector: 'cd-data-viewer',
  templateUrl: './data-viewer.component.html',
  styleUrls: ['./data-viewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataViewerComponent implements OnInit, AfterViewInit, OnDestroy {
  private _subscription = Subscription.EMPTY;
  public isValid = true;
  public hasValidBinding = true;
  public latestValidatedData?: any;
  public showWarning = false;

  @Input() filterElementIds: string[] = [];
  @Input() selection?: IDataBoundValue;
  @Input() data?: IPickerDataset;
  @Input() editing = false;
  @Input() showBackButton = true;
  @Input() fullscreen = false;

  @Output() fullscreenChange = new EventEmitter<boolean>();
  @Output() back = new EventEmitter<void>();
  @Output() selectedLookupPathChange = new EventEmitter<string | undefined>();
  @Output() dataChange = new EventEmitter<IPickerDataset>();
  @Output() hoveredIdChange = new EventEmitter<string>();

  @ViewChild('dataTreeRef', { read: DataTreeComponent, static: false })
  _treeRef?: DataTreeComponent;

  @ViewChild('textAreaRef', { read: ElementRef, static: false })
  _textArea?: ElementRef;

  constructor(
    private _cdRef: ChangeDetectorRef,
    private _overlayService: OverlayService,
    @Optional()
    @Inject(DATA_FORMATTER_TOKEN)
    private _formatterService: IDataFormatterService | undefined
  ) {}

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }

  ngAfterViewInit(): void {
    this.focusOnTextArea();
  }

  focusOnTextArea() {
    setTimeout(() => {
      const { textArea } = this;
      if (!textArea) return;
      const len = textArea.value.length ?? 0;
      const startPos = len < MAX_CHAR_LEN ? len - 2 : 0;
      textArea.setSelectionRange(startPos, startPos);
      textArea.focus();
    }, FOCUS_TIMEOUT);
  }

  ngOnInit(): void {
    this._subscription = this._overlayService.prepareForClose.subscribe(this.handlePrepareForClose);

    // ignore binding validation if coming from the data panel
    if (!this.showBackButton) return;
    const { data, selection } = this;
    const dataSourceId = data?.id;
    const dataValue = data?.value;
    const lookupPath = selection?.lookupPath;
    const selectionId = selection?._$coDatasetId;

    if (selectionId && !dataSourceId) {
      return this.handleRemovedDataSource();
    }

    if (!dataValue || !lookupPath) return;
    if (selectionId !== dataSourceId) return;
    const parsed = this.validateJSON(dataValue);
    const isRoot = selectionId === lookupPath;
    this.hasValidBinding = isRoot ? true : validateKeysInData(parsed, lookupPath);
    this._cdRef.markForCheck();
  }

  handleRemovedDataSource() {
    this.hasValidBinding = false;
    this._cdRef.markForCheck();
  }

  get textArea(): HTMLTextAreaElement | undefined {
    return this._textArea?.nativeElement;
  }

  get doesDataSourceMatchSelection(): boolean | undefined {
    return !this.selectedLookupPath || this.data?.id === this.selection?._$coDatasetId;
  }

  get dataTreeFooterHeight(): number {
    return this.selectedLookupPath ? DATA_TREE_FOOTER_HEIGHT : 0;
  }

  get canEdit(): boolean {
    return this.data?.pickerType !== DataPickerType.ProjectElements;
  }

  get selectedLookupPath(): string | undefined {
    return this.selection?.lookupPath;
  }

  goBack() {
    this.back.emit();
  }

  onEditData() {
    if (this.editing) {
      this.onCommitUpdate();
      return;
    }

    this.editing = !this.editing;
    if (this.editing) this.focusOnTextArea();
  }

  clearSelection() {
    this.updateSelection();
  }

  updateSelection(lookupPath?: string) {
    this.selectedLookupPathChange.emit(lookupPath);
  }

  validateJSON(stringValue: string) {
    try {
      return JSON.parse(stringValue);
    } catch (e) {
      return false;
    }
  }

  validateWithoutFormatter(text: string) {
    const validatedData = this.validateJSON(text);
    this.isValid = validatedData !== false;
    this.latestValidatedData = validatedData;
    this._cdRef.markForCheck();
  }

  async validateWithFormatter(text: string) {
    const formatted = await this._formatterService?.formatJSON(text);
    const validFormatting = formatted !== false;
    const validData = validFormatting && this._formatterService?.validateJSON(formatted as string);
    this.isValid = validData !== false;
    this.latestValidatedData = validData || '';
    this._cdRef.markForCheck();
  }

  validateTextarea(e: Event) {
    const textarea = e?.currentTarget as HTMLInputElement;
    const value = textarea.value;
    if (!this._formatterService) return this.validateWithoutFormatter(value);
    this.validateWithFormatter(value);
  }

  validateSelection(data: any, lookupPath?: string): boolean {
    return !!lookupValueInData(data, lookupPath);
  }

  onUpdateBinding() {
    this.updateSelection();
    this.hasValidBinding = true;
    this.goBack();
  }

  onInputChange(e: Event) {
    this.validateTextarea(e);
  }

  onSelectedIdChange(value: string) {
    this.updateSelection(value);
  }

  scrollToSelected(animated?: boolean) {
    this._treeRef?.scrollIntoView(animated);
  }

  onHoverId(id: string) {
    this.hoveredIdChange.emit(id);
  }

  onFullScreenToggle() {
    const fullscreen = !this.fullscreen;
    this.fullscreenChange.emit(fullscreen);
    if (fullscreen) this.focusOnTextArea();
  }

  resetValidationIfDataIsUndefined(): boolean {
    if (!this.isValid || !this.latestValidatedData) {
      this.isValid = true; // reset
      return true;
    }
    return false;
  }

  handlePrepareForClose = () => {
    if (!this.editing) return this._overlayService.detachAndClose();
    if (!this.isValid) return this.showInvalidWarning();
    this.handleDataUpdate();
    this._overlayService.detachAndClose();
  };

  handleDataUpdate() {
    const { data, latestValidatedData, selectedLookupPath } = this;
    const value = JSON.stringify(latestValidatedData, null, 1);
    const update = <IPickerDataset>{ ...data, value };
    const currentSelectionValid = this.validateSelection(latestValidatedData, selectedLookupPath);
    this.dataChange.emit(update);
    if (!currentSelectionValid) this.clearSelection();
  }

  onClose() {
    this._overlayService.detachAndClose();
  }

  onFixWarning() {
    this.showWarning = false;
    this._cdRef.markForCheck();
    this.focusOnTextArea();
  }

  onIgnoreWarning() {
    this.showWarning = false;
    this.editing = false;
    this._cdRef.markForCheck();
  }

  showInvalidWarning() {
    this.showWarning = true;
    this._cdRef.markForCheck();
  }

  onCommitUpdate() {
    if (!this.isValid) return this.showInvalidWarning();
    this.editing = false;
    const { data, latestValidatedData, selectedLookupPath } = this;
    const value = JSON.stringify(latestValidatedData, null, 1);
    const update = <IPickerDataset>{ ...data, value };
    const currentSelectionValid = this.validateSelection(latestValidatedData, selectedLookupPath);

    this.dataChange.emit(update);
    if (!currentSelectionValid) this.clearSelection();
  }
}
