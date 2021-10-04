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
  Output,
  EventEmitter,
  Directive,
} from '@angular/core';
import { AnalyticsEvent, IAnalyticsEvent } from 'cd-common/analytics';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import * as cd from 'cd-interfaces';

@Directive({ selector: '[cdPropertiesHeaderLeft]' })
export class PropertiesHeaderLeftDirective {}

@Directive({ selector: '[cdPropertiesActionsSlot]' })
export class PropertiesActionsSlotDirective {}

@Directive({ selector: '[cdPropertiesA11ySlot]' })
export class PropertiesA11ySlotDirective {}

@Directive({ selector: '[cdPropertiesCodeSlot]' })
export class PropertiesCodeSlotDirective {}

@Component({
  selector: 'cd-properties',
  templateUrl: './properties.component.html',
  styleUrls: ['./properties.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertiesComponent {
  private _styles: cd.IStyleAttributes = { base: {} };
  private _readonlyTitle = false;
  private _hideAdvancedAttrs = false;

  public hasOverrides = false;
  public PropertiesState = cd.PropertyPanelState;

  @Input() state: cd.PropertyPanelState = cd.PropertyPanelState.Default;
  @Input() editing = false;
  @Input() panelTitle = '';
  @Input() id = '';
  @Input() designSystem!: cd.IDesignSystem;
  @Input() colorMenuData: cd.ISelectItem[] = [];
  @Input() variablesMenuData: cd.ISelectItem[] = [];
  @Input() attr: cd.IKeyValue[] = [];
  @Input() projectAssets: cd.AssetMap = {};
  @Input() hasActions = false;
  @Input() hasA11y = false;
  @Input() isRecording = false;
  @Input() ellipsisMenuItems: cd.IMenuConfig[] = [];

  @Input()
  set hideAdvancedAttrs(value: boolean) {
    this._hideAdvancedAttrs = coerceBooleanProperty(value);
  }
  get hideAdvancedAttrs(): boolean {
    return this._hideAdvancedAttrs;
  }

  @Input()
  set readonlyTitle(value: boolean) {
    this._readonlyTitle = coerceBooleanProperty(value);
  }
  get readonlyTitle(): boolean {
    return this._readonlyTitle;
  }

  @Input() hideStateButtons = false;

  @Input()
  set styles(value: cd.IStyleAttributes) {
    this._styles = value;
    this.checkForOverrides(value);
  }
  get styles(): cd.IStyleAttributes {
    return this._styles;
  }

  @Output() titleChange = new EventEmitter<string>();
  @Output() attrChange = new EventEmitter<cd.IKeyValue[]>();
  @Output() stylesChange = new EventEmitter<cd.IStyleAttributes>();
  @Output() stateChange = new EventEmitter<cd.PropertyPanelState>();
  @Output() ellipsisMenuItemSelected = new EventEmitter<cd.IMenuListItem>();
  @Output() analyticsEvent = new EventEmitter<IAnalyticsEvent>();

  get showStateButtons(): boolean {
    return !this.hideStateButtons && !this.hasEllipsisMenuItems;
  }

  get hasEllipsisMenuItems(): boolean {
    return this.ellipsisMenuItems.length > 0;
  }

  get isPropsStateCode(): boolean {
    return this.state === cd.PropertyPanelState.Code;
  }

  get isPropsStateActions(): boolean {
    return this.state === cd.PropertyPanelState.Actions;
  }

  get isPropsStateAccessibility(): boolean {
    return this.state === cd.PropertyPanelState.Accessibility;
  }

  get showOverridesBadge(): boolean {
    return this.showStateButtons && this.hasOverrides && !this.isPropsStateCode;
  }

  get showActionsBadge(): boolean {
    return this.showStateButtons && this.hasActions && !this.isPropsStateActions;
  }

  get showA11yBadge(): boolean {
    return this.showStateButtons && this.hasA11y && !this.isPropsStateAccessibility;
  }

  /**
   * Looks at each child style e.g styles.base.overrides
   *  and checks to see if there are any enabled
   * @param styles
   */
  checkForOverrides(styles: cd.IStyleAttributes) {
    this.hasOverrides = Object.values(styles)
      .map((item) => (item && item.overrides) || [])
      .some((override) => override.some((item) => !!!item.disabled));
  }

  onTitleChange(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    const titleInput = e.currentTarget as HTMLInputElement;
    this.titleChange.emit(titleInput.value);
  }

  onStyleOverride(overrides: cd.IStyleAttributes) {
    this.stylesChange.emit(overrides);
  }

  onAttributesUpdate(update: cd.IKeyValue[]) {
    this.attrChange.emit(update);
  }

  onStateChange(state: cd.PropertyPanelState) {
    if (this.state === state) return;
    this.state = state;
    this.stateChange.emit(state);
    if (state === cd.PropertyPanelState.Default) return;
    const type = AnalyticsEvent.PropertiesPanelOpened;
    const params = { name: cd.PropertyPanelState[state] };
    this.onAnalyticsEvent({ type, params });
  }

  onEllipsisMenuSelected(menuItem: cd.IMenuListItem) {
    this.ellipsisMenuItemSelected.emit(menuItem);
  }

  onAnalyticsEvent(e: IAnalyticsEvent) {
    this.analyticsEvent.emit(e);
  }
}
