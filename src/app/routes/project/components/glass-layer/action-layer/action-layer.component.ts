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
  OnChanges,
  SimpleChanges,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  HostListener,
} from '@angular/core';
import { IProjectState, PanelSetPropertyPanelState } from '../../../store';
import { InteractionService } from '../../../services/interaction/interaction.service';
import { CanvasService } from '../../../services/canvas/canvas.service';
import { PropertiesService } from '../../../services/properties/properties.service';
import { Subscription } from 'rxjs';
import { Store } from '@ngrx/store';
import * as utils from './action-layer.utils';
import * as cd from 'cd-interfaces';
import { ProjectContentService } from 'src/app/database/changes/project-content.service';

const STROKE_WIDTH = 1.5;
const END_FRAME_PADDING = 10;
const START_FRAME_PADDING = 0;

@Component({
  selector: 'g[app-action-layer]',
  templateUrl: './action-layer.component.html',
  styleUrls: ['./action-layer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionLayerComponent implements OnChanges, OnInit, OnDestroy {
  private _subscriptions = Subscription.EMPTY;
  public actions: utils.IActionPath[] = [];
  public strokeWidth = STROKE_WIDTH;
  public outletFrameMap: cd.RenderRectMap = new Map();
  public selectedIds = new Set<string>();

  @Input() selection: cd.RenderElementMap = new Map();
  @Input() renderRects: cd.RenderRectMap = new Map();
  @Input() outletFrames: cd.IRenderResult[] = [];
  @Input() zoom = 1;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.zoom) {
      this.strokeWidth = STROKE_WIDTH / this.zoom;
    }
    if (changes.selection) {
      this.selectedIds = new Set(Array.from(this.selection.values()).flat());
    }
    if (changes.outletFrames) {
      this.outletFrameMap = this.outletFrames.reduce(
        (acc, curr) => acc.set(curr.id, curr),
        new Map()
      );
    }
    if (changes.renderRects || changes.outletFrames || changes.selection) {
      this.updateLines();
    }
  }

  constructor(
    private _cdRef: ChangeDetectorRef,
    private _projectStore: Store<IProjectState>,
    private _projectContentService: ProjectContentService,
    private _interactionService: InteractionService,
    private _propertiesService: PropertiesService,
    private _canvasService: CanvasService
  ) {}

  ngOnDestroy(): void {
    this._subscriptions.unsubscribe();
  }

  ngOnInit(): void {
    const { elementProperties$ } = this._projectContentService;
    this._subscriptions = elementProperties$.subscribe(this.onActionElements);
  }

  onActionElements = (elements: cd.ElementPropertiesMap) => {
    this.actions = utils.buildActionsFromProps(elements);
    this.updateLines();
  };

  get mergedRenderMap() {
    return new Map([...this.renderRects, ...this.outletFrameMap]);
  }

  get hasSelection() {
    return this.selectedIds.size > 0;
  }

  updateLines() {
    const { mergedRenderMap, actions, selectedIds } = this;
    if (!selectedIds.size) return;

    for (const action of actions) {
      const frames = utils.getStartAndEndFrames(mergedRenderMap, action);
      if (!frames) continue;
      if (!selectedIds.has(action.from) && !selectedIds.has(action.to)) continue;
      const { startFrame, endFrame } = frames;
      const endFrameWithPadding = utils.paddFrame(endFrame, END_FRAME_PADDING);
      const startFrameWithPadding = utils.paddFrame(startFrame, START_FRAME_PADDING);
      const startCompass = utils.generateCompassPoints(startFrameWithPadding);
      const endCompass = utils.generateCompassPoints(endFrameWithPadding);
      const { start, end } = utils.generateStartAndEndPoints(startCompass, endCompass);
      action.path = utils.buildPath(start, end);
      action.fromRect = startFrameWithPadding;
    }

    this._cdRef.markForCheck();
  }

  @HostListener('click', ['$event'])
  onClick(e: MouseEvent) {
    const polyLineElement = e.target as SVGPolylineElement;
    const actionIdx = polyLineElement?.dataset?.actionidx;
    if (actionIdx === undefined) return;
    const action = this.actions[Number(actionIdx)];
    if (!action) return;
    this._interactionService.toggleElements([action.from], false, false);
    this.showActionsPanel();
    this.snapToBoards(action.from, action.to);
  }

  showActionsPanel() {
    const action = new PanelSetPropertyPanelState(cd.PropertyPanelState.Actions);
    this._projectStore.dispatch(action);
  }

  rootIdElementForId(id: string) {
    const fromElement = this._propertiesService.getPropertiesForId(id);
    return fromElement?.rootId;
  }

  snapToBoards(from: string, to: string) {
    const fromRoot = this.rootIdElementForId(from);
    if (!fromRoot) return;
    const boards = this._propertiesService.getPropertiesForIds(fromRoot, to);
    this._canvasService.snapToBoard(boards as cd.IBoardProperties[]);
  }

  trackFn(_idx: number, action: utils.IActionPath) {
    return action.id;
  }
}
