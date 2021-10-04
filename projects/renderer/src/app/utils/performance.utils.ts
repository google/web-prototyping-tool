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

import { environment } from '../../environments/environment';

export const PerfEvent = {
  JitStart: 'jit-start',
  JitEnd: 'jit-end',
  JitLibStart: 'jit-lib-start',
  JitLibEnd: 'jit-lib-end',
  ChangeDetection: 'cd',
  RequestChangeDetection: 'request-cd',
  RequestRenderRects: 'request-rects',
  RenderRects: 'rects',
  PreviewMode: 'preview-mode',
};

if (!environment.production) {
  const renderChannel = new BroadcastChannel('render-channel');

  const enum Perf {
    Measure = 'measure',
    Mark = 'mark',
    Resource = 'resource',
    Paint = 'paint',
    Element = 'element',
    LongTask = 'longtask',
  }
  const entryTypes = [
    Perf.Measure,
    Perf.Mark,
    Perf.Resource,
    // Perf.Paint,
    // Perf.Element,
    // Perf.LongTask,
  ];

  new PerformanceObserver((list) => {
    const items = list
      .getEntries()
      .map(({ entryType, name, duration }) => ({ entryType, name, duration }));
    renderChannel.postMessage(items);

    list.getEntries().forEach((entry) => {
      if (entry.entryType === Perf.Measure) {
        const suffix = entry.duration ? ` - ${entry.duration}` : '';
        console.log(`${entry.entryType} - ${entry.name}${suffix}`);
      }
    });
  }).observe({
    entryTypes,
  });
}
