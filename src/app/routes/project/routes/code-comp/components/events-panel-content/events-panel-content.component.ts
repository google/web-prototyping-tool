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
import { Component, ChangeDetectionStrategy, ViewChild, ElementRef, Output, EventEmitter, Input, OnChanges, OnDestroy } from '@angular/core';
// prettier-ignore
import { AbstractOverlayControllerDirective, OverlayService, ConfirmationDialogComponent, } from 'cd-common';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import { createNewDefaultOutput } from '../../code-comp.config';
import * as cd from 'cd-interfaces';
import { Subscription } from 'rxjs';
import { AnalyticsEvent } from 'cd-common/analytics';

const DELETE_DETAILS = {
  title: 'Delete event?',
  message: 'Removing this event will remove the option to use this as an interaction trigger.',
};

@Component({
  selector: 'app-events-panel-content',
  templateUrl: './events-panel-content.component.html',
  styleUrls: ['./events-panel-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventsPanelContentComponent
  extends AbstractOverlayControllerDirective
  implements OnChanges, OnDestroy
{
  private _outputs: cd.IOutputProperty[] = [];
  private _inputs: cd.IPropertyGroup[] = [];
  private _subscription = Subscription.EMPTY;
  public animateNextChange = false;
  public animateEnabled = false;

  @Input()
  set outputs(value: cd.IOutputProperty[]) {
    this._outputs = value || [];
  }
  get outputs(): cd.IOutputProperty[] {
    return this._outputs;
  }

  @Input()
  set inputs(value: cd.IPropertyGroup[]) {
    this._inputs = value || [];
  }
  get inputs(): cd.IPropertyGroup[] {
    return this._inputs;
  }

  @Input() disabled = false;

  @Output() outputsChange = new EventEmitter<cd.IOutputProperty[]>();

  @ViewChild('eventListRef', { read: ElementRef, static: true }) eventList!: ElementRef;

  constructor(public overlayService: OverlayService, private analyticsService: AnalyticsService) {
    super(overlayService);
  }

  ngOnDestroy() {
    super.ngOnDestroy();
    this._subscription.unsubscribe();
  }

  trackByFn(_idx: number, output: cd.IOutputProperty) {
    return output.id;
  }

  ngOnChanges() {
    if (this.animateNextChange) {
      this.animateEnabled = true;
      this.animateNextChange = false;
    } else {
      this.animateEnabled = false;
    }
  }

  onAddEvent() {
    if (this.disabled) return;
    this.analyticsService.logEvent(AnalyticsEvent.CodeComponentOutputAdded);

    const outputs = this.outputs || [];
    const newOutput = createNewDefaultOutput(outputs);
    const updatedOutputs = [newOutput, ...outputs];

    this.animateNextChange = true;
    this.outputsChange.emit(updatedOutputs);
  }

  onUpdate(index: number, updatedOutput: cd.IOutputProperty) {
    const { outputs } = this;
    if (!outputs) return;
    this.analyticsService.logEvent(AnalyticsEvent.CodeComponentOutputUpdated);

    const updatedOutputs = [...outputs];
    updatedOutputs[index] = updatedOutput;
    this.outputsChange.emit(updatedOutputs);
  }

  onDelete(index: number) {
    const cmpRef = this.showModal<ConfirmationDialogComponent>(ConfirmationDialogComponent);
    cmpRef.instance.title = DELETE_DETAILS.title;
    cmpRef.instance.message = DELETE_DETAILS.message;
    this._subscription = cmpRef.instance.confirm.subscribe(() => this.onDeleteConfirm(index));
  }

  private onDeleteConfirm = (index: number) => {
    const { outputs } = this;
    this.analyticsService.logEvent(AnalyticsEvent.CodeComponentOutputDeleted);
    const updatedOutputs = outputs.filter((_output, i) => i !== index);
    this.outputsChange.emit(updatedOutputs);
    this._subscription.unsubscribe();
  };
}
