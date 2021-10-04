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

import express from 'express';

import { APPROVED_ORIGINS, APPROVED_BRANCH_ORIGIN_REGEX } from '../environments/environment';
import * as serverConsts from '../consts/server.consts';

const approvedBranchRegex = APPROVED_BRANCH_ORIGIN_REGEX
  ? new RegExp(APPROVED_BRANCH_ORIGIN_REGEX, 'i')
  : false;

const originIsApproved = (origin: string): boolean => {
  const approvedOrigin = APPROVED_ORIGINS.includes(origin);
  const approvedBranchOrigin = approvedBranchRegex && approvedBranchRegex.test(origin);
  return approvedOrigin || approvedBranchOrigin;
};

export const cookieSync = (_req: express.Request, res: express.Response) => {
  res.status(serverConsts.HttpStatus.Ok).send('');
};

export const verifyOrigins: express.RequestHandler = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const origin = req.header(serverConsts.HTTP_HEADER_ORIGIN);

  if (origin && originIsApproved(origin)) {
    res.set(serverConsts.HTTP_HEADER_ACCESS_CONTROL_ALLOW_ORIGIN, origin);
    res.set(serverConsts.HTTP_HEADER_ACCESS_CONTROL_ALLOW_CREDS, true.toString());
  }

  next();
};
