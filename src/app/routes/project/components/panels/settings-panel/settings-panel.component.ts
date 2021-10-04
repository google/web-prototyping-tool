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
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit,
} from '@angular/core';
import { clearIdbData } from 'src/app/database/workers/indexed-db.utils';
import { environment } from 'src/environments/environment';
import { DebugService } from 'src/app/services/debug/debug.service';
import { ToastsService } from 'src/app/services/toasts/toasts.service';
import { Store, select } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { IUserSettings } from 'cd-interfaces';
import { makePluralFromLength } from 'cd-utils/string';
import * as appStoreModule from '../../../../../store';
import * as projStore from '../../../store';

@Component({
  selector: 'app-settings-panel',
  templateUrl: './settings-panel.component.html',
  styleUrls: ['./settings-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPanelComponent implements OnInit, OnDestroy {
  private settings$: Observable<IUserSettings>;
  private _subscriptions = Subscription.EMPTY;
  public settings?: IUserSettings;
  public prodMode = environment.production;
  public advancedOpen = this.prodMode === false;

  constructor(
    private appStore: Store<appStoreModule.IAppState>,
    private readonly _projectStore: Store<projStore.IProjectState>,
    private _debugService: DebugService,
    private _toastService: ToastsService,
    private _cdRef: ChangeDetectorRef
  ) {
    this.settings$ = appStore.pipe(select(appStoreModule.getUserSettings));
  }

  ngOnInit(): void {
    this._subscriptions = this.settings$.subscribe((settings) => {
      this.settings = settings;
      this._cdRef.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this._subscriptions.unsubscribe();
  }

  onSwitched(newValue: boolean) {
    this.advancedOpen = newValue;
  }

  onKeyboardShortcutsClick() {
    this._projectStore.dispatch(new projStore.PanelSetKeyboardShortcutModalVisibility(true));
  }

  updateSettings(settings: Partial<IUserSettings>) {
    this.appStore.dispatch(new appStoreModule.SettingsUpdate(settings));
  }

  onDarkThemeChange(darkTheme: boolean) {
    this.updateSettings({ darkTheme });
  }

  onPrefersAbsolute(prefersAbsolute: boolean) {
    this.updateSettings({ prefersAbsolute });
  }

  onDebugCanvasChange(debugCanvas: boolean) {
    this.updateSettings({ debugCanvas });
  }

  onDebugGlass(debugGlass: boolean) {
    this.updateSettings({ debugGlass });
  }

  onShowingBoardIds(showingBoardIds: boolean) {
    this.updateSettings({ showingBoardIds });
  }

  onBreakGlass(breakGlass: boolean) {
    this.updateSettings({ breakGlass });
  }

  onStats(showStats: boolean) {
    this.updateSettings({ showStats });
  }

  onShowLayersTreeIndent(showLayersIndent: boolean) {
    this.updateSettings({ showLayersIndent });
  }

  onDisableContextualOverlay(disableContextualOverlay: boolean) {
    this.updateSettings({ disableContextualOverlay });
  }

  onDisableIndexDB(disableIdb: boolean) {
    this.updateSettings({ disableIdb });
  }

  async onResetLocalDatabase() {
    await clearIdbData();
    this._toastService.addToast({ message: 'Database Cleared' });
  }

  onRepairProjectClick = async () => {
    const issues = await this._debugService.runHealthCheck();
    const { length: numIssues } = issues;

    if (numIssues) {
      await this._debugService.repairIssues();
      const issuesAfterRepair = await this._debugService.runHealthCheck();
      const totalIssuesFixed = numIssues - issuesAfterRepair.length;
      const issueText = makePluralFromLength('issue', totalIssuesFixed);
      const repairedMessage = `${totalIssuesFixed} ${issueText} repaired.`;
      this._toastService.addToast({ message: repairedMessage });
    } else {
      this._toastService.addToast({ message: 'No issues detected.' });
    }
  };

  /** Checks data synchronization between store/local/online sources. */
  async checkDataSync() {
    await this._debugService.checkDataSync();
  }

  throwTestException() {
    throw new Error('Test Exception');
  }
}
