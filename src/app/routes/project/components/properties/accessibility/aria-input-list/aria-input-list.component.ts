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
  QueryList,
  ViewChildren,
} from '@angular/core';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import * as cd from 'cd-interfaces';
import { getA11yAttrLabel } from 'cd-common/utils';
import {
  AbstractOverlayControllerDirective,
  ButtonComponent,
  ConfirmationDialogComponent,
} from 'cd-common';

const HELP_TEXT: cd.IRichTooltip = {
  text: `You can add a <strong>unique</strong> HTML ID
    in a related element's custom attributes section 
    (ie. <em>id: mycustomid</em>) to use for this attribute.`,
  link: 'https://www.w3.org/TR/wai-aria/#valuetype_idref',
  linkText: 'More information',
};

@Component({
  selector: 'app-aria-input-list',
  templateUrl: './aria-input-list.component.html',
  styleUrls: ['./aria-input-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AriaInputListComponent extends AbstractOverlayControllerDirective {
  private _editEnabled = false;
  public attributeTypes = cd.PropertyInput;
  public readonly elementPickerHelp = HELP_TEXT;

  @Input() attrs: cd.IA11yAttr[] = [];
  @Input() availableAttrKeys: string[] = [];

  @Input()
  public set editEnabled(value: boolean | string) {
    this._editEnabled = coerceBooleanProperty(value);
  }
  public get editEnabled() {
    return this._editEnabled;
  }

  @Output() ariaInputChange = new EventEmitter<cd.IA11yAttr>();
  @Output() ariaInputDelete = new EventEmitter<cd.IA11yAttr>();

  @ViewChildren('attrInputRef') attributeInputRefs!: QueryList<any>;
  @ViewChildren('deleteButtonRef') deleteButtonRefs!: QueryList<ButtonComponent>;

  onAriaInputValueChange(attr: cd.IA11yAttr, attrValue: string) {
    this.ariaInputChange.emit({ ...attr, value: attrValue });
  }

  onAriaInputValueSelect(attr: cd.IA11yAttr, item: cd.ISelectItem) {
    const { value } = item;
    this.onAriaInputValueChange(attr, value);
  }

  onAriaInputCheckedChange(attr: cd.IA11yAttr, value: boolean) {
    const valueString = value.toString();
    this.onAriaInputValueChange(attr, valueString);
  }

  onAttrDelete(attr: cd.IA11yAttr) {
    const cmpRef = this.showModal<ConfirmationDialogComponent>(ConfirmationDialogComponent);
    cmpRef.instance.title = `Delete "${getA11yAttrLabel(attr.name)}" attribute?`;
    cmpRef.instance.message = 'This action will remove the attribute from this element.';
    cmpRef.instance.confirm.subscribe(() => this.ariaInputDelete.emit(attr));
  }

  focusOnNewInput() {
    const newComponentInput = this.attributeInputRefs.last;
    if (newComponentInput.triggerComponentFocus) {
      newComponentInput.triggerComponentFocus();
    }
  }

  trackByFn(_index: number, item: cd.IA11yAttr) {
    return item.name;
  }
}
