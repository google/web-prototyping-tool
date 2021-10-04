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

import { openLinkInNewTab } from 'cd-utils/url';
import { Route } from 'src/app/configs/routes.config';
import * as cd from 'cd-interfaces';

export const convertUserToUserIdentity = (user: cd.IUser): cd.IUserIdentity => {
  const { id, email } = user;
  return { id, email } as cd.IUserIdentity;
};

export enum UserMenuEvents {
  Remove,
  Projects,
  Componets,
  Teams,
}

export const openUserProjects = (email?: string | null) => {
  if (!email) return;
  const url = `/${Route.Dashboard}?search=owner:${email}`;
  openLinkInNewTab(url);
};

export const openUserTeamsPage = (email?: string | null) => {
  if (!email) return;
  const url = `http://who/${email}`;
  openLinkInNewTab(url);
};

export const USER_ACTIONS_MENU: cd.IMenuConfig[] = [
  { title: 'Projects', value: UserMenuEvents.Projects, icon: 'launch' },
  { title: 'Teams', value: UserMenuEvents.Teams, icon: 'account_circle_filled' },
];
