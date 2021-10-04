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

import type { IMenuConfig, IRichTooltip } from 'cd-interfaces';

export const GUIDE_URL = '';
export const STARTER_PROJECTS_URL = '';
export const UNTITLED_CUSTOM_COMPONENT_NAME = 'Untitled Component';
export const CODE_CMP_OUTLET_FRAME_PADDING = 24;
export const FILE_SIZE_LIMIT_ERROR = 'File size limit exceeded. Limit is 5 MB';
export const FILE_SIZE_LIMIT = 5240000; // 5 MB

export enum CustomComponentTileAction {
  Edit = 'edit',
  Delete = 'delete',
  ViewDetails = 'details',
  RegenerateScreenshot = 'regen', // Admin only
}

export const customCmpTileMenuConfig: IMenuConfig[][] = [
  [
    {
      title: 'Edit',
      icon: 'edit',
      id: CustomComponentTileAction.Edit,
    },
    {
      title: 'View details',
      icon: 'zoom_in',
      id: CustomComponentTileAction.ViewDetails,
      divider: true,
    },
    {
      title: 'Delete',
      icon: 'delete',
      id: CustomComponentTileAction.Delete,
    },
  ],
];

export const customCmpTileMenuConfigAdmin: IMenuConfig[][] = [
  ...customCmpTileMenuConfig,
  [
    {
      title: 'Regenerate screenshot',
      icon: 'refresh',
      id: CustomComponentTileAction.RegenerateScreenshot,
    },
  ],
];

const TAG_NAME_REQUIREMENTS_LIST = `
  <br>
  <ul style="padding-left: var(--cd-spacing-5);">
    <li>Must start with a letter</li>
    <li>Must contain a hypen</li>
    <li>Only lowercase letters, numbers, hyphens, periods, and underscores allowed</li>
  </ul>
`;

export const TAG_NAME_HELP_TEXT: IRichTooltip = {
  text: `
    The tag name used to render your custom element.
    <br />
    For example: my-code-component
    ${TAG_NAME_REQUIREMENTS_LIST}
  `,
  link: '',
  linkText: 'Learn more',
};

export const NO_TAG_NAME_ERROR_TEXT: IRichTooltip = {
  text: `Tag name is required.`,
  linkText: 'Learn more',
  link: '',
};

export const getInvalidTagNameErrorText = (tagName: string): IRichTooltip => {
  return {
    text: `
      '${tagName}' is not a valid tag name.
      ${TAG_NAME_REQUIREMENTS_LIST}
    `,
    linkText: 'Learn more',
    link: '',
  };
};
