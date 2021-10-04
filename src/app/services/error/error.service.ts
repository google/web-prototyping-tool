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

import { Injectable, ErrorHandler, Injector } from '@angular/core';
import { ToastsService } from '../toasts/toasts.service';
import { HttpErrorResponse } from '@angular/common/http';
import { IError } from 'src/app/routes/project/interfaces/error.interface';
import { AnalyticsService } from '../analytics/analytics.service';
import { CODE_COMPONENT_ERROR_PREFIX } from 'cd-interfaces';
import { formatStringWithArguments } from 'cd-utils/string';
import { environment } from 'src/environments/environment';
import type { StackFrame } from 'stacktrace-js';

const CHUNK_FAILED_MESSAGE = /Loading chunk [\d]+ failed/;
const OFFLINE_HOTFIX = 'client is offline';
const RENDERER_ERROR_PREFIX = 'Renderer Error: ';
const DEFAULT_BRANCH = 'master';
const BRANCH_REGEX = /https:\/\/([\w|-]*)-dot-/;
const WEBPACK_PREFIX_REGEX = /^webpack:\/\//;
const SRC_PREFIX = '/src';
const DIST_PREFIX = '/dist';

/** Params: function, file path, line, column, source URL */
const CODE_LINE_FORMAT = 'at {0}()  ({1} - line: {2}, col: {3})\n{4}';

/** Params: branch, file path, line */
const SOURCE_URL_FORMAT = ' ⇨ /{0}:{1};l={2}\n';

/** Start removing decompiled cached stack traces after this value. */
const MAXIMUM_CACHED_STACKS = 30;

/** Caches decompiled stack traces with their decompiled stacks as the key. */
const stackCache = new Map<string, string>();

@Injectable()
export class ErrorService implements ErrorHandler {
  private errorToastsDisabled = true;

  constructor(private _injector: Injector, private _analyticsService: AnalyticsService) {}

  async handleError(error: Error | HttpErrorResponse) {
    if (CHUNK_FAILED_MESSAGE.test(error.message)) {
      window.location.reload();
      return;
    }

    // Offline/Network error
    if (error instanceof HttpErrorResponse) {
      if (!navigator.onLine) {
        const offlineMsg = `OFFLINE: ${error?.message}`;
        this.reportError(offlineMsg, true);
      } else {
        this.reportError(error.message, true);
      }
      console.error(error);
    }

    // Normal error
    else {
      if (error.stack && environment.stackLoggingEnabled) {
        const decompiledStack = await this.getDecompiledStack(error);
        this.reportError(error.message, false, decompiledStack);
        console.error(decompiledStack);
      } else {
        this.reportError(error.message, false);
        console.error(error);
      }
    }
  }

  private reportError(message: string, silent: boolean, stack?: string) {
    if (!message) return;
    if (!silent) this.sendErrorToast(message);
    this._analyticsService.sendError(message, stack);
  }

  public addError(error: IError) {
    this.reportError(error.message, false);
  }

  // TODO: Should we pass in the renderer error stack?
  public addRendererError(error: IError) {
    const message = `${RENDERER_ERROR_PREFIX}${error.message}`;
    this.reportError(message, false);
  }

  public addCodeComponentError(error: IError) {
    const message = `${CODE_COMPONENT_ERROR_PREFIX}${error.message}`;
    this.reportError(message, false);
  }

  public sendErrorToast(message: string) {
    // TEMP - disable all error toasts for now
    // TODO - when should we ever show an error toast to users?
    if (this.errorToastsDisabled) return;

    /// HOTFIX / TODO TEMP fix to not show a toast
    if (message.includes(OFFLINE_HOTFIX)) return;
    /////////////////////////////////////////////////////////////
    const toastService = this._injector.get(ToastsService);
    if (!toastService) return;
    const toastId = toastService.generateIdFromString(message);
    const toast = { message, iconName: 'error' };
    toastService.addToast(toast, toastId);
  }

  /**
   * Translates compiled stacktrace to readable format by fetching remote source maps.
   * Decompiled stacks are cached to reduce duplicate parsing of source maps.
   */
  private async getDecompiledStack(error: Error): Promise<string> {
    if (!error.stack) return '';

    // Decompiled stack may be cached
    if (stackCache.has(error.stack)) return stackCache.get(error.stack) as string;

    // Dynamically load StackTraceJS
    const StackTrace = await import('stacktrace-js');

    // Decompiles stacktrace by loading/parsing source map
    const stack: StackFrame[] = await StackTrace.fromError(error);

    // Generate readable stacktrace
    const title = error.message.split('\n')[0];
    const decompiledStack = stack.reduce<string>((curr: string, frame: StackFrame) => {
      const file = frame?.fileName || '';
      const { functionName, lineNumber, columnNumber } = frame;
      let path = file.replace(WEBPACK_PREFIX_REGEX, '');
      if (path.startsWith(location.origin)) path = file.replace(location.origin, '');

      // Add source URL to stack if not not local
      const url = this.getSourceUrlFromPath(path, lineNumber);

      const line = formatStringWithArguments(
        CODE_LINE_FORMAT,
        functionName,
        path,
        lineNumber,
        columnNumber,
        url
      );
      return curr + line;
    }, `${title}\n`);

    // Cache decompiled stack
    stackCache.set(error.stack, decompiledStack);

    // Remove oldest entry if max has been reached
    if (stackCache.size > MAXIMUM_CACHED_STACKS) {
      const firstKey = stackCache.entries().next().value[0];
      stackCache.delete(firstKey);
    }

    return decompiledStack;
  }

  /** Returns the current branch name based on the URL. Defaults to master. */
  private getBranch(): string {
    const match = location.href.match(BRANCH_REGEX);
    if (match && match.length === 2) {
      return match[1]; // Branch name
    }
    return DEFAULT_BRANCH;
  }

  private getSourceUrlFromPath(path: string, lineNumber: number | undefined): string {
    if (path.startsWith(DIST_PREFIX)) {
      path = path.replace(DIST_PREFIX, '');
      return formatStringWithArguments(SOURCE_URL_FORMAT, this.getBranch(), path, lineNumber || 0);
    }
    if (path.startsWith(SRC_PREFIX)) {
      return formatStringWithArguments(SOURCE_URL_FORMAT, this.getBranch(), path, lineNumber || 0);
    }
    return '';
  }
}
