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
  HostListener,
  Output,
  EventEmitter,
  OnDestroy,
  ComponentRef,
  ChangeDetectorRef,
} from '@angular/core';
import { InteractionService } from '../../../services/interaction/interaction.service';
import { RecordTimingOverlayComponent } from '../record-timing-overlay/record-timing-overlay.component';
import { buildChangeListGroup, IElementChanges, calculateTotalTime } from './record-list.utils';
import {
  OverlayService,
  AbstractOverlayControllerDirective,
  ConfirmationDialogComponent,
} from 'cd-common';
import { PropertiesService } from '../../../services/properties/properties.service';
import { Subscription, ReplaySubject } from 'rxjs';
import { areObjectsEqual } from 'cd-utils/object';
import { takeUntil } from 'rxjs/operators';
import * as cd from 'cd-interfaces';

const OVERLAY_OFFSET_LEFT = 180;
const OVERLAY_OFFSET_TOP = 60;
const OVERLAY_OFFSET_TOP_INPUT = 30;

@Component({
  selector: 'ul[app-record-list]',
  templateUrl: './record-list.component.html',
  styleUrls: ['./record-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [OverlayService],
})
export class RecordListComponent extends AbstractOverlayControllerDirective implements OnDestroy {
  private _destroyed = new ReplaySubject<void>(1);
  private _stateChanges: cd.IActionStateChange[] = [];
  private _timingOverlayRef?: ComponentRef<RecordTimingOverlayComponent>;
  private _subscription = Subscription.EMPTY;

  public changeListGroup: ReadonlyArray<[string, IElementChanges]> = [];
  public elementTitles: string[] = [];
  public ActionStateType = cd.ActionStateType;
  public activeIndex = -1;
  public totalTime = 0;

  @Input() showPin = false;
  @Input() showTimeline = false;
  @Input() designSystem?: cd.IDesignSystem;
  @Input() boards: cd.IBoardProperties[] = [];

  @Input()
  public set stateChanges(values: cd.IActionStateChange[]) {
    if (areObjectsEqual(values, this._stateChanges)) return;
    this._stateChanges = values;
    this.totalTime = calculateTotalTime(values);
    this.changeListGroup = Array.from(buildChangeListGroup(values).entries());
  }
  public get stateChanges(): cd.IActionStateChange[] {
    return this._stateChanges;
  }

  @Output() deleteRecord = new EventEmitter<number>();
  @Output() deleteMultipleIndexes = new EventEmitter<number[]>();
  @Output() updateRecord = new EventEmitter<[number, cd.IActionStateChange]>();

  constructor(
    private _cdRef: ChangeDetectorRef,
    private _propertiesService: PropertiesService,
    private _interactionService: InteractionService,
    public overlayService: OverlayService
  ) {
    super(overlayService);
  }

  cleanupComponentRef() {
    if (this._timingOverlayRef) {
      this.overlayService.close();
      this._timingOverlayRef = undefined;
    }
  }

  ngOnDestroy(): void {
    this._destroyed.next();
    this._destroyed.complete();
    this.cleanupComponentRef();
    super.ngOnDestroy();
  }

  @HostListener('mouseout')
  onMouseOut() {
    if (this.activeIndex !== -1) return;
    this._interactionService.highlightElement('');
  }

  onMouseOver(id: string) {
    this._interactionService.highlightElement(id);
  }

  getOverlayConfig(e: MouseEvent, isInputOrOverride: boolean) {
    const currentTarget = e.currentTarget as HTMLElement;
    const { top, left } = currentTarget.getBoundingClientRect();
    const x = left - OVERLAY_OFFSET_LEFT;
    const y = top - (isInputOrOverride ? OVERLAY_OFFSET_TOP_INPUT : OVERLAY_OFFSET_TOP);
    return { x, y, blurOnClose: true };
  }

  onShowTimingOverlay(e: MouseEvent, i: number) {
    const change = this.stateChanges[i];
    if (!change) return;
    this.activeIndex = i;
    const isInputOrOverride = change.type !== cd.ActionStateType.Style;
    const overlayConfig = this.getOverlayConfig(e, isInputOrOverride);
    const componentRef = this.overlayService.attachComponent(
      RecordTimingOverlayComponent,
      overlayConfig
    );
    componentRef.instance.model = change;
    componentRef.instance.showPin = this.showPin;
    componentRef.instance.boards = this.boards;
    componentRef.instance.designSystem = this.designSystem;
    componentRef.onDestroy(this.onCloseTimingOverlay);

    this._subscription = componentRef.instance.modelChange
      .pipe(takeUntil(this._destroyed))
      .subscribe((model: cd.IActionStateChange) => {
        this.updateRecord.emit([i, model]);
      });

    this._timingOverlayRef = componentRef;
  }

  onCloseTimingOverlay = () => {
    this.activeIndex = -1;
    this._subscription.unsubscribe();
    this._interactionService.highlightElement('');
    this._cdRef.markForCheck();
  };

  onDeleteAllClick(indexes: number[]) {
    const elementId = this._stateChanges[indexes[0]].elementId;
    if (!elementId) return;
    const element = this._propertiesService.getPropertiesForId(elementId);
    const cmpRef = this.showModal<ConfirmationDialogComponent>(ConfirmationDialogComponent);
    cmpRef.instance.title = `Remove all recorded changes to ${element?.name || 'this Element'}?`;
    cmpRef.instance.confirm.pipe(takeUntil(this._destroyed)).subscribe(() => {
      this.deleteMultipleIndexes.emit(indexes);
    });
  }

  onDeleteClick(e: MouseEvent, idx: number) {
    e.stopPropagation();
    e.preventDefault();
    this.deleteRecord.emit(idx);
  }

  onTogglePersist(e: MouseEvent, i: number, model: cd.IActionStateChange) {
    e.stopPropagation();
    e.preventDefault();

    const persist = !(model.persist ?? false);
    const update = { ...model, persist };
    this.updateRecord.emit([i, update]);
  }

  trackByGroupFn(_idx: number, [key, items]: [string, IElementChanges]) {
    return _idx + key + items.changes.length;
  }

  trackByStateFn(idx: number, item: cd.IActionStateChange) {
    return idx + item.key + item.animation?.duration + item.animation?.delay;
  }
}
