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
  Input,
  ChangeDetectionStrategy,
  HostBinding,
  ViewChild,
  Output,
  EventEmitter,
  Optional,
  Inject,
} from '@angular/core';
import { IDataBoundValue, IRichTooltip, InputValueType } from 'cd-interfaces';
import { RichTooltipDirective } from '../../directives/tooltip/rich-tooltip.directive';
import { AbstractDataBoundInputDirective } from '../input/abstract/abstract.data-bound-input';
import { DataPickerDirective } from '../data-picker/data-picker.directive';
import { isDataBoundValue } from 'cd-common/utils';
import { DATASET_DELIMITER } from 'cd-common/consts';
import {
  analyticsEventForDataBinding,
  ANALYTICS_SERVICE_TOKEN,
  IAnalyticsService,
} from 'cd-common/analytics';

@Component({
  selector: 'cd-input-group',
  templateUrl: './input-group.component.html',
  styleUrls: ['./input-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputGroupComponent extends AbstractDataBoundInputDirective {
  /** Assign the label for the left side */
  @Input() label?: string;
  @Input() labelTooltip?: string;
  @Input() labelRichTooltip?: IRichTooltip;
  @Input() value?: InputValueType;
  /** Assign the grid template columns for the right side */
  @Input() columns?: string;
  @Input() gap?: string;

  @Input()
  @HostBinding('style.grid-template-columns')
  leftColumns?: string;

  @Input()
  @HostBinding('class.full-width')
  fullWidth = false;

  @ViewChild(RichTooltipDirective, { static: false }) _tooltipRef?: RichTooltipDirective;
  @ViewChild(DataPickerDirective, { read: DataPickerDirective, static: true })
  dataPicker?: DataPickerDirective;

  @Output() valueChange = new EventEmitter<IDataBoundValue | null>();

  constructor(
    @Optional()
    @Inject(ANALYTICS_SERVICE_TOKEN)
    private analyticsService: IAnalyticsService | undefined
  ) {
    super();
  }

  get tooltip(): string {
    return this.labelTooltip || this.label || '';
  }

  get labelTooltipActive() {
    return this._tooltipRef?.active;
  }

  get showBindingButton() {
    return this.supportsDataBinding && !this.showChipBinding;
  }

  get showChipBinding() {
    if (!this.supportsDataBinding) return false;
    return isDataBoundValue(this.binding);
  }

  /**
   * Used to highlight the elements on the design surface
   * when hovering over a chip or data picker contents
   * */
  onElementHighlight(value: string) {
    const id = value ? value.split(DATASET_DELIMITER)?.[0] : '';
    this.activeValue.emit(id);
  }

  get binding() {
    if (!this.supportsDataBinding) return;
    return this.value as IDataBoundValue;
  }

  onShowDataPicker() {
    this.dataPicker?.createDataPicker(this.binding, this.value);
  }

  onRemoveBinding() {
    const value = this.dataPicker?.getValue(this.value as IDataBoundValue);
    this.valueChange.emit(value);
  }

  onDataBinding(value?: IDataBoundValue) {
    const update = value ?? null;

    // log analytics event for data-binding
    this.logDataBindingAnalyticsEvent(this.value, update);

    this.valueChange.emit(update);
  }

  onChipHover(e: MouseEvent) {
    const over = e.type === 'mouseenter';
    const value = String(this.binding?.lookupPath);
    if (!value) return;
    const highlight = over ? value : '';
    this.onElementHighlight(highlight);
  }

  onLabelTooltipClick(e: MouseEvent) {
    const element = e.currentTarget as HTMLElement;
    const bounds = element.getBoundingClientRect();
    this._tooltipRef?.show(bounds);
  }

  /**
   * Log analytics event if a data-binding was added, modified or removed.
   *
   * Also, include an event param for whether the data-binding was an
   * element or dataset data-binding
   */
  private logDataBindingAnalyticsEvent(prevValue?: InputValueType, newValue?: InputValueType) {
    if (!this.analyticsService) return;
    const [event, params] = analyticsEventForDataBinding(prevValue, newValue);
    if (event && params) this.analyticsService.logEvent(event, params);
  }
}
