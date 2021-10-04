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

import { Directive, Input, TemplateRef, ViewContainerRef, AfterViewChecked } from '@angular/core';

/** @experimental */
@Directive({
  selector: '[cdUpdateTag]',
})
export class UpdateTagDirective implements AfterViewChecked {
  constructor(private templateRef: TemplateRef<any>, private viewRef: ViewContainerRef) {}

  private _tagName = '';
  private _needsUpdate = false;

  @Input('cdUpdateTag')
  set tagName(tagName: string) {
    this._tagName = tagName;
    this._needsUpdate = true;
    this.viewRef.clear();
    const element = this.getElement();
    element.parentNode?.removeChild(element);
    this.viewRef.createEmbeddedView(this.templateRef);
  }

  ngAfterViewChecked() {
    if (!this._needsUpdate) return;
    this.updateTemplate();
    this._needsUpdate = false;
  }

  /** Gets the actual element being updated. */
  private getElement(): HTMLElement {
    // Native element here is an angular binding comment. The actual element
    // for which the tag should be updated, is is the previous sibling element
    const nativeEl = this.templateRef.elementRef.nativeElement;
    return nativeEl.previousElementSibling;
  }

  /** Creates a copy of the element with different tag name, and replaces original. */
  private updateTemplate() {
    const origElement = this.getElement();

    if (origElement) {
      const element = document.createElement(this._tagName);
      element.innerHTML = origElement.innerHTML;

      // Copy all attributes
      for (let i = 0; i < origElement.attributes.length; i++) {
        element.setAttribute(origElement.attributes[i].name, origElement.attributes[i].value);
      }

      origElement.parentNode?.replaceChild(element, origElement);
    }
  }
}
