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

import { STYLE_TAG, IMG_TAG, RENDER_RECT_MARKER_CLASS } from 'cd-common/consts';
import { map, filter, debounceTime } from 'rxjs/operators';
import { fromEvent, merge, Observable } from 'rxjs';

const cacheUrl = (cache: Set<string>, src: string): boolean => {
  const loaded = cache.has(src);
  if (!loaded) cache.add(src);
  return loaded;
};

/**
 *  Capture all "load" events on document, capture = true is required.
 *  This is to ensure if any image, font, etc loads on the page that we update the render.
 * */
export const captureLoadEvents = (doc: HTMLDocument, cache: Set<string>): Observable<any[]> => {
  return fromEvent(doc, 'load', { capture: true }).pipe(
    map((e) => {
      const target: any = e.target;
      const src = target.src || target.href;
      const tagName = target.tagName.toLowerCase();
      return [src, tagName];
    }),
    filter(([, tagName]) => [STYLE_TAG, IMG_TAG].includes(tagName)),
    filter(([src, tagName]) => {
      const notCached = src && !cacheUrl(cache, src);
      return tagName === STYLE_TAG || notCached;
    })
  );
};

export const captureTransitionEvents = (doc: HTMLDocument) => {
  return merge(fromEvent(doc, 'transitionend'), fromEvent(doc, 'animationend')).pipe(
    map((e) => e.target as HTMLElement),
    filter((target) => target.classList.contains(RENDER_RECT_MARKER_CLASS))
  );
};

export const captureAllTransitionEvents = (doc: HTMLDocument, timeout: number) => {
  return merge(fromEvent(doc, 'transitionend'), fromEvent(doc, 'animationend')).pipe(
    map((e) => e.target as HTMLElement),
    debounceTime(timeout)
  );
};
