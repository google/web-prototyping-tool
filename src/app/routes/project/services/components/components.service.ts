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
  ComponentLibrary,
  ICodeComponentDocument,
  IComponent,
  ISymbolProperties,
} from 'cd-interfaces';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { getComponents } from 'cd-common/models';
import { ProjectContentService } from 'src/app/database/changes/project-content.service';

@Injectable({
  providedIn: 'root',
})
export class ComponentsService {
  public symbols$: Observable<ISymbolProperties[]>;
  public codeComponents$: Observable<ICodeComponentDocument[]>;

  public primitiveComponents: IComponent[] = getComponents(ComponentLibrary.Primitive, true);
  public materialComponents: IComponent[] = getComponents(ComponentLibrary.AngularMaterial, true);

  constructor(private _projectContentService: ProjectContentService) {
    this.symbols$ = this._projectContentService.symbolsArray$;
    this.codeComponents$ = this._projectContentService.codeCmpArray$;
  }

  get allComponents() {
    return [...this.materialComponents];
  }
}
