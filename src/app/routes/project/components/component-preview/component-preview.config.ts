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

export const FALLBACK_DESCRIPTION = 'No description provided.';

export enum PreviewStateMessage {
  Unpublished = 1,
  PublishedCurrentVersion = 2,
  PublishedDifferentVersion = 3,
}

export enum PreviewAction {
  Edit,
  Publish,
  SwapVersion,
}

interface IMsgBtn {
  label: string;
  icon?: string;
  action: PreviewAction;
}

interface IMsgLink {
  label: string;
  url: string;
}

export interface IPreviewMessage {
  msg: string;
  link?: IMsgLink;
  primaryBtn: IMsgBtn;
  secondaryBtn?: IMsgBtn;
}

const EDIT_BTN: IMsgBtn = { label: 'Edit', icon: 'edit', action: PreviewAction.Edit };
const PUBLISH_BTN: IMsgBtn = { label: 'Publish', icon: 'publish', action: PreviewAction.Publish };
const SWAP_VERSION_BTN: IMsgBtn = {
  label: 'Use this version',
  icon: 'swap_calls',
  action: PreviewAction.SwapVersion,
};

export const MESSAGE_CONFIG: Record<PreviewStateMessage, IPreviewMessage> = {
  [PreviewStateMessage.Unpublished]: {
    msg: 'Publish this component to the marketplace for others to use within their projects.',
    link: { label: 'Learn More', url: '' },
    primaryBtn: EDIT_BTN,
    secondaryBtn: PUBLISH_BTN,
  },
  [PreviewStateMessage.PublishedCurrentVersion]: {
    msg: 'Changes to this component are isolated within your project and will not affect the original.',
    primaryBtn: EDIT_BTN,
  },
  [PreviewStateMessage.PublishedDifferentVersion]: {
    msg: 'This is a different version of the component imported in this project.',
    primaryBtn: SWAP_VERSION_BTN,
  },
};
