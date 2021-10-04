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

import { environment } from 'src/environments/environment';
import * as cd from 'cd-interfaces';

declare let gapi: any | undefined;

const GOOGLE_DOMAIN = 'google.com';
const AUTH_TOKEN_ID = 'id_token';
const PHOTO_URL_BASE = '';
const PEOPLE_API_SCOPE = 'https://www.googleapis.com/auth/peopleapi.readonly';
const PROFILE_CONTAINER_TYPE = 'PROFILE';
const MAX_SUGGESTIONS = 5;

const INIT_CONFIG: Partial<cd.IGapiAuthConfig> = {
  clientId: environment.clientId,
  scope: PEOPLE_API_SCOPE,
};

const SIGN_IN_CONFIG: Partial<cd.IGapiAuthConfig> = {
  scope: PEOPLE_API_SCOPE,
  prompt: 'consent',
  hosted_domain: GOOGLE_DOMAIN,
};

const constructAutocompleteRequestUrl = (query: string): string => {
  return `${environment.peopleApiUrl}/autocomplete?query=${query}&client=DOMAIN_PERSON_ONLY`;
};

/** Checks to see if the the library has loaded in index.html */
export const didGAPILoad = () => 'gapi' in window;

export const getSessionToken = () => {
  return gapi.auth2.init(INIT_CONFIG).then((authInstance: any) => {
    return authInstance.currentUser.get().getAuthResponse(true)[AUTH_TOKEN_ID];
  });
};

export const getGrantedScopesList = async (): Promise<string[]> => {
  const authInstance = await gapi.auth2.init(INIT_CONFIG);
  const scopes = authInstance.currentUser.get().getGrantedScopes();

  return scopes === null ? [] : scopes.split(' ');
};

export const checkScopes = async (): Promise<boolean> => {
  const authInstance = await gapi.auth2.getAuthInstance();
  const scopes = authInstance.currentUser.get().getGrantedScopes();

  return scopes.includes(PEOPLE_API_SCOPE);
};

export const revokeGrantedScopes = async () => {
  const authInstance = await gapi.auth2.getAuthInstance();
  authInstance.currentUser.get().disconnect();
};

export const signInWithGapi = (): Promise<string> => {
  return gapi.auth2
    .init(INIT_CONFIG)
    .then(async () => {
      const googleAuth: any = gapi.auth2.getAuthInstance();
      const googleUser = await googleAuth.signIn(SIGN_IN_CONFIG);
      const authToken = googleUser.getAuthResponse()[AUTH_TOKEN_ID];

      return authToken;
    })
    .catch((error: any) => {
      console.error('Failed to sign-in', error);
    });
};

export const signOutWithGapi = async () => {
  const googleAuth: any = gapi.auth2.getAuthInstance();
  if (!googleAuth) return;

  await googleAuth.signOut();
};

export const lookupUserByQuery = (query: string, imageSize?: number): Promise<cd.PartialUser[]> => {
  if (!environment.gapiEnabled || !gapi) return Promise.resolve([]);

  const path = constructAutocompleteRequestUrl(query);

  return gapi.client
    .request({ path, method: 'GET' })
    .then((response: cd.IPeopleApiAutoCompleteResponse) => {
      const results = response.result.results;
      return results
        ? results
            .map((match) => convertMatchToIUser(match, imageSize))
            .filter((user) => !!user)
            .slice(0, MAX_SUGGESTIONS)
        : [];
    })
    .catch((reason: cd.IGapiError | Error) => {
      const gapiError = reason as cd.IGapiError;
      const error = reason as Error;
      if (gapiError?.result?.error) console.error(gapiError.result.error);
      else if (error?.message) console.error(error.message);
    });
};

const convertMatchToIUser = (
  match: cd.IPeopleApiResponseInnerResult | undefined,
  imageSize?: number
): cd.PartialUser | undefined => {
  if (!match) return;
  const { name: nameMatches, email: emailMatches } = match.person;
  if (!nameMatches || !emailMatches) return;

  // Find the name that has "containerType": "PROFILE" associated with it if possible
  const name: string =
    nameMatches.find((n) => n?.metadata?.containerType === PROFILE_CONTAINER_TYPE)?.displayName ||
    nameMatches[0].displayName;

  const email: string = emailMatches[0].value;
  const username: string = stripCompanyFromEmail(email);
  const photoUrl: string = generateAvatarUrl(username, imageSize);

  return { name, photoUrl, email };
};

const generateAvatarUrl = (username: string, size = 40): string => {
  return `${PHOTO_URL_BASE}/${username}?sz=${size}`;
};

const stripCompanyFromEmail = (email: string): string => email.split('@')[0];
