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
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
// prettier-ignore
import {
  EVENT_PAYLOAD_TYPES_MENU_DATA,
  getDuplicateNameErrorText,
  getInvalidNameErrorText,
  NameErrorType,
  NO_INPUT_NAME_ERROR_TEXT
} from '../../code-comp.config';
import { checkIfDuplicateInputOutputName, validateInputOutputName } from 'cd-common/utils';
import { INPUT_BINDING_HELP_TEXT, TYPE_HELP_TEXT, UNBOUND_EVENT_NAME } from './event-card.config';
import { INPUT_VALIDATION_DEBOUNCE_TIME } from 'cd-common/consts';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import * as cd from 'cd-interfaces';

@Component({
  selector: 'app-event-card',
  templateUrl: './event-card.component.html',
  styleUrls: ['./event-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventCardComponent implements OnDestroy, OnInit {
  private _nameValidation$ = new Subject<string>();
  private _subscriptions = new Subscription();

  public UNBOUND_EVENT_NAME = UNBOUND_EVENT_NAME;
  public EVENT_PAYLOAD_TYPES_MENU_DATA = EVENT_PAYLOAD_TYPES_MENU_DATA;
  public inputBindingHelpText = INPUT_BINDING_HELP_TEXT;
  public typeHelpText = TYPE_HELP_TEXT;
  public nameErrorText?: cd.IRichTooltip;

  @Input() event!: cd.IOutputProperty;
  @Input() allEvents?: cd.IOutputProperty[];
  @Input() allInputs?: cd.IPropertyGroup[];

  @Output() update = new EventEmitter<cd.IOutputProperty>();
  @Output() delete = new EventEmitter<void>();

  constructor(private cdRef: ChangeDetectorRef) {}

  ngOnInit(): void {
    const validate$ = this._nameValidation$.pipe(debounceTime(INPUT_VALIDATION_DEBOUNCE_TIME));
    this._subscriptions.add(validate$.subscribe(this.validateName));
  }

  ngOnDestroy() {
    this._subscriptions.unsubscribe();
  }

  get nameValue() {
    return this.event?.eventName || '';
  }

  onDelete() {
    this.delete.emit();
  }

  onNameChange(eventName: string) {
    if (!this.event) return;
    const isValid = this.validateName(eventName);
    if (!isValid || this.nameValue === eventName) return;

    const label = eventName;
    const bindingSetToEventName = this.event.binding === this.event.eventName;
    const newEvent = { ...this.event, label, eventName };

    // If binding is currently set to match the eventName, update to keep in sync
    if (bindingSetToEventName) {
      newEvent.binding = eventName;
    }
    this.update.emit(newEvent);
  }

  onTypeChange(item: cd.SelectItemOutput) {
    if (!this.event) return;
    const type = (item as cd.ISelectItem).value as cd.OutputPropertyType;
    const newEvent = { ...this.event, type };
    this.update.emit(newEvent);
  }

  onInputBindingChange(item: cd.SelectItemOutput) {
    if (!this.event) return;

    // If input binding gets set to none, default to eventName
    const binding = (item as cd.ISelectItem).value || (this.event.eventName as string);
    const newEvent: cd.IOutputProperty = { ...this.event, binding };
    this.update.emit(newEvent);
  }

  requestNameValidation(inputEvent: Event) {
    const { value } = inputEvent.target as HTMLInputElement;
    this._nameValidation$.next(value);
  }

  private validateName = (name: string): boolean => {
    let isValid = true;

    // Skip validation if setting name back to initial value
    if (this.nameValue === name) {
      this.nameErrorText = undefined;
    }
    // Check if name is defined
    else if (!name) {
      isValid = false;
      this.nameErrorText = NO_INPUT_NAME_ERROR_TEXT;
    }
    // Check is name is a duplicate of an existing input or output name
    else if (checkIfDuplicateInputOutputName(name, this.allInputs, this.allEvents)) {
      isValid = false;
      this.nameErrorText = getDuplicateNameErrorText(name, NameErrorType.Event);
    }
    // Check if name is a valid pattern
    else if (!validateInputOutputName(name)) {
      isValid = false;
      this.nameErrorText = getInvalidNameErrorText(name, NameErrorType.Event);
    }
    // Else remove error state from input
    else {
      this.nameErrorText = undefined;
    }

    this.cdRef.markForCheck();
    return isValid;
  };
}
