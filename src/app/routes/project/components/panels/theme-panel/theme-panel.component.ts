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

import { Component, ChangeDetectionStrategy, OnDestroy, OnInit } from '@angular/core';
import { deepCopy } from 'cd-utils/object';
import { DESIGN_SYSTEM_MENU, DesignSystemMenu } from '../../../configs/design-system.config';
import { DesignSystemService } from '../../../services/design-system/design-system.service';
import { ProjectContentService } from 'src/app/database/changes/project-content.service';
import { Theme, IconStyle, ICON_FONT_FAMILY, themeFromId } from 'cd-themes';
import { IDesignColorWithId } from './components/theme-color/theme-color.utils';
import { Observable, Subscription } from 'rxjs';
import { Store } from '@ngrx/store';
import { THEMES_MENU } from './theme-panel.config';
import { ICON_DATA_SRC } from 'cd-common/consts';
import * as utils from '../../../utils/style-guide.utils';
import * as cd from 'cd-interfaces';
import * as actions from '../../../store';
import * as uploadUtils from 'cd-utils/files';

@Component({
  selector: 'app-theme-panel',
  templateUrl: './theme-panel.component.html',
  styleUrls: ['./theme-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemePanelComponent implements OnDestroy, OnInit {
  private _subscriptions = new Subscription();
  private _designSystem?: cd.IDesignSystemDocument;
  private _project?: cd.IProject;

  public project$: Observable<cd.IProject | undefined>;
  public designSystem$: Observable<cd.IDesignSystemDocument | undefined>;
  public themeList: cd.ISelectItem[] = [];
  public menuData: cd.IMenuConfig[][] = DESIGN_SYSTEM_MENU;

  constructor(
    private _dsService: DesignSystemService,
    private _projectStore: Store<actions.IProjectState>,

    private _projectContentService: ProjectContentService
  ) {
    this.project$ = this._projectContentService.project$;
    this.designSystem$ = this._projectContentService.designSystem$;
  }

  ngOnInit(): void {
    this._subscriptions.add(this.designSystem$.subscribe(this._onDesignSystemSubscription));
    this._subscriptions.add(this.project$.subscribe(this._onProjectSubscription));
  }

  ngOnDestroy() {
    this._subscriptions.unsubscribe();
  }

  onMenuSelect({ id }: cd.IMenuConfig) {
    if (id === DesignSystemMenu.Export) return this._dsService.exportAsJSON();
    if (id === DesignSystemMenu.ExportVars) return this._dsService.exportAsCSSVars();
    if (id === DesignSystemMenu.Import) return this.importDesignSystem();
    if (id === DesignSystemMenu.GenerateStyle) return this.generateStyleGuide();
    if (id === DesignSystemMenu.GenerateIconBoard) return this.generateIconBoard();
  }

  async importDesignSystem() {
    const files = await uploadUtils.selectFiles([cd.FileMime.JSON]);
    if (!files) return;
    const file = files[0];
    this._dsService.import(file);
  }

  async generateIconBoard() {
    const { _designSystem, _project } = this;
    if (!_designSystem || !_project) return;
    const icons = await fetch(ICON_DATA_SRC, { credentials: 'include' })
      .then((results) => results.json())
      .then((results) => {
        return results.categories.reduce((acc: string[], curr: any) => {
          acc.push(...curr.icons.map((item: { id: string }) => item.id));
          return acc;
        }, []);
      });

    const { id } = _project;
    const payload = utils.generateBoardWithAllIcons(_designSystem, id, icons);
    const action = new actions.BoardCreate(payload.boards, payload.boardContents);
    this._projectStore.dispatch(action);
  }

  generateStyleGuide() {
    const { _designSystem, _project } = this;
    if (!_designSystem || !_project) return;
    const { id } = _project;
    const payload = utils.generateStyleGuideBoard(_designSystem, id);
    const action = new actions.BoardCreate(payload.boards, payload.boardContents);
    this._projectStore.dispatch(action);
  }

  onAddFont(font: cd.IFontFamily) {
    if (!this._designSystem) return;
    const { id } = this._designSystem;
    const fonts = { ...this._designSystem.fonts };
    fonts[font.family] = font;
    const action = new actions.DesignSystemUpdate(id, { fonts });
    this._projectStore.dispatch(action);
  }

  onThemeChange(item: cd.SelectItemOutput) {
    const themeId = (item as cd.ISelectItem).value as Theme;
    const designSystem = themeFromId[themeId]();
    this._projectStore.dispatch(new actions.DesignSystemReplace(designSystem.theme));
  }

  onRemoveFont(fontId: string) {
    this._projectStore.dispatch(new actions.DesignSystemRemoveFont(fontId));
  }

  onRemoveTypeStyle(typeId: string) {
    this._projectStore.dispatch(new actions.DesignSystemRemoveTypography(typeId));
  }

  onSelectIconStyle(style: IconStyle) {
    const { _designSystem } = this;
    if (!_designSystem) return;
    const { id } = _designSystem;
    const fontFamily = ICON_FONT_FAMILY[style];
    const icons = _designSystem.fonts[fontFamily];
    this._projectStore.dispatch(new actions.DesignSystemUpdate(id, { icons }));
  }

  onColorPick(color: IDesignColorWithId) {
    const { id, ...colorItem } = color;
    const { _designSystem } = this;
    if (!id || !_designSystem) return;
    const payload = { colors: { ..._designSystem.colors, [id]: colorItem } };
    this._projectStore.dispatch(new actions.DesignSystemUpdate(_designSystem.id, payload));
  }

  onRemoveColor(colorId: string) {
    this._projectStore.dispatch(new actions.DesignSystemRemoveColor(colorId));
  }

  onTypographyChange(item: cd.ITypographyStyle) {
    const { id, ...typeItem } = item;
    const { _designSystem } = this;
    if (!id || !_designSystem) return;
    const typography = deepCopy(_designSystem.typography);
    typography[id] = typeItem;
    this._projectStore.dispatch(new actions.DesignSystemUpdate(_designSystem.id, { typography }));
  }

  public onTabChanged(newTabIndex: number) {
    console.log('on tab change', newTabIndex);
  }

  private _onDesignSystemSubscription = (ds: cd.IDesignSystemDocument | undefined) => {
    const prevID = this._designSystem && this._designSystem.themeId;
    const newID = ds && ds.themeId;
    this._designSystem = ds;

    if (prevID === newID) return;
    // Build theme menu

    this.themeList = THEMES_MENU.map((item) => {
      const selected = newID === item.value;
      return { ...item, selected };
    });
  };

  private _onProjectSubscription = (project: cd.IProject | undefined) => (this._project = project);

  onVariableChange(item: cd.IDesignVariable) {
    const { id, ...typeItem } = item;
    const { _designSystem } = this;
    if (!id || !_designSystem) return;
    const variables = _designSystem.variables ? deepCopy(_designSystem.variables) : {};
    variables[id] = typeItem;
    this._projectStore.dispatch(new actions.DesignSystemUpdate(_designSystem.id, { variables }));
  }

  onVariableRemove(id: string) {
    this._projectStore.dispatch(new actions.DesignSystemRemoveVariable(id));
  }

  onRemoveCSSChip() {
    this._projectStore.dispatch(new actions.DesignSystemRemoveGlobalCSS());
  }
}
