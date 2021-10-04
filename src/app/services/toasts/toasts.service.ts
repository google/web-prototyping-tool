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
import { BehaviorSubject } from 'rxjs';
import { createId } from 'cd-utils/guid';
import type { IToast } from 'cd-interfaces';

const DISMISS_LABEL = 'Dismiss';
const WORD_COUNT_REGEX = /[^\s]+/g;

@Injectable({
  providedIn: 'root',
})
export class ToastsService {
  public toasts$ = new BehaviorSubject<IToast[]>([]);

  // TEMP, add flag for disabling toasts in embed mode
  public disableToasts = false;

  hasToastForId(id: string | undefined, activeToasts: IToast[]) {
    return id && activeToasts.find((t) => t.id === id);
  }

  generateIdFromString(msg: string, max = 24): string {
    const limit = Math.min(msg.length, Math.max(max, 0));
    return msg.substr(0, limit).replace(/\s/g, '-');
  }

  addToast(toast: Partial<IToast>, toastId?: string): string {
    if (this.disableToasts) return '';

    const activeToasts = this.toasts$.getValue();
    if (this.hasToastForId(toastId, activeToasts)) return '';

    // If duration is not provided, calculate based on:
    // word count * .5s + 2s
    if (toast.duration === undefined && toast.message) {
      const wordCount = toast.message.match(WORD_COUNT_REGEX)?.length || 0;
      toast.duration = (wordCount * 0.5 + 2) * 1000;
    }

    // Show dismiss label by default
    if (!toast.dismissLabel && !toast.hideDismiss) {
      toast.dismissLabel = DISMISS_LABEL;
    }

    // Hide dismiss
    if (toast.hideDismiss) {
      delete toast.dismissLabel;
    }

    const id = toastId || toast.id || createId();
    const added: IToast = { ...toast, id } as IToast;
    const newToasts = [...this.toasts$.getValue(), added];
    this.toasts$.next(newToasts);

    return id;
  }

  removeToast(id: string) {
    const newToasts = this.toasts$.getValue().filter((toast) => toast.id !== id);
    this.toasts$.next(newToasts);
  }

  updateToastMessage(id: string, newMessage: string) {
    const newToasts = [...this.toasts$.getValue()];
    const toast = newToasts.find((t) => t.id === id);
    if (!toast) return;
    toast.message = newMessage;
    this.toasts$.next(newToasts);
  }
}
