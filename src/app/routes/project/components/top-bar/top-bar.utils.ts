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
import { GroupConfig, EditConfig } from '../../configs/project.config';
import { getUser } from 'src/app/store';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { Store, select } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { getIsolatedSymbolId, IProjectState, selectPublishEntries } from '../../store';

export enum GroupAction {
  Group,
  Ungroup,
  Vertical,
  Horizontal,
  Grid,
}

const groupMenuConfig: cd.IMenuConfig[] = [
  {
    title: EditConfig.Group.title,
    value: GroupAction.Group,
    icon: EditConfig.Group.icon,
    shortcut: EditConfig.Group.shortcut,
  },
  {
    title: EditConfig.Ungroup.title,
    value: GroupAction.Ungroup,
    icon: EditConfig.Ungroup.icon,
    shortcut: EditConfig.Ungroup.shortcut,
    divider: true,
  },
  {
    title: GroupConfig.VerticalGroup.title,
    icon: GroupConfig.VerticalGroup.icon,
    value: GroupAction.Vertical,
  },
  {
    title: GroupConfig.HorizontalGroup.title,
    icon: GroupConfig.HorizontalGroup.icon,
    value: GroupAction.Horizontal,
  },
  {
    title: GroupConfig.GridGroup.title,
    icon: GroupConfig.GridGroup.icon,
    value: GroupAction.Grid,
  },
];

export const buildMenuConfig = (disableUngroup: boolean): cd.IMenuConfig[] => {
  return groupMenuConfig.map((item) => {
    const clone = { ...item };
    if (clone.value === GroupAction.Ungroup) {
      clone.disabled = disableUngroup;
    }
    return clone;
  });
};

/** Used to activate the publish button in symbol isolation mode */
export const getIsoloatedSymbolObservable = (
  projectStore: Store<IProjectState>,
  elementProperties$: Observable<cd.ElementPropertiesMap>
): Observable<boolean> => {
  const isolatedSymbolId$ = projectStore.pipe(select(getIsolatedSymbolId));

  const publishedEntries$ = projectStore.pipe(select(selectPublishEntries));
  const user$ = projectStore.pipe(select(getUser));

  const publishEntry$ = combineLatest([
    isolatedSymbolId$,
    publishedEntries$,
    elementProperties$,
  ]).pipe(
    map(([id, _entries, elemProps]) => {
      if (!id) return;
      const symbolInstance = elemProps[id] as cd.ISymbolProperties;
      const publishedDetails = symbolInstance?.publishId?.entryId;
      if (!publishedDetails) return;
      return _entries[publishedDetails];
    })
  );

  return combineLatest([user$, publishEntry$]).pipe(
    distinctUntilChanged((x, y) => {
      const sameUser = x[0] === y[0];
      const sameOwnerId = x[1]?.owner.id === y[1]?.owner.id;
      return sameUser && sameOwnerId;
    }),
    map(([user, publishEntry]) => {
      if (!user) return false;
      if (!publishEntry) return true; // has not been published yet
      return user.id === publishEntry?.owner?.id;
    })
  );
};
