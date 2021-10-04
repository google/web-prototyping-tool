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

import { Injectable } from '@angular/core';
import { IDataFormatterService } from 'cd-common';
import { fromEvent, lastValueFrom } from 'rxjs';
import { map, take } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class FormatDataService implements IDataFormatterService {
  private _formatWorker?: Worker;

  get formatWorker() {
    this._formatWorker ??= new Worker(new URL('./formatter.worker', import.meta.url), {
      type: 'module',
    });
    return this._formatWorker;
  }

  getCallback() {
    return lastValueFrom(
      fromEvent<MessageEvent>(this.formatWorker, 'message').pipe(
        take(1),
        map((e) => e.data as string | false)
      )
    );
  }

  validateJSON(value: string) {
    try {
      return JSON.parse(value);
    } catch (e) {
      return false;
    }
  }

  formatJSON(text: string): Promise<string | false> {
    this.formatWorker?.postMessage({ text });
    return this.getCallback();
  }

  formatJS(text: string): Promise<string | false> {
    this.formatWorker?.postMessage({ text, js: true });
    return this.getCallback();
  }
}
