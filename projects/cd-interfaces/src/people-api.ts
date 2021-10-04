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

import { IHttpResponseHeaders } from './network';

export interface IPeopleApiPerson {
  personId: string;
  metadata: IPeopleApiPersonMetaData;
  name?: IPeopleApiPersonName[];
  photo?: IPeopleApiPersonPhoto[];
  email?: IPeopleApiPersonEmail[];
  organization?: IPeopleApiPersonOrganization[];
  location?: IPeopleApiPersonLocation[];
  socialConnection?: IPeopleApiPersonSocialConnection[];
  readOnlyProfileInfo?: IPeopleApiPersonReadOnlyProfileInfo[];
  profileUrlRepeated?: IPeopleApiPersonProfileUrlRepeated[];
}

export interface IPeopleApiResponseInnerResult {
  suggestion: string;
  objectType: string;
  person: IPeopleApiPerson;
}

export interface IPeopleApiAutoCompleteResponse {
  result: IPeopleApiResponseOuterResult;
  body: string;
  headers: IPeopleApiResponseHeaders;
  status: number;
  statusText?: string;
}

export interface IPeopleApiErrorResponse {
  code: number;
  message: string;
  status: string;
  details: IPeopleApiErrorDetail[];
}

interface IPeopleApiErrorDetail {
  '@type': string;
  detail: string;
}

interface IPeopleApiAffinity {
  loggingId: string;
}

interface IPeopleApiIdentityInfo {
  sourceIds: IPeopleApiSourceId[];
}

interface IPeopleApiPersonEmail {
  metaData: IPeopleApiPersonFieldMetaData;
  value: string;
}

interface IPeopleApiPersonFieldMetaData {
  encodedContainerId: string;
  containerType: string;
}

interface IPeopleApiPersonLocation {
  value: string;
}

interface IPeopleApiPersonName {
  metadata: IPeopleApiPersonFieldMetaData;
  displayName: string;
  givenName: string;
}

interface IPeopleApiPersonOrganization {
  metaData: IPeopleApiPersonFieldMetaData;
  title: string;
  stringType: string;
}

interface IPeopleApiPersonPhoto {
  metaData: IPeopleApiPersonFieldMetaData;
  url: string;
}

interface IPeopleApiPersonProfileUrlRepeated {
  metaData: IPeopleApiPersonFieldMetaData;
  url: string;
}

interface IPeopleApiPersonReadOnlyProfileInfo {
  ownerId: string;
  ownerUserType: string[];
  inViewerDomain: boolean;
}

interface IPeopleApiPersonSocialConnection {
  metaData: IPeopleApiPersonFieldMetaData;
  type: string[];
}

interface IPeopleApiPersonMetaData {
  ownerId: string;
  objectType: string;
  contactId: string[];
  inViewerDomain: boolean;
  ownerUserType: string[];
  affinity: IPeopleApiAffinity[];
  identityInfo: IPeopleApiIdentityInfo;
}

interface IPeopleApiResponseHeaders extends IHttpResponseHeaders {
  date: string;
  server: string;
  vary: string;
}

interface IPeopleApiResponseOuterResult {
  results: IPeopleApiResponseInnerResult[];
  nextPageToken: string;
  status: object;
}

interface IPeopleApiSourceId {
  id: string;
  containerType: string;
}
