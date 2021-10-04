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
  HostBinding,
  Input,
  EventEmitter,
  Output,
  HostListener,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { INTERACTION_TYPE_MENU } from '../../../properties/actions-panel/action-panel.config';
import { IConfigPayload, ConfigAction } from '../../../../interfaces/action.interface';
import { KEYS } from 'cd-utils/keycodes';
import * as cd from 'cd-interfaces';
import { ELEMENT_PROPS_ADD_INTERACTION } from '../../../../store/actions';

@Component({
  selector: 'app-actions-list-modal',
  templateUrl: './actions-list-modal.component.html',
  styleUrls: ['./actions-list-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionsListModalComponent implements AfterViewInit {
  public actionTypes = INTERACTION_TYPE_MENU;

  @HostBinding('style.width.px') width = 0;

  @HostBinding('style.height.px') height = 0;

  @Input() selectedProperties: cd.ReadOnlyPropertyModelList = [];

  @Input() set size(value: cd.Dimensions) {
    const { width, height } = value;
    this.width = width;
    this.height = height;
  }

  @Output() exit = new EventEmitter<void>();
  @Output() interactionSelected = new EventEmitter<ConfigAction>();

  @HostListener('keydown', ['$event'])
  onKeyDown(e: KeyboardEvent) {
    if (e.key === KEYS.Escape) return this.closeModal();
  }

  constructor(private _elementRef: ElementRef) {}

  ngAfterViewInit() {
    const componentElement = this._elementRef.nativeElement;
    componentElement.children[0]?.focus();
  }

  closeModal() {
    this.exit.emit();
  }

  onActionTypeClick(id: cd.ActionType) {
    const { selectedProperties } = this;
    if (!selectedProperties) return;
    const config = { id, action: ELEMENT_PROPS_ADD_INTERACTION } as cd.IConfig;
    const payload: IConfigPayload = { propertyModels: [...selectedProperties] };
    const action = new ConfigAction(config, payload);
    this.interactionSelected.emit(action);
  }
}
