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
  ChangeDetectorRef,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { createId } from 'cd-utils/guid';
import { Observable, Subscription } from 'rxjs';
import { RendererService } from '../../services/renderer/renderer.service';
import { themeFromId, Theme, TextType } from 'cd-themes';
import { createInstance } from 'cd-common/models';
import * as config from './configs/audit.config';
import * as themePanel from '../project/components/panels/theme-panel/theme-panel.config';
import * as utils from './audit.utils';
import * as appStore from '../../store';
import * as cd from 'cd-interfaces';
import { createChangeMarker } from 'cd-common/utils';

const PROJECT_ID = 'audit-project';

@Component({
  selector: 'app-audit',
  templateUrl: './audit.component.html',
  styleUrls: ['./audit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditComponent implements OnInit, OnDestroy {
  private _subscriptions = new Subscription();
  public projectId = PROJECT_ID;
  public settings$: Observable<cd.IUserSettings>;
  public themeOptions = themePanel.THEMES_MENU;
  public selectItems = utils.generateAuditPageSelectList();
  public selectedItem?: cd.ISelectItem;
  public currentTheme?: cd.ISelectItem;
  public designSystem?: cd.IDesignSystem;

  get configList(): config.IAuditView[] {
    const { selectedItem } = this;
    if (!selectedItem) return [];

    return [utils.getAuditViewForComponent(selectedItem.value)];
  }

  constructor(
    private _appStore: Store<appStore.IAppState>,
    private _rendererService: RendererService,
    private _activatedRoute: ActivatedRoute,
    private _router: Router,
    private _cdRef: ChangeDetectorRef
  ) {
    this.settings$ = this._appStore.pipe(select(appStore.getUserSettings));
  }

  ngOnInit() {
    this._subscriptions.add(this._activatedRoute.queryParams.subscribe(this.onQueryParams));
    this._subscriptions.add(
      this._rendererService.rendererInitialized$.subscribe(this._onRendererInitialization)
    );
  }

  ngOnDestroy() {
    this._subscriptions.unsubscribe();
  }

  private _onRendererInitialization = (initialized: boolean) => {
    if (!initialized) return;
    if (!this.currentTheme) {
      this.updateTheme(themePanel.THEMES_MENU_DEFAULT);
    }

    if (!this.selectedItem) {
      this.updateSelectedComponent(this.selectItems[0]);
    }

    this._rendererService.setPreviewMode(true);
    this._cdRef.markForCheck();
  };

  private onQueryParams = (params: Params) => {
    const { themeId, componentId } = params;

    if (!!themeId && themeId !== this.currentTheme?.value) {
      const item = this.themeOptions.find((option) => option.value === themeId);
      if (!item) return;
      this.updateTheme(item);
    }

    if (!!componentId && componentId !== this.selectedItem?.value) {
      const item = this.selectItems.find((option) => option.value === componentId);
      if (!item) return;
      this.updateSelectedComponent(item);
    }

    this._cdRef.markForCheck();
  };

  private updateTheme(selectedTheme: cd.ISelectItem) {
    this.currentTheme = selectedTheme;
    this._cdRef.markForCheck();
    const themeId = selectedTheme.value as Theme;
    const theme = themeFromId[themeId]();
    this.designSystem = theme.theme;
    this.setDesignSystem();
    const isDarkTheme = selectedTheme.title.includes('Dark');
    this.onThemeToggle(!isDarkTheme);
    this.addElementsFromConfig();
  }

  private updateSelectedComponent(item: cd.ISelectItem) {
    this.selectedItem = item;
    this._cdRef.markForCheck();
    this.addElementsFromConfig();
  }

  private setDesignSystem() {
    const { projectId, designSystem } = this;
    if (!designSystem) return;
    const designSystemDoc: cd.IDesignSystemDocument = {
      ...designSystem,
      type: cd.EntityType.DesignSystem,
      projectId,
      id: 'test-design-system',
      changeMarker: createChangeMarker(),
    };
    this._rendererService.setDesignSystem(designSystemDoc);
  }

  private addElementsFromConfig() {
    const { projectId, designSystem, selectedItem } = this;
    if (!designSystem || !selectedItem) return;

    const parsedSections: utils.IParsedSections = this.configList.reduce((acc, curr, index) => {
      // Per section, create generic element group for section and keep track
      // of section ids for child ids of board
      const { typography } = designSystem;
      const { title, variants, elementType, columnWidth: columnWidth } = curr;

      const titleHeaderId = createId();
      const titleHeaderFactory = createInstance(
        cd.ElementEntitySubType.Text,
        projectId,
        titleHeaderId
      )
        .addInputs<cd.ITextInputs>({ innerHTML: title })
        .assignFont(typography[TextType.Headline4], TextType.Headline4);

      if (index > 0) {
        titleHeaderFactory.assignPadding(100);
      }

      const titleHeader = titleHeaderFactory.build();

      const { sectionIds, propModels } = utils.generateSectionsForVariants(
        variants,
        projectId,
        elementType,
        columnWidth
      );

      return {
        sectionIds: [...acc.sectionIds, titleHeaderId, ...sectionIds],
        propModels: [...acc.propModels, titleHeader, ...propModels],
      };
    }, utils.getBlankIParsedSections());

    const { sectionIds: allSectionIds, propModels: allPropModels } = parsedSections;

    const board = createInstance(cd.ElementEntitySubType.Board, projectId, selectedItem.value)
      .assignPadding(10, 10, 10, 10)
      .assignChildIds(allSectionIds)
      .assignOverflow(cd.Overflow.Auto, cd.Overflow.Auto)
      .assignBackgroundColor('var(--cd-background-color)')
      .build();

    this._rendererService.addElementProperties([board, ...allPropModels]);
    this._cdRef.markForCheck();
  }

  private _updateQueryParams(queryParams: Params) {
    this._router.navigate([], {
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  onThemeChange(item: cd.SelectItemOutput) {
    const { value: themeId } = item as cd.ISelectItem;
    this._updateQueryParams({ themeId });
  }

  onThemeToggle(selected?: boolean) {
    const darkTheme = !selected;
    this._appStore.dispatch(new appStore.SettingsUpdate({ darkTheme }));
  }

  onComponentChange(item: cd.SelectItemOutput) {
    const { value: componentId } = item as cd.ISelectItem;
    this._updateQueryParams({ componentId });
  }
}
