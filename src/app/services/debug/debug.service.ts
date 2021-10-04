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

import { Injectable, NgZone } from '@angular/core';
import { environment } from 'src/environments/environment';
import { CdPostMessage } from 'cd-common/services';
import { projectContentsPathForId, projectPathForId } from 'src/app/database/path.utils';
import { getLocalProjectDataForId } from 'src/app/routes/project/utils/offline.helper.utils';
import { compareData, IDataComparison } from './data-compare.utils';
import { DatabaseService } from '../../database/database.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { Store } from '@ngrx/store';
import { fromEvent, lastValueFrom, firstValueFrom } from 'rxjs';
import { createDesignSystemDocument } from 'cd-common/utils';
import { Global, setGlobal } from './debug.utils';
import { ProjectContentService } from 'src/app/database/changes/project-content.service';
import * as utils from 'src/app/routes/project/store/reducers/health.metareducer';
import * as offlineUtils from '../../database/workers/offline.utils';
import * as actions from 'src/app/routes/project/store/actions';
import * as cd from 'cd-interfaces';

const enum Channel {
  Inbound = 'in-channel',
  Outbound = 'out-channel',
  Graph = 'graph-channel',
}

@Injectable({
  providedIn: 'root',
})
export class DebugService {
  private _channelInbound?: BroadcastChannel;
  private _channelOutbound?: BroadcastChannel;
  private _channelGraph?: BroadcastChannel;

  get isDevMode() {
    return environment.production === false;
  }

  get projectId() {
    return this._projectContentService.project$.value?.id;
  }

  constructor(
    private _store: Store<any>,
    private _zone: NgZone,
    private _analyticsService: AnalyticsService,
    private _databaseService: DatabaseService,
    private _projectContentService: ProjectContentService
  ) {
    setGlobal(Global.Doctor, this.healthCheck);
    setGlobal(Global.Repair, this.repairIssues);
    setGlobal(Global.DeleteElement, this.deleteElement);
    setGlobal(Global.CheckDataSync, this.checkDataSync);
    setGlobal(Global.GetProjectContent, this.getProjectContent);

    this._channelGraph = new BroadcastChannel(Channel.Graph);
    fromEvent<MessageEvent>(this._channelGraph, 'message').subscribe(this._handleGraphMessage);

    if (!this.isDevMode) return;
    this._channelInbound = new BroadcastChannel(Channel.Inbound);
    this._channelOutbound = new BroadcastChannel(Channel.Outbound);
  }

  broadcastMessage = (channel: BroadcastChannel | undefined, message: any) => {
    channel?.postMessage(message);
  };

  public sendInboundMessage = (message: CdPostMessage) => {
    if (!this.isDevMode) return;
    this.broadcastMessage(this._channelInbound, message);
  };

  public sendOutboundMessage = (message: CdPostMessage) => {
    if (!this.isDevMode) return;
    this.broadcastMessage(this._channelOutbound, message);
  };

  public sendProjectDataToGraph = () => {
    if (this._channelGraph === undefined) return;
    const project = this._projectContentService.project$.value;
    const elementProperties = this._projectContentService.elementContent$.value.records;
    if (!elementProperties) return;
    this.broadcastMessage(this._channelGraph, { project, elementProperties });
  };

  deleteElement = (elemId: string) => {
    if (!elemId) return;
    this._databaseService
      .deleteDocument(projectContentsPathForId(elemId))
      .then(() => console.log('deleted', elemId))
      .catch((err) => console.log('error', err));
  };

  healthCheck = () => {
    this._zone.runOutsideAngular(async () => {
      const results = await this.runHealthCheck();
      console.log(`Health check complete: ${results.length} Errors`);
      if (results.length) this.reportHealthIssues(results);
    });
  };

  reportHealthIssues(issues: string[]) {
    const { projectId } = this;
    if (!projectId || !issues.length) return;
    const message = `${issues.length} Health check Errors in project: ${projectId}`;
    this._analyticsService.sendError(message);
  }

  getProjectContent = () => {
    return this._projectContentService.getCurrentContent();
  };

  getElementProperties() {
    return firstValueFrom(this._projectContentService.elementProperties$);
  }

  getBoardIds() {
    return firstValueFrom(this._projectContentService.boardIds$);
  }

  getSymbolIds() {
    return firstValueFrom(this._projectContentService.symbolIds$);
  }

  getDesignSystem() {
    return firstValueFrom(this._projectContentService.designSystem$);
  }

  repairIssues = () => {
    return this._zone.runOutsideAngular(async () => {
      const currElementProps = await this.getElementProperties();
      const currDesignSys = await this.getDesignSystem();
      const currBoardIds = await this.getBoardIds();
      const repairs = utils.repairHealthIssues(currElementProps, currBoardIds, currDesignSys);
      const { elementProperties, designSystem } = repairs;
      const deleted = utils.getIdsForDeletedElements(currElementProps, elementProperties);
      const action = new actions.ElementPropertiesSetAll(elementProperties, deleted);
      const hasDesignSystem = !!currDesignSys;
      // Actions must be dispatched within ngZone to correctly trigger change detection
      // https://ngrx.io/guide/store/configuration/runtime-checks#strictactionwithinngzone
      this._zone.run(() => {
        this._store.dispatch(action);
        const projectId = this._projectContentService.project$.value?.id;
        // If design system was repaired, dispatch action to update
        if (designSystem) {
          this._store.dispatch(
            new actions.DesignSystemUpdate(designSystem.id, designSystem, true, false)
          );
        }
        // else if design system does not exist, dispatch action to create
        else if (!hasDesignSystem && projectId) {
          const newDesignSystem = createDesignSystemDocument(projectId);
          this._store.dispatch(new actions.DesignSystemDocumentCreate(newDesignSystem));
        }
        console.log('Health check repairs completed');
      });
    });
  };

  runHealthCheck = async (): Promise<string[]> => {
    const { isDevMode } = this;
    const elementProps = await this.getElementProperties();
    const designSys = await this.getDesignSystem();
    const boardIds = await this.getBoardIds();
    const symbolIds = await this.getSymbolIds();
    return utils.runAllHealthChecks(elementProps, designSys, boardIds, symbolIds, isDevMode);
  };

  runHealthCheckAndRepairs = () => {
    if (environment.e2e) return;
    return this._zone.runOutsideAngular(async () => {
      const issues = await this.runHealthCheck();
      const { length: numIssues } = issues;
      console.log(`Health check complete: ${numIssues} Errors`);

      if (numIssues) {
        await this.repairIssues();
        const issuesAfterRepair = await this.runHealthCheck();
        const totalIssuesFixed = numIssues - issuesAfterRepair.length;
        const numIssuesRemaining = numIssues - totalIssuesFixed;
        const issuesString = issues.join('\n\n');
        const repairedMessage = `Num issues fixed: ${totalIssuesFixed}. Num issues remaining: ${numIssuesRemaining}\n\n${issuesString}\n\n`;
        this._analyticsService.sendError(repairedMessage);
      }
    });
  };

  /** Checks data synchronization between store/local/online sources. */
  async checkDataSync(): Promise<IDataComparison | undefined> {
    const { projectId } = this;
    if (!projectId) return;

    // Retrieve remote/local data and convert to `IOfflineProjectState` interface
    // TODO: Also retrieve store data for comparison
    const projectPath = projectPathForId(projectId);
    const [projectDoc, projectContents, localData] = await Promise.all([
      lastValueFrom(this._databaseService.getDocument(projectPath)),
      lastValueFrom(this._databaseService.getProjectContents(projectId)),
      getLocalProjectDataForId(projectId),
    ]);
    if (!localData) {
      console.log('No local data');
      return;
    }
    const data = projectDoc?.data() as cd.IProject;
    const remoteData = offlineUtils.convertProjectToOfflineState(data, projectContents);

    // Run diff on remote/local data
    const comparison = compareData(remoteData, localData);

    // Log results
    console.group('Checking Data Sync');
    console.log('Remote Data:');
    console.log(remoteData);
    console.log('Local Data:');
    console.log(localData);
    console.log(`Data ${comparison.isSynchronised ? 'is' : 'is not'} synced`);
    comparison.errors.forEach((e: string) => console.log(e));
    console.groupEnd();

    return comparison;
  }

  private _handleGraphMessage = ({ data }: MessageEvent) => {
    if (data.graphUpdateRequest) {
      this.sendProjectDataToGraph();
    }
  };
}
