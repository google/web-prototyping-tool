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
  ViewChild,
  ChangeDetectorRef,
} from '@angular/core';
import { PropertyGroupComponent, SelectButtonComponent } from 'cd-common';
import { findA11yAttributeByName } from 'cd-common/utils';
import { IA11yAttr, ISelectItem } from 'cd-interfaces';
import { ariaAttributes } from 'cd-metadata/aria';
import { AriaInputListComponent } from '../aria-input-list/aria-input-list.component';

@Component({
  selector: 'app-a11y-custom-attrs',
  templateUrl: './a11y-custom-attrs.component.html',
  styleUrls: ['./a11y-custom-attrs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class A11yCustomAttrsComponent {
  private _keyMenuData: string[] = [];
  public availableAttrKeys: string[] = [];

  @Input() attrs: IA11yAttr[] = [];

  @Input()
  set keyMenuData(data: string[]) {
    this._keyMenuData = data;
    // Filter out attributes already used in this section
    this.availableAttrKeys = this._keyMenuData.filter((attrName: string) => {
      return !findA11yAttributeByName(this.attrs, attrName);
    });
  }

  @Output() ariaAttrChange = new EventEmitter<IA11yAttr>();
  @Output() ariaAttrDelete = new EventEmitter<IA11yAttr>();

  @ViewChild('addAttrButtonRef', { read: SelectButtonComponent })
  addAttrButtonRef!: SelectButtonComponent;

  @ViewChild(AriaInputListComponent, { read: AriaInputListComponent })
  attrListRef?: AriaInputListComponent;

  @ViewChild(PropertyGroupComponent, { read: PropertyGroupComponent })
  propertyPanelRef!: PropertyGroupComponent;

  constructor(private _cdRef: ChangeDetectorRef) {}

  onAriaAttrChange(attr: IA11yAttr) {
    this.ariaAttrChange.emit(attr);
  }

  onAriaAttrDelete(attr: IA11yAttr) {
    // TODO: cleanup

    // Find the index of the next/prev attr to focus on when this attr is removed.
    // If all are deleted, focus on add button
    const deleteIndex = this.attrs.findIndex((a: IA11yAttr) => a.name === attr.name);
    const focusIndex =
      deleteIndex < this.attrs.length - 1
        ? deleteIndex + 1
        : deleteIndex
        ? deleteIndex - 1
        : deleteIndex;
    const targetButton = this.attrListRef?.deleteButtonRefs?.toArray()[focusIndex];
    if (targetButton && focusIndex !== deleteIndex) targetButton?._getHostElement().focus();
    else this.addAttrButtonRef._btnRef.nativeElement.focus();

    this.ariaAttrDelete.emit(attr);
  }

  onNewAttrSelect(item: ISelectItem) {
    const attrName = item.value;
    this.newAttrKeySelected(attrName);
  }

  newAttrKeySelected(keyName: string) {
    const valueForKey = ariaAttributes[keyName];
    if (valueForKey) {
      // If attr value is a list, default to first value, which is same W3C default.
      const keyValue = valueForKey.length ? valueForKey[0] : '';
      const newAttr = { name: keyName, value: keyValue };
      this.addNewAttr(newAttr);
    }
  }

  addNewAttr(newAttr: IA11yAttr) {
    this.propertyPanelRef.collapsePanel(false);
    // Update internal attrs array to immediately render new item (prevents UI flashing)
    const copyArray = [...this.attrs];
    copyArray.push(newAttr);
    this.attrs = copyArray;
    this._cdRef.detectChanges();
    this.attrListRef?.focusOnNewInput();
    this.onAriaAttrChange(newAttr);
  }
}
