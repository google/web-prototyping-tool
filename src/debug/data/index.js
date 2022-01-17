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

import { get, Store } from 'https://cdn.jsdelivr.net/npm/idb-keyval@3/dist/idb-keyval.mjs';
import { areObjectsEqual } from './utils.js';

firebase.initializeApp({
  apiKey: '',
  authDomain: '',
  databaseURL: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
  measurementId: '',
});

const LOG_ELEM = 'log-content';
const getElem = (id) => document.getElementById(id);
const idbStore = new Store('IndexedDB - v2', 'database');
const db = firebase.firestore();
const channel = new BroadcastChannel('graph-channel');
const syncBtn = getElem('sync');
const state = {
  localData: {},
  remoteData: {},
};

const log = (text) => (getElem(LOG_ELEM).textContent += `${text}\n`);
const clearLog = () => (getElem(LOG_ELEM).textContent = '');

const runSyncOperation = () => {
  channel.postMessage({ graphUpdateRequest: true });
};

syncBtn.addEventListener('click', runSyncOperation);

function buildLineItem(label, content, fragment) {
  const wrapper = document.createElement('span');
  wrapper.className = 'detail';
  const span = document.createElement('span');
  const labelB = document.createElement('b');
  labelB.textContent = `${label}:`;
  wrapper.appendChild(labelB);
  span.textContent = content;
  wrapper.appendChild(span);
  fragment.appendChild(wrapper);
}

function buildProjectDetails(obj, elementCount) {
  const { name, id, updatedAt, symbolIds, boardIds } = obj;
  const fragment = document.createDocumentFragment();
  const title = name || 'Untitled';
  const time = `${updatedAt.seconds}:${updatedAt.nanoseconds}`;
  buildLineItem('Project', title, fragment);
  buildLineItem('ID', id, fragment);
  buildLineItem('Timestamp', time, fragment);
  buildLineItem('Boards', boardIds.length, fragment);
  buildLineItem('Symbols', symbolIds.length, fragment);
  buildLineItem('Element Count', elementCount, fragment);
  return fragment;
}

const objKeyCount = (obj) => Object.keys(obj).length;

function toggleClass(elem, match) {
  elem.classList.toggle('equal', match);
  elem.classList.toggle('error', !match);
}

function renderProjectDetails({ project, elementProperties }, domId, match) {
  const elemCount = objKeyCount(elementProperties);
  const proj = buildProjectDetails(project, elemCount);
  const projDom = getElem(domId);
  toggleClass(projDom, match);
  projDom.replaceChildren(proj);
}

function doProjectDetailsMatch(remote, local) {
  if (!areObjectsEqual(remote.project, local.project)) {
    log('Project Object Missmatch');
    const boardIdsMatch =
      remote.project.boardIds.length === local.project.boardIds.length &&
      remote.project.boardIds.every((bid) => local.project.boardIds.includes(bid));
    if (!boardIdsMatch) log('Project BoardIds missmatch');
    if (!areObjectsEqual(remote.project.updatedAt, local.project.updatedAt)) {
      log('Project timestamp missmatch');
    }
    log(JSON.stringify(remote.project, null, 2));
    log(JSON.stringify(local.project, null, 2));
    return false;
  }
  const countMatch = objKeyCount(remote.elementProperties) === objKeyCount(local.elementProperties);
  if (!countMatch) log('ELEMENT Count Missmatch');
  return countMatch;
}

function buildListItem(clone, fragment, match, elem) {
  const label = `${elem.id} (${elem.elementType})`;
  const li = clone.cloneNode();
  li.innerText = label;
  toggleClass(li, match);
  fragment.appendChild(li);
  return li;
}

function detectElementAnomalies(localElem, remoteElem, key) {
  const localKeys = Object.keys(localElem);
  const remoteKeys = Object.keys(remoteElem);
  const allElemKeys = [...new Set([...remoteKeys, ...localKeys])];
  for (let elemKey of allElemKeys) {
    const inLocal = localKeys.includes(elemKey);
    const inRemote = remoteKeys.includes(elemKey);
    if (!inLocal) log(`Local Element: ${key} missing ${elemKey}`);
    if (!inRemote) log(`Remote Element: ${key} missing ${elemKey}`);
    if (inLocal && inRemote && !areObjectsEqual(localElem[elemKey], remoteElem[elemKey])) {
      log(`Element: ${key} values missmatch for key ${elemKey}`);
      log(JSON.stringify(localElem[elemKey], null, 2));
      log(JSON.stringify(remoteElem[elemKey], null, 2));
    }
  }
}

function renderElementDetails({ elementProperties: remote }, { elementProperties: local }) {
  const allKeys = [...new Set([...Object.keys(remote), ...Object.keys(local)])];
  const inBoth = allKeys.filter((id) => !!remote[id] && !!local[id]);
  const onlyRemote = allKeys.filter((id) => !!remote[id] && !!!local[id]);
  const onlyLocal = allKeys.filter((id) => !!!remote[id] && !!local[id]);
  const localFragment = document.createDocumentFragment();
  const remoteFragment = document.createDocumentFragment();
  const li = document.createElement('li');

  for (let key of inBoth) {
    const localElem = local[key];
    const remoteElem = remote[key];
    const areEqual = areObjectsEqual(localElem, remoteElem);
    if (!areEqual) detectElementAnomalies(localElem, remoteElem, key);
    buildListItem(li, remoteFragment, areEqual, localElem);
    buildListItem(li, localFragment, areEqual, remoteElem);
  }

  for (let key of onlyLocal) {
    const item = buildListItem(li, localFragment, false, local[key]);
    item.style.opacity = 0.6;
  }

  for (let key of onlyRemote) {
    const item = buildListItem(li, remoteFragment, false, remote[key]);
    item.style.opacity = 0.6;
  }

  const localElem = getElem('elements-local');
  const remoteElem = getElem('elements-remote');
  localElem.replaceChildren(localFragment);
  remoteElem.replaceChildren(remoteFragment);
}

function renderData() {
  const match = doProjectDetailsMatch(state.remoteData, state.localData);
  renderProjectDetails(state.remoteData, 'project-remote', match);
  renderProjectDetails(state.localData, 'project-local', match);
  renderElementDetails(state.remoteData, state.localData);
}

const getRemoteProjectData = (projectId) => {
  if (!projectId) return;
  return db
    .collection('projects')
    .doc(projectId)
    .get()
    .then((snapshot) => snapshot.data());
};

const arrToElementPropsMap = (elements) =>
  elements.reduce((acc, curr) => {
    acc[curr.id] = curr;
    return acc;
  }, {});

const getRemoteProjectContents = (projectId) => {
  return db
    .collection('project_contents')
    .where('projectId', '==', projectId)
    .get()
    .then((snapshot) => snapshot.docs.map((item) => item.data()))
    .then((data) => {
      const elements = data.filter((item) => item.type === 'Element');
      const elementProperties = arrToElementPropsMap(elements);
      const designSystem = data.filter((item) => item.type === 'Design System');
      return { elementProperties, designSystem };
    });
};

const getLocalProjData = async (projectId) => {
  const raw = await get(projectId, idbStore);
  return raw ? JSON.parse(raw) : undefined;
};

channel.onmessage = async ({ data }) => {
  const projectId = data?.project?.id;
  if (!projectId) return;
  clearLog();
  const localData = await getLocalProjData(projectId);
  if (!localData) return log('No Local Data');
  const remoteProjData = await getRemoteProjectData(projectId);
  if (!remoteProjData) return log('No Remote Data');
  const remoteProjContent = await getRemoteProjectContents(projectId);
  state.localData = { ...localData };
  state.remoteData = { ...remoteProjContent, project: remoteProjData };
  renderData();
};

document.addEventListener('DOMContentLoaded', runSyncOperation, false);
