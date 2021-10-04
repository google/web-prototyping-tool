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
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  EventEmitter,
  Output,
  ComponentRef,
  OnDestroy,
} from '@angular/core';

import * as cd from 'cd-common';
import { IStringMap, ITypographyStyle, IDesignSystem, IFontFamily } from 'cd-interfaces';
import { FontEditorComponent } from '../font-editor/font-editor.component';
import { generateIDWithLength } from 'cd-utils/guid';
import { Subscription } from 'rxjs';
import { incrementNameForDesignSystemCategory } from '../../utils/theme.utils';
import { ColorType, ROBOTO_FONT, TextType, sortDesignSystemValues } from 'cd-themes';
import { FontWeight } from 'cd-metadata/fonts';

const OFFSET_OVERLAY_TOP = 120;
const OFFSET_OVERLAY_LEFT = 90;
const DEFAULT_CONFIG = {
  name: 'Custom Type',
  size: 12,
  fontId: ROBOTO_FONT,
  weight: FontWeight.Regular,
  color: {
    id: ColorType.Text,
    value: '#000',
  },
};

@Component({
  selector: 'app-type-ramp',
  templateUrl: './type-ramp.component.html',
  styleUrls: ['./type-ramp.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TypeRampComponent implements OnDestroy {
  private _componentRef?: ComponentRef<FontEditorComponent>;
  private _designSystem?: IDesignSystem;

  public typeRampStyles: ReadonlyArray<ITypographyStyle> = [];
  public fontList?: IStringMap<IFontFamily>;
  public editingTextStyle: ITypographyStyle | null = null;

  @Input()
  public set designSystem(designSystem: IDesignSystem | undefined) {
    this._designSystem = designSystem;

    const typography = designSystem?.typography;
    if (!typography) return;
    this.typeRampStyles = Object.entries(typography)
      .filter(([id]) => id !== TextType.IconFontFamily) // Ignore icons
      .map(([id, value]) => ({ ...value, id }))
      .sort(sortDesignSystemValues);
  }

  public get designSystem() {
    return this._designSystem;
  }

  @Output() changeStyle = new EventEmitter<ITypographyStyle>();
  @Output() removeStyle = new EventEmitter<string>();

  constructor(protected _cdRef: ChangeDetectorRef, protected _overlayService: cd.OverlayService) {}

  getOverlayConfig(e: MouseEvent) {
    const target = e.currentTarget as HTMLElement;
    const { top, left, width, height } = target.getBoundingClientRect();
    const x = left + width - OFFSET_OVERLAY_LEFT;
    const y = top + height - OFFSET_OVERLAY_TOP;
    return { x, y, disableAutoFocus: true };
  }

  onStyleClick(e: MouseEvent, item: ITypographyStyle) {
    const overlayConfig = this.getOverlayConfig(e);
    const componentRef = this._overlayService.attachComponent(FontEditorComponent, overlayConfig);

    componentRef.instance.value = item;
    componentRef.instance.removeStyle = true;
    componentRef.instance.designSystem = this._designSystem;

    this.editingTextStyle = item;
    this._cdRef.detectChanges();

    const subscriptions = new Subscription();
    subscriptions.add(componentRef.instance.remove.subscribe(this.onRemoveTypeStyle));
    subscriptions.add(componentRef.instance.valueChange.subscribe(this.onEditSubscription));
    this._componentRef = componentRef;

    componentRef.onDestroy(() => {
      subscriptions.unsubscribe();
      this.editingTextStyle = null;
      this._cdRef.detectChanges();
    });
  }

  onEditSubscription = (fontEdit: ITypographyStyle): void => {
    this.changeStyle.emit(fontEdit);
  };

  onAddItem(e: MouseEvent) {
    const id = generateIDWithLength(5).toLowerCase();
    const overlayConfig = this.getOverlayConfig(e);
    overlayConfig.x += OFFSET_OVERLAY_LEFT;
    const componentRef = this._overlayService.attachComponent(FontEditorComponent, overlayConfig);
    const subscriptions = componentRef.instance.add.subscribe(this.onAddTypeStyle);
    const config = { id, ...DEFAULT_CONFIG, index: this.typeRampStyles.length };
    const typography = this.designSystem?.typography;
    config.name = incrementNameForDesignSystemCategory(DEFAULT_CONFIG.name, typography);
    componentRef.instance.designSystem = this._designSystem;
    componentRef.instance.value = config;
    componentRef.instance.addStyle = true;

    componentRef.onDestroy(() => subscriptions.unsubscribe());
    this._componentRef = componentRef;
  }

  cleanupComponentRef() {
    if (!this._componentRef) return;
    this._overlayService.close();
    this._componentRef = undefined;
  }

  ngOnDestroy(): void {
    this.cleanupComponentRef();
  }

  onAddTypeStyle = (typeStyle: ITypographyStyle): void => {
    this.cleanupComponentRef();
    this.changeStyle.emit(typeStyle);
  };

  onRemoveTypeStyle = (styleId: string): void => {
    this.cleanupComponentRef();
    this.removeStyle.emit(styleId);
  };

  trackByFn(_index: number, item: ITypographyStyle) {
    return item.id;
  }
}
