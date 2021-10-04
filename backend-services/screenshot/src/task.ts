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
import * as utils from './utils';
import * as db from './firebase';
import { log, logError } from './log';
import { takeScreenshot } from './puppeteer';

const POLL_TIMEOUT = 5000;

export const getTimeout = () => 1000 + Math.random() * POLL_TIMEOUT;

const cleanupTask = async (task: cd.IScreenshotTask) => {
  log(`Starting task for target: ${task.targetId} in project: ${task.projectId}`);
  await db.deleteTaskFromQueue(task);
  await runTask(task);
  log(`[${task.targetId}]: Task complete`);
};

export const pollForTasks = async (timeout = POLL_TIMEOUT) => {
  try {
    const task = await db.checkForTask();
    if (task.size > 0) {
      const screenshotTask = task.docs[0].data() as cd.IScreenshotTask;
      await cleanupTask(screenshotTask);
      setTimeout(pollForTasks, getTimeout());
    } else {
      setTimeout(pollForTasks, timeout);
    }
  } catch (err) {
    logError(`Polling error: ${err}`);
  }
};

const runTask = async (task: cd.IScreenshotTask): Promise<void> => {
  const { projectId, targetId } = task;
  if (!projectId || !targetId) {
    const msg = `Invalid task: projectId and/or targetId missing. Task: ${JSON.stringify(task)}`;
    return logError(msg);
  }
  try {
    const targetElement = await db.checkForTarget(targetId);
    if (!targetElement.exists) {
      return log(`Target ${targetId} element missing in Firebase collection, skipping`);
    }

    log(`Running task for target: ${targetId} in project: ${projectId}`);
    const token = await db.createScreenshotUserToken();
    const url = utils.constructScreenshotUrl(task, token);
    const screenshot = await takeScreenshot(url);
    if (!screenshot) throw Error('Missing screenshot');

    await db.uploadScreenshot(screenshot, targetId);
  } catch (err) {
    const msg = `Failed to generate screenshot for ${targetId} in project[${projectId}]: ${err}`;
    log(msg);
    db.retryTask(task);
  }
};
