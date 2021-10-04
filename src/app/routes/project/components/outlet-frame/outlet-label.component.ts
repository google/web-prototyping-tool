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
  OnDestroy,
  ElementRef,
  ViewChild,
  HostBinding,
  ChangeDetectionStrategy,
  HostListener,
  EventEmitter,
  Output,
} from '@angular/core';
import { ElementEntitySubType } from 'cd-interfaces';
import { InteractionService } from '../../services/interaction/interaction.service';
import { ISelectionState } from '../../store/reducers/selection.reducer';
import { selectElement } from 'cd-utils/selection';
import { KEYS, keyCheck } from 'cd-utils/keycodes';
import { fromEvent, Subscription } from 'rxjs';
import { CONTENT_EDITABLE_TEXT_ONLY } from 'cd-common/consts';

@Component({
  selector: 'app-outlet-label',
  templateUrl: './outlet-label.component.html',
  styleUrls: ['./outlet-label.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutletLabelComponent implements OnDestroy {
  private _subscription = Subscription.EMPTY;

  @Input() iconScale = 1;
  @Input() id = '';
  @Input() homeBoardId?: string;
  @Input() showBoardId = false;
  @Input() elementType?: ElementEntitySubType;
  @Input() name = '';
  @Input() debug = false;
  @Input() commentCount = 0;

  @Input()
  set selection(value: ISelectionState) {
    this.isSelected = value.ids.has(this.id);
  }

  @HostBinding('class.selected') isSelected = false;

  @ViewChild('elementName', { read: ElementRef, static: true }) elementName!: ElementRef;

  @Output() nameChanged = new EventEmitter<string>();
  @Output() commentClick = new EventEmitter<string>();

  constructor(private _elementRef: ElementRef, private _interactionService: InteractionService) {}

  get element() {
    return this._elementRef.nativeElement;
  }

  onCommentMousedown(e: MouseEvent) {
    e.stopPropagation();
  }

  onCommentClick() {
    this.commentClick.emit(this.id);
  }

  get outletFrameLabel() {
    return this.elementName.nativeElement;
  }

  @HostListener('dblclick')
  onHeaderDoubleClick() {
    const { outletFrameLabel } = this;
    outletFrameLabel.contentEditable = CONTENT_EDITABLE_TEXT_ONLY;
    const [nameTextNode] = outletFrameLabel.childNodes;
    selectElement(nameTextNode);
    outletFrameLabel.focus();
    this._subscription = new Subscription();
    const blurEvent = fromEvent(outletFrameLabel, 'blur');
    const keydown = fromEvent<KeyboardEvent>(outletFrameLabel, 'keydown');
    const keyup = fromEvent<KeyboardEvent>(outletFrameLabel, 'keyup');
    this._subscription.add(blurEvent.subscribe(this.onLabelBlur));
    this._subscription.add(keydown.subscribe(this.onLabelKeydown));
    this._subscription.add(keyup.subscribe(this.onLabelKeyup));
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }

  @HostListener('mousedown', ['$event'])
  onHeaderDown(e: MouseEvent) {
    const { id } = this;
    this._interactionService.toggleElements([id], e.shiftKey);
  }

  onLabelBlur = () => {
    const { outletFrameLabel } = this;
    const newText = outletFrameLabel.innerText.replace(/\n/g, '');
    outletFrameLabel.contentEditable = false;
    outletFrameLabel.scrollLeft = 0;
    if (this.name !== newText) {
      this.nameChanged.emit(newText);
    }
    this._subscription.unsubscribe();
  };

  onLabelKeyup = (e: KeyboardEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  onLabelKeydown = (e: KeyboardEvent) => {
    const { key } = e;
    e.stopImmediatePropagation();
    if (keyCheck(key, KEYS.Escape, KEYS.Enter)) {
      const element = e.currentTarget as HTMLSpanElement;
      // Prevent Enter from adding a new line
      document.execCommand('defaultParagraphSeparator', false, 'p');
      if (key === KEYS.Escape) element.innerText = this.name;
      element.blur();
      return false;
    }
    return;
  };
}
