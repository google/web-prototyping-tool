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

import type * as cd from 'cd-interfaces';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { ProjectContentService } from './project-content.service';
import { calcChangeRequestInverse } from 'cd-common/utils';

const UNDO_STACK_MAX_LENGTH = 100;

@Injectable({
  providedIn: 'root',
})
export class UndoRedoService {
  private undoStack: cd.IChangeRequest[] = [];
  private redoStack: cd.IChangeRequest[] = [];

  public undoRedoChangeRequest$ = new Subject<cd.IChangeRequest>();

  constructor(private _projectContentService: ProjectContentService) {}

  undo() {
    const undoChange = this.undoStack.pop();
    if (!undoChange) return;

    // Add inverse of undone change to redo stack
    const changeInverse = this.getChangeInverse(undoChange);
    if (!changeInverse) return;
    this.redoStack.push(changeInverse);

    // trigger processing change
    this.undoRedoChangeRequest$.next(undoChange);
  }

  redo() {
    const redoChange = this.redoStack.pop();
    if (!redoChange) return;

    // Add redone change to undo stack
    const changeInverse = this.getChangeInverse(redoChange);
    if (!changeInverse) return;
    this.undoStack.push(changeInverse);

    // trigger processing change
    this.undoRedoChangeRequest$.next(redoChange);
  }

  resetStack() {
    this.undoStack = [];
    this.redoStack = [];
  }

  addChangeToStack(change: cd.IChangeRequest) {
    const changeInverse = this.getChangeInverse(change);
    if (!changeInverse) return;

    this.undoStack.push(changeInverse);
    if (this.undoStack.length > UNDO_STACK_MAX_LENGTH) this.undoStack.shift();

    this.redoStack = [];
  }

  private getChangeInverse = (changeRequest: cd.IChangeRequest): cd.IChangeRequest | undefined => {
    const projectContent = this._projectContentService.getCurrentContent();
    if (!projectContent) return undefined;
    return calcChangeRequestInverse(changeRequest, projectContent);
  };
}
