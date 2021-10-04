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
import { AbstractOverlayControllerDirective, OverlayService, ConfirmationDialogComponent, } from 'cd-common';
// prettier-ignore
import { Component, ChangeDetectionStrategy, Input, ViewChild, ElementRef, Output, EventEmitter, OnChanges } from '@angular/core';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { createNewDefaultInput } from '../../code-comp.config';
import { menuFromDesignSystemAttributes } from 'cd-common/utils';
import { AnalyticsEvent } from 'cd-common/analytics';
import * as cd from 'cd-interfaces';

const DELETE_DETAILS = {
  title: 'Delete input?',
  message: 'This will remove the corresponding control from the properties panel.',
};

@Component({
  selector: 'app-inputs-panel-content',
  templateUrl: './inputs-panel-content.component.html',
  styleUrls: ['./inputs-panel-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputsPanelContentComponent
  extends AbstractOverlayControllerDirective
  implements OnChanges
{
  private _inputs: cd.IPropertyGroup[] = [];
  private _outputs: cd.IOutputEvent[] = [];
  protected _designSystem?: cd.IDesignSystem;
  public colorMenuData: ReadonlyArray<cd.ISelectItem> = [];
  public animateNextChange = false;
  public animateEnabled = false;

  @Input()
  set inputs(value: cd.IPropertyGroup[]) {
    this._inputs = value || [];
  }
  get inputs(): cd.IPropertyGroup[] {
    return this._inputs;
  }

  @Input()
  set outputs(value: cd.IOutputEvent[]) {
    this._outputs = value || [];
  }
  get outputs(): cd.IOutputEvent[] {
    return this._outputs;
  }

  @Input() disabled = false;
  @Input() datasetsMenuItems: cd.ISelectItem[] = [];

  @Input()
  set designSystem(value: cd.IDesignSystem | undefined) {
    this._designSystem = value;
    if (value) this.generateColorMenu(value);
  }
  get designSystem(): cd.IDesignSystem | undefined {
    return this._designSystem;
  }

  @Output() inputsChange = new EventEmitter<cd.IPropertyGroup[]>();
  @Output() defaultValueChange = new EventEmitter<[string, cd.PropertyValue]>();

  @ViewChild('inputListRef', { read: ElementRef }) inputList?: ElementRef;

  constructor(public overlayService: OverlayService, private analyticsService: AnalyticsService) {
    super(overlayService);
  }

  ngOnChanges() {
    if (this.animateNextChange) {
      this.animateEnabled = true;
      this.animateNextChange = false;
    } else {
      this.animateEnabled = false;
    }
  }

  trackByFn(_idx: number, input: cd.IPropertyGroup) {
    return input.id;
  }

  generateColorMenu(designSystem: cd.IDesignSystem) {
    this.colorMenuData = menuFromDesignSystemAttributes(
      designSystem.colors,
      cd.SelectItemType.Color
    );
  }

  onAddInput() {
    if (this.disabled) return;
    this.analyticsService.logEvent(AnalyticsEvent.CodeComponentInputAdded);
    const { inputs } = this;
    const newInput = createNewDefaultInput(inputs);
    const updatedInputs = [newInput, ...inputs];

    this.animateNextChange = true;
    this.inputsChange.emit(updatedInputs);
  }

  onUpdate(index: number, updatedInput: cd.IPropertyGroup) {
    const { inputs } = this;
    this.analyticsService.logEvent(AnalyticsEvent.CodeComponentInputUpdated);

    // Emit a separate event if default value changed, so we can update test panel
    const currentInput = inputs[index];
    if (currentInput.defaultValue !== updatedInput.defaultValue) {
      const { name, defaultValue } = updatedInput;
      this.defaultValueChange.emit([name as string, defaultValue as cd.PropertyValue]);
    }

    const updatedInputs = [...inputs];
    updatedInputs[index] = updatedInput;
    this.inputsChange.emit(updatedInputs);
  }

  moveInputInList(e: CdkDragDrop<cd.IPropertyGroup[]>) {
    const { inputs } = this;
    const updatedInputs = [...inputs];
    moveItemInArray(updatedInputs, e.previousIndex, e.currentIndex);
    this.inputsChange.emit(updatedInputs);
  }

  onDelete(index: number) {
    const cmpRef = this.showModal<ConfirmationDialogComponent>(ConfirmationDialogComponent);
    cmpRef.instance.title = DELETE_DETAILS.title;
    cmpRef.instance.message = DELETE_DETAILS.message;
    cmpRef.instance.confirm.subscribe(() => this.onDeleteConfirm(index));
  }

  private onDeleteConfirm = (index: number) => {
    const { inputs } = this;
    this.analyticsService.logEvent(AnalyticsEvent.CodeComponentInputDeleted);

    const updatedInputs = inputs.filter((_input, i) => i !== index);
    this.inputsChange.emit(updatedInputs);
  };
}
