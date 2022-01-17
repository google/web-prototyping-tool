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

import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subscription, BehaviorSubject } from 'rxjs';
import { IProjectState } from '../../store/reducers';
import { Store, select } from '@ngrx/store';
import { map, distinctUntilChanged } from 'rxjs/operators';
import * as selectors from '../../store/selectors';
import * as actions from '../../store/actions';
import { areArraysEqual } from 'cd-utils/array';
import { getActiveStyleFromProperty, insertElements, lookupElementIds } from 'cd-common/models';
import { getUser } from 'src/app/store/selectors';
import { constructCodeComponentPath } from 'src/app/utils/route.utils';
import { AppGo } from 'src/app/store/actions';
import { Dictionary } from '@ngrx/entity';
import * as cd from 'cd-interfaces';
import { DataPickerService } from 'cd-common';
import { buildInsertLocation } from 'cd-common/utils';

// TODO  _propertyModelService should dispose
@Injectable({
  providedIn: 'root',
})
export class PropertiesService implements OnDestroy {
  private _subscriptions = new Subscription();
  private _project?: cd.IProject;
  private _user?: cd.IUser;
  private _elementProperties: cd.ElementPropertiesMap = {};
  private _elementProperties$: Observable<cd.ElementPropertiesMap>;
  private _boards: cd.IBoardProperties[] = [];
  private _currentOutletFrames: cd.RootElement[] = [];
  private _designSystem?: cd.IDesignSystem;
  private _codeComponents?: Dictionary<cd.ICodeComponentDocument>;
  public boardIds$ = new BehaviorSubject<string[]>([]);

  constructor(
    private readonly _projectStore: Store<IProjectState>,
    private _dataPickerService: DataPickerService
  ) {
    this._elementProperties$ = this._projectStore.pipe(select(selectors.getElementProperties));

    const user$ = this._projectStore.pipe(select(getUser));
    const project$ = this._projectStore.pipe(select(selectors.getProject));
    const boards$ = this._projectStore.pipe(select(selectors.getAllBoards));
    const boardIds$ = this._projectStore.pipe(
      select(selectors.getBoardsIds),
      distinctUntilChanged((x, y) => areArraysEqual(x, y))
    );
    const outletFrames$ = this._projectStore.pipe(
      select(selectors.getCurrentOutletFrames),
      distinctUntilChanged((x, y) => areArraysEqual(x, y))
    );
    const designSystem$ = this._projectStore.pipe(select(selectors.getDesignSystem));
    const codeComponents$ = this._projectStore.pipe(select(selectors.selectCodeComponents));

    this._subscriptions.add(this._elementProperties$.subscribe(this.onElementProperties));
    this._subscriptions.add(project$.subscribe(this._onProject));
    this._subscriptions.add(boardIds$.subscribe(this.onBoardIds));
    this._subscriptions.add(boards$.subscribe(this.onBoards));
    this._subscriptions.add(outletFrames$.subscribe(this.onCurrentOutletFrames));
    this._subscriptions.add(user$.subscribe(this._onUserSubscription));
    this._subscriptions.add(designSystem$.subscribe(this._onDesignSystemSubscription));
    this._subscriptions.add(codeComponents$.subscribe(this._onCodeComponentSubscription));
  }

  ngOnDestroy() {
    this._subscriptions.unsubscribe();
  }

  private _onDesignSystemSubscription = (designSystem: cd.IDesignSystem | undefined) => {
    this._designSystem = designSystem;
  };

  private _onCodeComponentSubscription = (components: Dictionary<cd.ICodeComponentDocument>) => {
    this._codeComponents = components;
  };

  private _onUserSubscription = (user?: cd.IUser) => {
    this._user = user;
  };

  private _onProject = (project?: cd.IProject) => {
    this._project = project;
  };

  private onElementProperties = (props: cd.ElementPropertiesMap) => {
    this._elementProperties = props;
    this._dataPickerService.setElementProperties(props);
  };

  private onBoards = (boards: cd.IBoardProperties[]) => {
    this._boards = boards;
  };

  private onCurrentOutletFrames = (outletFrames: cd.RootElement[]) => {
    this._currentOutletFrames = outletFrames;
  };

  private onBoardIds = (boardIds: string[]) => {
    this.boardIds$.next(boardIds);
  };

  getDesignSystem(): cd.IDesignSystem | undefined {
    return this._designSystem;
  }

  getProjectId(): string | undefined {
    return this._project?.id;
  }

  getProjectProperties(): cd.IProject | undefined {
    return this._project;
  }

  getElementProperties(): cd.ElementPropertiesMap {
    return this._elementProperties;
  }

  getBoardIds(): string[] {
    return this.boardIds$.getValue();
  }

  getBoards(): cd.IBoardProperties[] {
    return this._boards;
  }

  getCurrentOutletFrames(): cd.RootElement[] {
    return this._currentOutletFrames;
  }

  getPropertiesForId(id: string): cd.PropertyModel | undefined {
    return this._elementProperties[id];
  }

  getElementAncestors(id: string, list: string[] = []): ReadonlyArray<string> {
    const prop = this.getPropertiesForId(id);
    if (prop && prop.parentId && prop.id !== prop.rootId) {
      const parents = this.getElementAncestors(prop.parentId, list);
      list = [prop.parentId, ...parents];
    }
    return list;
  }

  getCodeComponents(): cd.ICodeComponentDocument[] {
    const { _codeComponents } = this;
    if (!_codeComponents) return [];
    return Object.values(_codeComponents).filter((c) => !!c) as cd.ICodeComponentDocument[];
  }

  getCodeComponentForId(id: string): cd.ICodeComponentDocument | undefined {
    const { _codeComponents } = this;
    if (!_codeComponents) return undefined;
    return _codeComponents[id];
  }

  editCodeComponentInstance(codeComponentInstance: cd.IComponentInstance) {
    const codeComponentId = codeComponentInstance.elementType;
    this.editCodeComponent(codeComponentId);
  }

  editCodeComponent(codeComponentId: string) {
    const { _project } = this;
    if (!_project) return;
    const pathToCodeComponent = constructCodeComponentPath(_project.id, codeComponentId);
    this._projectStore.dispatch(new AppGo({ path: [pathToCodeComponent] }));
  }

  getCurrentUser(): cd.IUser | undefined {
    return this._user;
  }

  getActiveStylesForId(id: string): cd.IStyleDeclaration | undefined {
    const props = this.getPropertiesForId(id);
    if (!props) return undefined;
    return getActiveStyleFromProperty(props);
  }

  getPropertiesForIds(...ids: string[]): cd.PropertyModel[] {
    const { _elementProperties } = this;
    return ids.reduce<cd.PropertyModel[]>((acc, currId) => {
      const model = _elementProperties[currId];
      if (model) {
        acc.push(model);
      }
      return acc;
    }, []);
  }

  subscribeToProperties(...ids: string[]): Observable<cd.PropertyModel[]> {
    let previousResults: cd.PropertyModel[] | undefined;

    return this._projectStore.pipe(
      select(selectors.getElementPropertiesState),
      map((state) => {
        const { lastUpdatedIds, elementProperties } = state;
        const idsUpdated = ids.some((id) => lastUpdatedIds.has(id));

        if (!previousResults || idsUpdated) {
          previousResults = lookupElementIds(ids, elementProperties);
        }

        return previousResults;
      })
    );
  }

  insertEntity(
    selectedElementId: string,
    elements: cd.PropertyModel[],
    relation: cd.InsertRelation = cd.InsertRelation.Append
  ) {
    const { _elementProperties } = this;
    const dropLocation = buildInsertLocation(selectedElementId, relation);
    const elemIds = elements.map((elem) => elem.id);
    const update = insertElements(elemIds, dropLocation, _elementProperties, elements);
    this.updatePropertiesAndSelect(update, elemIds);
  }

  updatePropertiesAndSelect(update: cd.IPropertiesUpdatePayload[], elemIds: string[]) {
    this._projectStore.dispatch(new actions.ElementPropertiesUpdate(update));
    this._projectStore.dispatch(new actions.SelectionToggleElements(elemIds));
    this._projectStore.dispatch(
      new actions.PanelSetPropertyPanelState(cd.PropertyPanelState.Default)
    );
  }
}
