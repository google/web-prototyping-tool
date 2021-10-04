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
  ViewChild,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import type { ITextInputs } from 'cd-interfaces';
import { PropertyGroupComponent } from '../properties/property-group/property-group.component';

const DEFAULT_EMPTY_STATE_MESSAGE = 'Click to add accessibility notes.';

/**
 * This component powers the Accessiblity notes and Code component description fields.
 * It renders the notes at HTML, and also provides an "edit" button to toggle the rich text editor
 * for editing the HTML.
 */
@Component({
  selector: 'cd-editable-notes',
  templateUrl: './editable-notes.component.html',
  styleUrls: ['./editable-notes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditableNotesComponent {
  public isEditMode = false;

  @Input() title = 'Notes';
  @Input() notes?: string;
  @Input() collapsed = true;
  @Input() emptyStateMessage = DEFAULT_EMPTY_STATE_MESSAGE;

  @Output() notesChange = new EventEmitter<string>();

  @ViewChild(PropertyGroupComponent, { read: PropertyGroupComponent })
  propertyPanelRef!: PropertyGroupComponent;

  onNotesChange({ innerHTML }: ITextInputs) {
    if (this.notes === innerHTML) return;
    this.notesChange.emit(innerHTML as string);
  }

  onToggleEditMode() {
    this.isEditMode = !this.isEditMode;

    if (this.isEditMode) {
      this.propertyPanelRef.collapsePanel(false);
    }
  }
}
