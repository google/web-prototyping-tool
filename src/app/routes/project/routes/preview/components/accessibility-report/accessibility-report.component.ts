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
  EventEmitter,
  Output,
  ChangeDetectorRef,
  AfterViewInit,
  OnDestroy,
  OnInit,
} from '@angular/core';
import * as cd from 'cd-interfaces';
import { colorBlindMenu } from '../../preview.config';
import { isA11yAttrDisabled } from 'cd-common/utils';
import { PreviewInteractionService } from '../../services/preview-interaction.service';
import { Subscription } from 'rxjs';

const ACCESSIBILITY_DATA: cd.IPickerDataset = {
  id: 'accessibility-properties',
  name: 'Accessibility Properties',
  pickerType: cd.DataPickerType.A11yProps,
  value: '{}',
};

@Component({
  selector: 'app-accessibility-report',
  templateUrl: './accessibility-report.component.html',
  styleUrls: ['./accessibility-report.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccessibilityReportComponent implements OnInit, AfterViewInit, OnDestroy {
  private _subscription = new Subscription();
  private _previewParams?: cd.IPreviewParams;
  private _props?: cd.ElementPropertiesMap;
  public colorBlindMenu: cd.ISelectItem[] = colorBlindMenu;
  public dataSource = ACCESSIBILITY_DATA;
  public activeElement?: cd.PropertyModel;
  public activeElementAttrs: cd.IA11yAttr[] = [];
  public hoveredBoardRectId?: string;
  public selectionActive = false;

  @Input() homeBoardId = '';

  @Input()
  set props(props: cd.ElementPropertiesMap | undefined) {
    this._props = props;
    if (props) this.loadElements(props);
  }
  get props() {
    return this._props;
  }

  @Input()
  set previewParams(params: cd.IPreviewParams) {
    // selected element changed
    if (params.elementId !== this._previewParams?.elementId) {
      this.loadActiveElement(params?.elementId);
    }

    this._previewParams = params;
  }

  @Output() paramChange = new EventEmitter<Partial<cd.IPreviewParams>>();

  constructor(
    private _cdRef: ChangeDetectorRef,
    private _interactionService: PreviewInteractionService
  ) {}

  ngOnInit(): void {
    const { hoveredTopLevelElementId$, selectionActive$ } = this._interactionService;
    this._subscription.add(hoveredTopLevelElementId$.subscribe(this.onTopElementHover));
    this._subscription.add(selectionActive$.subscribe(this.onSelectionActive));
    this._interactionService.setSelectionActive(true);
  }

  onSelectionActive = (active: boolean) => {
    this.selectionActive = active;
    this._cdRef.markForCheck();
  };

  onTopElementHover = (id?: string) => {
    this.hoveredBoardRectId = id;
    this._cdRef.markForCheck();
  };

  ngAfterViewInit() {
    this.onInspectModeChange(true);
  }

  ngOnDestroy() {
    this._subscription.unsubscribe();
    this.onInspectModeChange(false);
    this._interactionService.setSelectionActive(false);
  }

  loadElements(props: cd.ElementPropertiesMap) {
    if (!props) return;
    const { dataSource } = this;
    const value = JSON.stringify(props, null, 1);
    this.dataSource = { ...dataSource, value };
    this.loadActiveElement(this.selectedElementId);
    this._cdRef.markForCheck();
  }

  loadActiveElement(id: string | undefined) {
    if (!this._props) return;
    this.activeElement = id ? this._props[id] : undefined;
    const attrs = this.activeElement?.a11yInputs?.ariaAttrs || [];
    this.activeElementAttrs = attrs.filter((attr: cd.IA11yAttr) => !isA11yAttrDisabled(attr));
  }

  onElementIdSelection(id: string) {
    this._interactionService.setSelectedElementId(id);
  }

  clearElementSelection() {
    this._interactionService.clearSelectedElementId();
  }

  onColorModeSelect(item: cd.SelectItemOutput) {
    const accessibilityMode = (item as cd.ISelectItem).value as unknown as cd.AccessibilityMode;
    this.paramChange.emit({ accessibilityMode });
  }

  onHighlightedElementChanged(id: string) {
    this._interactionService.setHighlightedElementId(id);
  }

  onInspectClick(mode: boolean) {
    this.onInspectModeChange(mode);
  }

  onInspectModeChange(enabled: boolean) {
    this._interactionService.setSelectionActive(enabled);
  }

  onLandmarksEnabledChange(enabled: boolean) {
    this.paramChange.emit({ landmarks: enabled });
  }

  onHeadingsEnabledChange(enabled: boolean) {
    this.paramChange.emit({ headings: enabled });
  }

  onFlowEnabledChange(enabled: boolean) {
    this.paramChange.emit({ flow: enabled });
  }

  get colorMode(): string {
    return String(this._previewParams?.accessibilityMode || cd.AccessibilityMode.Default);
  }

  get currentBoardId(): string {
    return String(this._previewParams?.id);
  }

  get selectedElementId(): string {
    return String(this._previewParams?.elementId);
  }

  get landmarksEnabled(): boolean {
    return this._previewParams?.landmarks || false;
  }

  get headingsEnabled(): boolean {
    return this._previewParams?.headings || false;
  }

  get flowEnabled(): boolean {
    return this._previewParams?.flow || false;
  }

  get greenlinesEnabled(): boolean {
    return this.flowEnabled || this.landmarksEnabled || this.headingsEnabled;
  }
}
