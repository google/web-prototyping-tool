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
  ViewChild,
  ElementRef,
  HostBinding,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';
import { keyCheck, KEYS } from 'cd-utils/keycodes';
import { selectElement, clearSelection } from 'cd-utils/selection';
import { Subscription, fromEvent } from 'rxjs';
@Component({
  selector: 'cd-tree-cell',
  templateUrl: './tree-cell.component.html',
  styleUrls: ['./tree-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreeCellComponent implements OnDestroy {
  private _editSubscription = Subscription.EMPTY;
  public editing = false;
  public title = 'Item';
  public preview = '';
  public iconName?: string;
  public labelText = '';

  @Input() id?: string;
  @Input() debug = false;

  @Input()
  public set icon(value: string) {
    if (value === this.iconName) return;
    this.iconName = value;
  }

  @Input()
  public set label(value: string[]) {
    if (!value || !value.length) return;
    const [title, preview] = value;
    this.title = title;
    this.preview = preview;
    this.labelText = preview ? `${preview} (${title})` : title;
  }

  @Input() hasActionBehaviors = false;

  get name() {
    return this.debug ? this.id : this.labelText;
  }

  @Input()
  @HostBinding('class.symbol')
  isSymbol = false;

  @Input()
  @HostBinding('class.mark-hidden')
  markHidden = false;

  @Input()
  @HostBinding('class.board')
  isBoard = false;

  @Input()
  @HostBinding('class.hover-board')
  hoverBoard = false;

  @Input()
  @HostBinding('class.show-highlight')
  showHighlight = false;

  @Input()
  @HostBinding('class.show-expander')
  showExpander = false;

  @Input()
  @HostBinding('class.show-actions-on-hover')
  showActionsOnHover = true;

  @Input()
  @HostBinding('class.show-hide-button')
  showHideButton = true;

  @Input()
  @HostBinding('class.expanded')
  expanded = false;

  @Output() editingLabel = new EventEmitter<boolean>();
  @Output() labelChange = new EventEmitter<string>();

  @ViewChild('labelInput', { read: ElementRef, static: true }) labelInput!: ElementRef;

  constructor(private _cdRef: ChangeDetectorRef) {}

  ngOnDestroy(): void {
    this._editSubscription.unsubscribe();
  }

  stopPropagation(e: MouseEvent) {
    e.stopPropagation();
  }

  onLabelMouseDown = (e: MouseEvent) => {
    if (this.editing) {
      this.stopPropagation(e);
    }
  };

  get labelElement() {
    return this.labelInput.nativeElement;
  }

  get canShowActionsButton() {
    return this.hasActionBehaviors && this.editing === false;
  }

  get canShowVisButton() {
    return this.isBoard === false && this.editing === false;
  }

  onEditLabel() {
    const { labelElement } = this;
    this.editing = true;
    labelElement.focus();
    const [textNode] = labelElement.childNodes;
    selectElement(textNode);
    this.editingLabel.emit(true);

    this._editSubscription = new Subscription();
    const blurEvent = fromEvent(this.labelElement, 'blur');
    const focusEvent = fromEvent(this.labelElement, 'focus');
    const keyEvent = fromEvent<KeyboardEvent>(this.labelElement, 'keydown');
    const mouseEvent = fromEvent<MouseEvent>(this.labelElement, 'mousedown');

    this._editSubscription.add(blurEvent.subscribe(this.onBlur));
    this._editSubscription.add(focusEvent.subscribe(this.onFocus));
    this._editSubscription.add(keyEvent.subscribe(this.onLabelKeydown));
    this._editSubscription.add(mouseEvent.subscribe(this.onLabelMouseDown));
  }

  public onFocus = () => {
    this.editing = true;
  };

  public onBlur = () => {
    const { labelElement } = this;
    labelElement.scrollLeft = 0;
    this.title = labelElement.innerText;
    this.editing = false;
    this.labelChange.emit(this.title);
    this.editingLabel.emit(false);
    this._editSubscription.unsubscribe();
    clearSelection();
  };

  onLabelKeydown = (e: KeyboardEvent) => {
    const { key } = e;
    const { nativeElement } = this.labelInput;
    e.stopImmediatePropagation();
    // on pressing enter or escape, blur focus from input
    if (keyCheck(key, KEYS.Enter, KEYS.Escape, KEYS.Tab)) {
      // if escape, reset label
      if (keyCheck(key, KEYS.Escape)) {
        nativeElement.innerText = this.title;
      }

      this.labelInput.nativeElement.blur();
      this._cdRef.markForCheck();
      e.preventDefault();
    }
  };
}
