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

import { Directive, Input, Renderer2, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { IRichTooltip } from 'cd-interfaces';
import {
  DIV_TAG,
  HREF_ATTR,
  INNER_HTML,
  SPAN_TAG,
  TARGET_ATTR,
  REL_ATTR,
  WindowTarget,
} from 'cd-common/consts';
import { UnitTypes } from 'cd-metadata/units';

const OFFSET_Y = 8;
/**
 * Defined in src/app/styles/tooltip.scss
 * DO NOT CHANGE THESE VALUES,
 * THEY ARE NAMESPACED ON PURPOSE BECAUSE THEY'RE GLOBAL
 */
const RICH_TOOLTIP_CLASS = 'cd-richtooltip'; // DO NOT CHANGE
const RICH_TOOLTIP_ERROR_CLASS = 'cd-richtooltip-error'; // DO NOT CHANGE

@Directive({ selector: '[cdRichTooltip]' })
export class RichTooltipDirective implements OnDestroy {
  private _element?: HTMLElement;

  @Input() cdRichTooltip?: IRichTooltip;
  @Input() errorTooltip = false;

  constructor(private _renderer: Renderer2, private _cdRef: ChangeDetectorRef) {}

  ngOnDestroy(): void {
    this.cleanupElement();
  }

  cleanupElement() {
    if (!this._element) return;
    this._renderer.removeChild(document.body, this._element);
    this._element = undefined;
    this._cdRef.markForCheck();
  }

  buildTooltip({ text, linkText, link }: IRichTooltip) {
    const { _renderer } = this;
    const element = _renderer.createElement(DIV_TAG);
    _renderer.addClass(element, RICH_TOOLTIP_CLASS);
    if (this.errorTooltip) _renderer.addClass(element, RICH_TOOLTIP_ERROR_CLASS);
    _renderer.listen(element, 'click', this.onClose);
    // SPAN
    const textSpan = _renderer.createElement(SPAN_TAG);
    _renderer.setProperty(textSpan, INNER_HTML, text);
    _renderer.appendChild(element, textSpan);
    // Link
    if (link && linkText) {
      const linkHref = _renderer.createElement('a');
      _renderer.setProperty(linkHref, 'textContent', linkText);
      _renderer.setProperty(linkHref, HREF_ATTR, link);
      _renderer.setProperty(linkHref, TARGET_ATTR, WindowTarget.Blank);
      _renderer.setProperty(linkHref, REL_ATTR, 'noopener noreferrer');
      _renderer.appendChild(element, linkHref);
    }
    return element;
  }

  get active() {
    return this._element !== undefined;
  }

  show(parentRect: DOMRect) {
    const { cdRichTooltip } = this;
    if (!cdRichTooltip) return;
    const element = this.buildTooltip(cdRichTooltip);
    document.body.appendChild(element);
    const elementRect = element.getBoundingClientRect();
    const x = parentRect.left - elementRect.width + parentRect.width;
    const y = parentRect.top - elementRect.height - OFFSET_Y;
    const adjustedY = y < 0 ? parentRect.top + parentRect.height + OFFSET_Y : y;

    element.style.top = `${adjustedY}${UnitTypes.Pixels}`;
    element.style.left = `${x}${UnitTypes.Pixels}`;
    this._renderer.addClass(element, 'show');
    this._element = element;
  }

  onClose = (_e: MouseEvent) => {
    this.cleanupElement();
  };
}
