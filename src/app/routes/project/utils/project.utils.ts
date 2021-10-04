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

import { KEYS } from 'cd-utils/keycodes';
import { IConfigAction } from '../interfaces/action.interface';
import { environment } from 'src/environments/environment';
import { BODY_TAG, FirebaseField } from 'cd-common/consts';
import firebase from 'firebase/app';
import * as cd from 'cd-interfaces';

export const BOARD_TAG = 'APP-BOARD';
export const RENDERER_TAG = 'APP-NG-RENDERER';

const NAME = 'WebPrototypingTool';
const DISABLE_OVERSCROLL_CLASS = 'disable-overscroll';
const TITLE_DIVIDER = ' - ';
/** Defined in properties.component.html */
const ELEMENT_TITLE_INPUT_ID = 'element-title';
const RELOAD_KEY = 'r';
const SAVE_KEY = 's';

export const getPageTitle = (name: string = '') => {
  const projectName = name ? name + TITLE_DIVIDER : '';
  return `${projectName}${NAME}`;
};
/**
 * Determine if keyboard events are allowed on target
 * @param target Focus target
 */
export const hotkeyAllowedOnTarget = (target: HTMLElement): boolean =>
  [BODY_TAG, BOARD_TAG, RENDERER_TAG].includes(target.tagName) || !!target.closest(RENDERER_TAG);

/**
 * Fixes an issue on macOS where two finger swipe goes back
 * but we need two finger swiping for panning the canvas
 * @param disabled
 */
export const toggleOverscrollOnBody = (activate = true) => {
  document.documentElement.classList.toggle(DISABLE_OVERSCROLL_CLASS, activate);
};

export const checkForSaveShortcut = (e: KeyboardEvent): boolean => {
  const { key, metaKey } = e;
  const saved = metaKey && key === SAVE_KEY;
  if (saved) e.preventDefault();
  return saved;
};

export const selectElementTitleForRename = () => {
  const element = document.getElementById(ELEMENT_TITLE_INPUT_ID) as HTMLInputElement | undefined;
  if (!element || element?.readOnly) return;
  element?.focus();
  element?.select();
};

export const captureBrowserReload = (e: KeyboardEvent): boolean => {
  if (!environment.production) return false;
  const { key, metaKey } = e;
  const reload = metaKey && key === RELOAD_KEY;
  if (reload) {
    e.preventDefault();
    selectElementTitleForRename();
  }
  return reload;
};

export const interceptBrowserKeyboardZoom = (e: KeyboardEvent) => {
  const { key, metaKey } = e;
  if (metaKey && (key === KEYS.Equals || key === KEYS.Minus)) {
    e.preventDefault();
  }
};

/**
 * Passive actions are keyboard shortcuts that dont preventDefault()
 * We use this for Paste to grab image data from the clipboard
 * @param action
 */
export const isConfigActionPassive = (action: IConfigAction): boolean => {
  return !!(action.config && action.config.passive);
};

export const filterProjectContents = <T>(
  contentDocs: cd.IProjectContentDocument[],
  type: cd.EntityType
): T[] => {
  const results = contentDocs.filter((doc) => doc.type === type) as unknown as T[];
  return results || [];
};

export const findDesignSystemInProjectContents = (
  contentDocs: cd.IProjectContentDocument[]
): cd.IDesignSystemDocument => {
  const type = cd.EntityType.DesignSystem;
  return contentDocs.find((doc) => doc.type === type) as cd.IDesignSystemDocument;
};

/**
 * Firebase timestamps are classes, only objects are stored in the localdb
 * Therefore we need to convert the object back into a firebase timestamp
 */
export const processSyncOperationTimestamps = (diffReponse: cd.IOfflineDiffResponse) => {
  const timestamp = firebase.firestore.Timestamp.now();
  const syncOperations = diffReponse.syncOperations.map((res) => {
    if (res.type !== cd.IOfflineSyncOperationType.Write) return res;
    if (res.document && FirebaseField.LastUpdatedAt in res.document) {
      (res.document as cd.IBaseDocumentMetadata).updatedAt = timestamp;
    }
    return res;
  });
  return { ...diffReponse, syncOperations };
};

/** Checks to see if a project partial has a timestamp, if not add one */
export const updateProjectTimestamp = (project: Partial<cd.IProject>): Partial<cd.IProject> => {
  // always update the timestamp
  return { ...project, updatedAt: firebase.firestore.Timestamp.now() };
};
