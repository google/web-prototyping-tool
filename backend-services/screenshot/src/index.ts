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

import { pollForTasks } from './task';
import { SERVER_PORT } from './utils';
import * as path from 'path';

import * as debugAgent from '@google-cloud/debug-agent';
debugAgent.start();

const APP_DIRECTORY = './web-prototyping-tool';
const INDEX_FILE = 'index.html';

declare var __non_webpack_require__: any;
const express = __non_webpack_require__('express');
const app = express();

const handleStatusRequest = (_req: any, res: any) => {
  res.status(200).send('Screenshot service running');
};

// host app as static dir
app.use(express.static(APP_DIRECTORY));

// setup endpoint for checking status
app.get('/status', handleStatusRequest);

// send all other routes to index.html of angular app
app.get('*', (_req: any, res: any) => {
  res.sendFile(path.resolve(APP_DIRECTORY, INDEX_FILE));
});

app.listen(SERVER_PORT, () => {
  console.log(`Server listening on port ${SERVER_PORT}`);
  pollForTasks();
});

process.on('unhandledRejection', (reason, _promise) => {
  console.log('Unhandled Rejection at:', reason);
});

process.on('uncaughtException', (error) => {
  console.log('Uncaught exception at:', error.message);
});
