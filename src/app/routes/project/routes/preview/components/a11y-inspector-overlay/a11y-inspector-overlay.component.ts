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
  ElementRef,
  HostBinding,
  ChangeDetectorRef,
  OnDestroy,
  AfterViewInit,
  OnInit,
} from '@angular/core';
import { fromEvent, Subscription, animationFrameScheduler } from 'rxjs';
import { PreviewInteractionService } from '../../services/preview-interaction.service';
import { ARIA_LEVEL_ATTR, ARIA_ROLE_ATTR, HEADING_TAGS } from 'cd-common/consts';
import { getDefaultAttrValueForRole, getImplicitRoleFromTag } from 'cd-common/utils';
import { auditTime, map, filter } from 'rxjs/operators';
import { IPoint, createPoint } from 'cd-utils/geometry';
import { translate } from 'cd-utils/css';
import * as cd from 'cd-interfaces';

const CURSOR_SIZE = 20;
const DEBOUNCE_TIME = 10;
const OVERLAY_START_POINT = translate(-6000, -6000);

@Component({
  selector: 'app-a11y-inspector-overlay',
  templateUrl: './a11y-inspector-overlay.component.html',
  styleUrls: ['./a11y-inspector-overlay.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class A11yInspectorOverlayComponent implements OnInit, AfterViewInit, OnDestroy {
  private _subscriptions = new Subscription();
  private _hoveredGreenline?: cd.IGreenlineRenderResult;
  private _activeElementId?: string;
  public activeElementProps?: cd.PropertyModel;
  public greenlineDetails?: string;
  public attributesList?: cd.IKeyValue[];

  @Input() elementProperties?: cd.ElementPropertiesMap;

  @HostBinding('class.open') isOverlayOpen = false;
  @HostBinding('style.transform') overlayPosition = OVERLAY_START_POINT;

  constructor(
    private _cdRef: ChangeDetectorRef,
    private _elementRef: ElementRef,
    private _interactionService: PreviewInteractionService
  ) {}

  ngOnInit(): void {
    const { hoveredGreenLine$, hoveredTopLevelElementId$ } = this._interactionService;
    this._subscriptions.add(hoveredGreenLine$.subscribe(this.onHoverGreenlines));
    this._subscriptions.add(hoveredTopLevelElementId$.subscribe(this.onActiveElementId));
  }

  onActiveElementId = (id?: string) => {
    this._activeElementId = id;
    this.activeElementProps = this.getActiveElementProps(id);
    this.attributesList = this.getAttributeList();
    this.manageOverlayVisibility();
    this._cdRef.markForCheck();
  };

  onHoverGreenlines = (greenline?: cd.IGreenlineRenderResult) => {
    this._hoveredGreenline = greenline;
    this.greenlineDetails = this.getGreenlineDetails(greenline);
    this.attributesList = this.getAttributeList();
    this.manageOverlayVisibility();
    this._cdRef.markForCheck();
  };

  ngAfterViewInit(): void {
    const mouseMove$ = fromEvent<MouseEvent>(window, 'mousemove').pipe(
      filter(() => this.isOverlayOpen),
      auditTime(DEBOUNCE_TIME, animationFrameScheduler),
      map(({ clientX, clientY }) => createPoint(clientX, clientY))
    );
    this._subscriptions.add(mouseMove$.subscribe(this.onWindowMouseMove));
  }

  ngOnDestroy(): void {
    this._subscriptions.unsubscribe();
  }

  get overlayElementRect() {
    return this._elementRef?.nativeElement.getBoundingClientRect();
  }

  get overlayHasContent() {
    return !!this.activeElementProps || !!this.greenlineElementInfo;
  }

  get hoveredGreenline() {
    return this._hoveredGreenline;
  }

  get greenlineElementInfo() {
    return this.hoveredGreenline?.info;
  }

  get isGreenlineElement() {
    return !!this.hoveredGreenline;
  }

  /**
   *  Whether the current hovered greenline is a child of a top level component
   */
  get isChildElement() {
    const { hoveredGreenline, _activeElementId } = this;
    if (!hoveredGreenline) return false;
    return hoveredGreenline.id !== _activeElementId;
  }

  /** List of a11y related attributes to display in the annotation. */
  getAttributeList() {
    const elementQueryAttrs = this.greenlineElementInfo?.aria;
    const elementPropModelAttrs = this.activeElementProps?.a11yInputs?.ariaAttrs;

    // Default to query results when possible, or use props model if needed
    // (Note that child result should not display props model for its parent)
    const attrs: cd.IKeyValue[] = elementQueryAttrs?.length
      ? elementQueryAttrs
      : !this.isChildElement && elementPropModelAttrs?.length
      ? elementPropModelAttrs
      : [];

    return attrs;
  }

  /** Annotation footer text */
  getGreenlineDetails(greenline?: cd.IGreenlineRenderResult) {
    if (!greenline) return;
    const type = greenline.type;
    const order = greenline.order;
    const role = this.getElementRoleFromGreenline(greenline);
    const level = this.getElementHeadingLevelFromGreenline(greenline);
    if (type === cd.GreenlineType.Flow) return order ? `Tab flow ${order}` : 'Tab group';
    if (type === cd.GreenlineType.GroupChild) return 'Tab group child';
    if (type === cd.GreenlineType.Landmark) return `Landmark: ${role}`;
    if (type === cd.GreenlineType.Heading) return `Heading level ${level}`;
    return '';
  }

  getElementRoleFromGreenline(greenline: cd.IGreenlineRenderResult) {
    const elementDefinedRoleAttr =
      (greenline.info?.aria?.find((a) => a.name === ARIA_ROLE_ATTR)?.value as string) || '';
    const elementTag = greenline.info?.tag;
    const elementImplicitTagRole = elementTag ? getImplicitRoleFromTag(elementTag) : '';
    return elementDefinedRoleAttr || elementImplicitTagRole;
  }

  getElementHeadingLevelFromGreenline(greenline: cd.IGreenlineRenderResult) {
    const elementDefinedLevelAttr = greenline.info?.aria?.find(
      (a) => a.name === ARIA_LEVEL_ATTR
    )?.value;
    // Use heading tags to determine implicit aria-level
    const elementTag = greenline.info?.tag || '';
    const tagImplicitLevel = HEADING_TAGS.indexOf(elementTag) + 1;
    // or default to role implicit
    const elementRole = this.getElementRoleFromGreenline(greenline);
    const implicitRoleLevel = elementRole
      ? getDefaultAttrValueForRole(elementRole, ARIA_LEVEL_ATTR)
      : '';
    return elementDefinedLevelAttr || tagImplicitLevel || implicitRoleLevel;
  }

  onWindowMouseMove = (mousePoint: IPoint) => {
    this.overlayPosition = this.getOverlayPosition(mousePoint);
    this._cdRef.markForCheck();
  };

  getActiveElementProps(elementId?: string): cd.PropertyModel | undefined {
    if (!this.elementProperties || !elementId) return;
    return this.elementProperties[elementId];
  }

  manageOverlayVisibility() {
    if (this.overlayHasContent) this.revealOverlay();
    else this.hideOverlay();
  }

  revealOverlay() {
    this.isOverlayOpen = true;
  }

  hideOverlay() {
    this.isOverlayOpen = false;
  }

  getOverlayPosition({ x, y }: IPoint): string {
    if (!this.isOverlayOpen) return OVERLAY_START_POINT;
    const { innerWidth, innerHeight } = window;
    const { width, height } = this.overlayElementRect;
    const overlayX = this.getCoordinate(x, width, innerWidth);
    const overlayY = this.getCoordinate(y, height, innerHeight);
    return translate(overlayX, overlayY);
  }

  getCoordinate(pos: number, overlaySize: number, containerSize: number): number {
    const position = pos + CURSOR_SIZE;
    const overEdge = position + overlaySize > containerSize;
    return overEdge ? containerSize - overlaySize : position;
  }
}
