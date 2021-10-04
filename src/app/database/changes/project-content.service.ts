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

import * as cd from 'cd-interfaces';
import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, shareReplay } from 'rxjs/operators';
import { select, Store } from '@ngrx/store';
import { getUser } from 'src/app/store/selectors';
import { IAppState } from 'src/app/store/reducers';
import { areArraysEqual } from 'cd-utils/array';
import { getModels, isBoard, isSymbolDefinition } from 'cd-common/models';
import {
  DEFAULT_ASSET_CONTENT,
  DEFAULT_CODE_CMP_CONTENT,
  DEFAULT_DATASET_CONTENT,
  DEFAULT_DS_CONTENT,
  DEFAULT_ELEMENT_CONTENT,
} from './project-content.consts';

/**
 * This class contains all the content currently loaded into a project
 */
@Injectable({
  providedIn: 'root',
})
export class ProjectContentService {
  // #region Source of Truth
  // These BehaviorSubjects represent all the content that is currently loaded for a project
  public project$ = new BehaviorSubject<cd.IProject | undefined>(undefined);
  public elementContent$ = new BehaviorSubject<cd.ElementContent>(DEFAULT_ELEMENT_CONTENT);
  public designSystemContent$ = new BehaviorSubject<cd.DesignSystemContent>(DEFAULT_DS_CONTENT);
  public assetContent$ = new BehaviorSubject<cd.AssetContent>(DEFAULT_ASSET_CONTENT);
  public codeCmpContent$ = new BehaviorSubject<cd.CodeCmpContent>(DEFAULT_CODE_CMP_CONTENT);
  public datasetContent$ = new BehaviorSubject<cd.DatasetContent>(DEFAULT_DATASET_CONTENT);
  //#endregion

  //#region Derived Observables
  // These observable are all derived from the BehaviorSubjects above
  public projectLoaded$: Observable<boolean>;
  public homeBoardId$: Observable<string | undefined>;

  // TODO convert these to behavior subjects so that we always have a value
  public currentUserIsProjectOwner$: Observable<boolean>;
  public currentUserIsProjectEditor$: Observable<boolean>;

  // Design system content supports multiple design systems. However, converts to a single
  // design system which is what the rest of  is built for currently
  public designSystemMap$: Observable<cd.DesignSystemMap>;
  public designSystem$: Observable<cd.IDesignSystemDocument>;

  // TODO: reusable class for each of these content types

  // Elements
  public elementsLoaded$: Observable<boolean>;
  public elementProperties$: Observable<cd.ElementPropertiesMap>;
  public elementIds$: Observable<string[]>;
  public elementModels$: Observable<ReadonlyArray<cd.PropertyModel>>;

  // Assets
  public assetMap$: Observable<cd.AssetMap>;
  public assetArray$: Observable<cd.IProjectAsset[]>;
  public assetIds$: Observable<string[]>;

  // Code Components
  public codeCmpMap$: Observable<cd.CodeComponentMap>;
  public codeCmpArray$: Observable<cd.ICodeComponentDocument[]>;

  // Datasets
  public datasetMap$: Observable<cd.DatasetMap>;
  public datasetArray$: Observable<cd.ProjectDataset[]>;

  // Symbols
  public symbolsArray$: Observable<cd.ISymbolProperties[]>;
  public symbolsMap$: Observable<cd.ISymbolMap>;
  public symbolIds$: Observable<string[]>;

  // Boards
  public boardsArray$: Observable<cd.IBoardProperties[]>;
  public boardsMap$: Observable<cd.IStringMap<cd.IBoardProperties>>;
  public boardIds$: Observable<string[]>;

  public outletFrames$: Observable<cd.IOutletFrameSubscription>;
  ////#endregion

  constructor(private store: Store<IAppState>) {
    const user$ = this.store.pipe(select(getUser));

    this.currentUserIsProjectOwner$ = combineLatest([user$, this.project$]).pipe(
      map(([user, project]) => {
        if (!user || !project) return false;
        return project.owner.id === user.id;
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.currentUserIsProjectEditor$ = combineLatest([user$, this.project$]).pipe(
      map(([user, project]) => {
        if (!user || !project) return false;
        if (project.owner.id === user.id) return true;
        return !!(user.email && project.editors?.includes(user.email));
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.projectLoaded$ = this.project$.pipe(
      map((project) => !!project),
      distinctUntilChanged(),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.homeBoardId$ = this.project$.pipe(
      map((project) => project?.homeBoardId),
      distinctUntilChanged(),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.assetMap$ = this.assetContent$.pipe(
      map((assetContent) => assetContent.records),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.assetIds$ = this.assetMap$.pipe(
      map((assetMap) => Object.keys(assetMap)),
      distinctUntilChanged((prev, curr) => areArraysEqual(prev, curr)),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.assetArray$ = this.assetMap$.pipe(
      map((assetMap) => Object.values(assetMap)),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.elementsLoaded$ = this.elementContent$.pipe(
      map((state) => state.loaded),
      distinctUntilChanged(),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.elementProperties$ = this.elementContent$.pipe(
      map((state) => state.records),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.elementIds$ = this.elementProperties$.pipe(
      map((elementProperties) => Object.keys(elementProperties)),
      distinctUntilChanged((prev, curr) => areArraysEqual(prev, curr)),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.elementModels$ = this.elementProperties$.pipe(
      map((elementProperties) => getModels(elementProperties)),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.designSystemMap$ = this.designSystemContent$.pipe(
      map((dsContent) => dsContent.records),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.designSystem$ = this.designSystemMap$.pipe(
      map((dsMap) => Object.values(dsMap)[0]),
      filter((designSystem) => !!designSystem),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.codeCmpMap$ = this.codeCmpContent$.pipe(
      map((codeCmpContent) => codeCmpContent.records),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.codeCmpArray$ = this.codeCmpMap$.pipe(
      map((codeCmpMap) => Object.values(codeCmpMap)),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.datasetMap$ = this.datasetContent$.pipe(
      map((datasetContent) => datasetContent.records),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.datasetArray$ = this.datasetMap$.pipe(
      map((codeCmpMap) => Object.values(codeCmpMap)),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.boardsArray$ = this.elementContent$.pipe(
      map((elementContent) => {
        const models = getModels(elementContent.records);
        const boards = models.filter(isBoard);
        const result: [cd.ElementContent, cd.IBoardProperties[]] = [elementContent, boards];
        return result;
      }),
      distinctUntilChanged((prev, curr) => {
        // Prevent emitting a new array of boards unless a board has been changed
        const [, prevBoards] = prev;
        const [content, currBoards] = curr;
        const { idsCreatedInLastChange, idsUpdatedInLastChange, idsDeletedInLastChange } = content;
        const allUpdatedIds = new Set([...idsCreatedInLastChange, ...idsUpdatedInLastChange]);

        const boardsUpdated = currBoards.some((b) => allUpdatedIds.has(b.id));
        if (boardsUpdated) return false;

        const boardsDeleted = prevBoards.some((b) => idsDeletedInLastChange.has(b.id));
        if (boardsDeleted) return false;

        return true;
      }),
      map(([, boards]) => boards),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.boardIds$ = this.boardsArray$.pipe(
      map((boardsArray) => boardsArray.map((b) => b.id)),
      distinctUntilChanged((prev, curr) => areArraysEqual(prev, curr)),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.boardsMap$ = this.boardsArray$.pipe(
      map((boardsArray) => {
        return boardsArray.reduce<cd.IStringMap<cd.IBoardProperties>>((acc, curr) => {
          acc[curr.id] = curr;
          return acc;
        }, {});
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.symbolsArray$ = this.elementContent$.pipe(
      map((elementContent) => {
        const models = getModels(elementContent.records);
        const symbols = models.filter(isSymbolDefinition);
        const result: [cd.ElementContent, cd.ISymbolProperties[]] = [elementContent, symbols];
        return result;
      }),
      distinctUntilChanged((prev, curr) => {
        // Prevent emitting a new array of symbols unless a symbol has been changed
        const [, prevSymbols] = prev;
        const [content, currSymbols] = curr;
        const { idsCreatedInLastChange, idsUpdatedInLastChange, idsDeletedInLastChange } = content;
        const allUpdatedIds = new Set([...idsCreatedInLastChange, ...idsUpdatedInLastChange]);

        const boardsUpdated = currSymbols.some((b) => allUpdatedIds.has(b.id));
        if (boardsUpdated) return false;

        const boardsDeleted = prevSymbols.some((b) => idsDeletedInLastChange.has(b.id));
        if (boardsDeleted) return false;

        return true;
      }),
      map(([, boards]) => boards),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.symbolIds$ = this.symbolsArray$.pipe(
      map((symbolsArray) => symbolsArray.map((b) => b.id)),
      distinctUntilChanged((prev, curr) => areArraysEqual(prev, curr)),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.symbolsMap$ = this.symbolsArray$.pipe(
      map((symbolsArray) => {
        return symbolsArray.reduce<cd.ISymbolMap>((acc, curr) => {
          acc[curr.id] = curr;
          return acc;
        }, {});
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.outletFrames$ = combineLatest([this.boardsArray$, this.symbolsArray$]).pipe(
      map(([boards, symbols]) => {
        return { boards, symbols };
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  get project(): cd.IProject | undefined {
    return this.project$.getValue();
  }

  get elementProperties(): cd.ElementPropertiesMap {
    return this.elementContent$.getValue().records;
  }

  getCurrentContent(): cd.IProjectContent | undefined {
    const project = this.project$.getValue();
    if (!project) return undefined;
    const elementContent = this.elementContent$.getValue();
    const designSystemContent = this.designSystemContent$.getValue();
    const assetContent = this.assetContent$.getValue();
    const codeCmpContent = this.codeCmpContent$.getValue();
    const datasetContent = this.datasetContent$.getValue();
    return {
      project,
      elementContent,
      designSystemContent,
      assetContent,
      codeCmpContent,
      datasetContent,
    };
  }

  resetContent() {
    this.project$.next(undefined);
    this.elementContent$.next(DEFAULT_ELEMENT_CONTENT);
    this.designSystemContent$.next(DEFAULT_DS_CONTENT);
    this.assetContent$.next(DEFAULT_ASSET_CONTENT);
    this.codeCmpContent$.next(DEFAULT_CODE_CMP_CONTENT);
    this.datasetContent$.next(DEFAULT_DATASET_CONTENT);
  }
}
