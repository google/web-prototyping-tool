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
import { Component, ChangeDetectionStrategy, Input, EventEmitter, Output, OnDestroy, ChangeDetectorRef, } from '@angular/core';
import { SelectTargetService } from 'src/app/routes/project/services/select-target/select-target.service';
import { PropertiesService } from 'src/app/routes/project/services/properties/properties.service';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { PropertyModel } from 'cd-interfaces';
import { iconForComponent } from 'cd-common/models';

const ACTIVE_INPUT_LABEL = 'Select an element';
const INACTIVE_INPUT_LABEL = 'None';

@Component({
  selector: 'app-element-target-prop',
  templateUrl: './element-target-prop.component.html',
  styleUrls: ['./element-target-prop.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ElementTargetPropComponent implements OnDestroy {
  private _subscription = Subscription.EMPTY;
  public activeElement?: PropertyModel;
  public active = false;
  public activeIcon?: string;

  @Input()
  set value(id: string | undefined) {
    this.activeElement = id ? this._propsService.getPropertiesForId(id) : undefined;
    this.activeIcon = this.activeElement ? iconForComponent(this.activeElement) : '';
  }

  @Input() activeInputLabel = ACTIVE_INPUT_LABEL;
  @Input() inactiveInputLabel = INACTIVE_INPUT_LABEL;
  @Output() valueChange = new EventEmitter<string | null>();
  @Output() activeValue = new EventEmitter<string>();

  constructor(
    private _selectTarget: SelectTargetService,
    private _propsService: PropertiesService,
    private _cdRef: ChangeDetectorRef
  ) {}

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
    if (this.active) this._selectTarget.onCancel();
  }

  get inputLabel() {
    return this.active ? this.activeInputLabel : this.inactiveInputLabel;
  }

  onSelectTarget() {
    this.active = true;
    this._subscription = this._selectTarget.selectedId$.pipe(take(1)).subscribe(this.onTargetId);
    this._subscription.add(this._selectTarget.cancel$.subscribe(this.endSubscription));
    this._selectTarget.activate();
    this._cdRef.markForCheck();
  }

  onRemoveChip() {
    this.updateValue();
    this._selectTarget.onCancel();
    this.removeActiveHighlight();
  }

  endSubscription = () => {
    this.active = false;
    this._subscription.unsubscribe();
    this._cdRef.markForCheck();
  };

  onTargetId = (id: string | undefined) => {
    this.updateValue(id);
    this.endSubscription();
  };

  showActiveHighlight() {
    this.activeValue.emit(this.activeElement?.id);
  }

  removeActiveHighlight() {
    this.activeValue.emit('');
  }

  updateValue(id?: string) {
    this.value = id;
    this.valueChange.emit(id ?? null);
    this._cdRef.markForCheck();
  }
}
