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
import { Store } from '@ngrx/store';
import { ProjectContentService } from 'src/app/database/changes/project-content.service';
import { ToastsService } from 'src/app/services/toasts/toasts.service';
import { IProjectState } from '../../store/reducers';
import { DesignSystemReplace } from '../../store/actions';
import { downloadJsonAsFile, downloadStringAsFile } from 'cd-utils/files';
import { generateCSSVars } from 'cd-common/utils';
import { FontKind } from 'cd-metadata/fonts';
import * as cd from 'cd-interfaces';
import { firstValueFrom } from 'rxjs';

const DESIGN_SYSTEM_VARS_FILE = 'design-system-vars.css';
const DESIGN_SYSTEM_JSON_FILE = 'design-system.json';
const THEME_KEYS = ['colors', 'fonts', 'icons', 'id', 'projectId', 'themeId', 'type', 'typography'];
const IMPORT_TOAST = {
  message: 'Design system imported',
  iconName: 'done',
};

@Injectable({
  providedIn: 'root',
})
export class DesignSystemService {
  constructor(
    private _projectStore: Store<IProjectState>,
    private _toastService: ToastsService,
    private _projectContentService: ProjectContentService
  ) {}

  import(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const { result } = reader;
      if (!result) return;
      const theme = JSON.parse(result as string);
      if (!this.isThemeValid(theme)) return;
      this._projectStore.dispatch(new DesignSystemReplace(theme));
      this._toastService.addToast(IMPORT_TOAST);
    };

    reader.readAsText(file);
  }

  getTheme() {
    return firstValueFrom(this._projectContentService.designSystem$);
  }

  isThemeValid(theme: any): boolean {
    return !Object.keys(theme).every((key) => THEME_KEYS.includes(key));
  }

  async exportAsCSSVars() {
    const theme = await this.getTheme();
    if (!theme) return;

    const vars = generateCSSVars(theme)
      .map((item) => `  ${item.join(':')};`)
      .join('\n');

    const output = `:root{\n${vars}\n}`;
    downloadStringAsFile(output, DESIGN_SYSTEM_VARS_FILE);
  }

  excludeSystemFonts(fonts: cd.IStringMap<cd.IFontFamily>): cd.IStringMap<cd.IFontFamily> {
    return Object.entries(fonts).reduce<cd.IStringMap<cd.IFontFamily>>((acc, curr) => {
      const [key, value] = curr;
      if (value.kind !== FontKind.System) {
        acc[key] = value;
      }
      return acc;
    }, {});
  }

  async exportAsJSON() {
    const theme = await this.getTheme();
    if (!theme) return;
    const { id, projectId, ...designSystem } = theme;

    designSystem.fonts = this.excludeSystemFonts(designSystem.fonts);
    downloadJsonAsFile(designSystem, DESIGN_SYSTEM_JSON_FILE);
  }
}
