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

import { DATA_CHIP_LOOKUP_ATTR, DATA_CHIP_SOURCE_ATTR, DATA_CHIP_TAG } from 'cd-common/consts';
import { createDataBoundValue, lookupDataBoundValue } from 'cd-common/utils';
import type { IDataChipInputs } from 'cd-interfaces';
import { Subscription } from 'rxjs';
import { rendererState } from '../../app/state.manager';
import { debounceTime } from 'rxjs/operators';

const UPDATE_DEBOUNCE = 4;

/**
 * Register the data chip custom element inside a give render outlet
 *
 * In order to create custom element for a given render outlet, we need to extend the HTML element
 * of the outletDocumnet. Each HTMLDocument has its own HTMLElement class
 */
export const registerDataChipCustomElement = (outletDocument: HTMLDocument) => {
  const win = outletDocument.defaultView;
  const OutletHTMLElementCtor = win?.HTMLElement;
  if (!win || !OutletHTMLElementCtor) return;

  class DataChipElement extends OutletHTMLElementCtor implements IDataChipInputs {
    static get observedAttributes() {
      return [DATA_CHIP_SOURCE_ATTR, DATA_CHIP_LOOKUP_ATTR];
    }

    subscribed = false;
    source?: string;
    lookup?: string;

    private subscriptions = new Subscription();
    private _currentInnerHtml = '';

    constructor() {
      super();

      this.subscribeToData();
      this.style.display = 'contents';
    }

    attributeChangedCallback(attrName: string, oldValue: string, newValue: string) {
      if (oldValue === newValue) return;
      if (attrName === DATA_CHIP_SOURCE_ATTR) this.source = newValue;
      if (attrName === DATA_CHIP_LOOKUP_ATTR) this.lookup = newValue;
      this.update();
    }

    disconnectedCallback() {
      this.unsubscribe();
    }

    connectedCallback() {
      /**
       * It is possible for connectedCallback to be called  while disconnected. This check ensure
       * the chip is actually connected before subscribing
       * https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements#Using_the_lifecycle_callbacks
       */
      if (this.isConnected) {
        this.subscribeToData();
      }
    }

    adoptedCallback() {
      this.subscribeToData();
    }

    private subscribeToData() {
      const { subscriptions, update, subscribed } = this;
      if (subscribed) return;
      this.subscribed = true;

      const { dataLoaded$, dataBindingRefreshTrigger$ } = rendererState;
      /**
       * Add debounce to refresh trigger to prevent perf issue if there are alot of
       * chips on the page. dataLoaded$ fires infrequently, so a debounce is not really needed
       */
      const refreshDebounce$ = dataBindingRefreshTrigger$.pipe(debounceTime(UPDATE_DEBOUNCE));
      subscriptions.add(dataLoaded$.subscribe(update));
      subscriptions.add(refreshDebounce$.subscribe(update));
    }

    private unsubscribe() {
      this.subscriptions.unsubscribe();
      this.subscribed = false;
    }

    /** Prevent setting new innerHTML unless string has actually changed */
    private setInnerHtml(html: string) {
      const { _currentInnerHtml } = this;
      if (_currentInnerHtml === html) return;
      this._currentInnerHtml = html;
      this.innerHTML = html;
    }

    update = () => {
      const { source, lookup } = this;
      if (!source || !lookup) return this.setInnerHtml('');
      const value = createDataBoundValue(source, lookup);
      const { loadedData, mergedProperties } = rendererState;
      const lookupValue = lookupDataBoundValue(value, mergedProperties, loadedData);
      return this.setInnerHtml(lookupValue ?? '');
    };
  }

  /** Define data-chip custom element in outlet window */
  win.customElements.define(DATA_CHIP_TAG, DataChipElement as any);
};
