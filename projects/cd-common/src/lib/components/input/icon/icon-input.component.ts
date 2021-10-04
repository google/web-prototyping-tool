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
  ElementRef,
  ChangeDetectionStrategy,
  Input,
  OnDestroy,
  EventEmitter,
  Output,
  ComponentRef,
  HostBinding,
  ChangeDetectorRef,
} from '@angular/core';
import { OverlayService } from '../../overlay/overlay.service';
import { IconPickerComponent } from '../../icon-picker/icon-picker.component';
import { InputCollectionDirective } from '../abstract/abstract.input.collection';
import { ISelectItem, SelectedIcon, IIconOptionsConfig } from 'cd-interfaces';
import { IconStyle, ICON_STYLE_CLASSES } from 'cd-themes';

const OFFSET_X = -20;

@Component({
  selector: 'cd-icon-input',
  templateUrl: './icon-input.component.html',
  styleUrls: ['./icon-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [OverlayService],
})
export class IconInputComponent extends InputCollectionDirective implements OnDestroy {
  private _componentRef?: ComponentRef<IconPickerComponent>;

  @Input() defaultIcon = 'add_box';
  @Input() value = '';
  @Input() bottomLabel?: string;
  @Input() disabled = false;
  @Input() options?: IIconOptionsConfig;

  @Output() action = new EventEmitter<ISelectItem>();

  get icon() {
    return this.value || this.defaultIcon;
  }

  @Input() iconClass = ICON_STYLE_CLASSES[IconStyle.MATERIAL_ICONS_FILLED];

  constructor(
    private _overlayService: OverlayService,
    private _cdRef: ChangeDetectorRef,
    protected _elemRef: ElementRef
  ) {
    super(_elemRef);
  }

  ngOnDestroy(): void {
    this.cleanupComponentRef();
  }

  onIconPickSubscription = (icon: SelectedIcon) => {
    this.valueChange.emit(icon);
  };

  onChange(selected: ISelectItem) {
    this.valueChange.emit(selected.value);
    if (selected.action) {
      this.action.emit(selected);
    }
  }

  onRemoveChip() {
    if (this.disabled) return;
    this.valueChange.emit('');
  }

  @HostBinding('class.active')
  get pickerActive() {
    return this._componentRef !== undefined;
  }

  createIconPicker(): void {
    if (this.disabled) return;
    const [x, y] = this.getPickerPosition();
    const overlayConfig = { x: x + OFFSET_X, y };
    const componentRef = this._overlayService.attachComponent(IconPickerComponent, overlayConfig);
    const { instance } = componentRef;
    instance.iconClass = this.iconClass;
    instance.activeIcon = this.value;
    instance.mode = this.options?.iconPickerMode;
    instance.iconSizesAllowed = this.options?.iconSizesAllowed;
    instance.allowedIconSets = this.options?.allowedIconSets;

    const subscription = instance.pick.subscribe(this.onIconPickSubscription);
    componentRef.onDestroy(() => {
      subscription.unsubscribe();
      this._componentRef = undefined;
      this._cdRef.markForCheck();
    });
    this._componentRef = componentRef;
  }

  private cleanupComponentRef() {
    if (this._componentRef) {
      this._overlayService.close();
      this._componentRef = undefined;
    }
  }
}
