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

import { APP_URL } from '../environments/environment';
import { isProd, exceptionsCollection } from './firebase.utils';
import { FirebaseField, FirebaseQueryOperation } from 'cd-common/consts';
import { chatURL, truncateText, sendChatMessageWithText } from '../chatbot/chatbot.utils';
import * as firebaseAdmin from 'firebase-admin';
import * as cd from 'cd-interfaces';

interface IExceptionLineEntry {
  message: string;
  stack?: string;
  count: number;
  urls: Set<string>;
  lastSeenTime?: FirebaseFirestore.Timestamp;
}

const allTag = '<users/all>';
const NUM_URLS_LIMIT = 10;
const DIVIDER_LENGTH = 50;
const DIVIDER_CHAR = '═';

export const getYesterdaysExceptions = async () => {
  const nowDate = new Date();
  nowDate.setDate(nowDate.getDate() - 1);
  const startTime = firebaseAdmin.firestore.Timestamp.fromMillis(nowDate.getTime());

  console.log(
    'Checking for exceptions between',
    startTime.toDate().toLocaleString(),
    'and',
    new Date().toLocaleString()
  );

  const exceptionDocs = await exceptionsCollection
    .where(FirebaseField.CreatedAt, FirebaseQueryOperation.GreaterThanOrEqualTo, startTime)
    .get();

  return exceptionDocs.docs.map((doc) => doc.data() as cd.IExceptionEvent);
};

const getMessageLineEntry = (
  exception: cd.IExceptionEvent,
  exceptionEntries: Map<string, IExceptionLineEntry>
): IExceptionLineEntry => {
  const { url, messageHash, message: exceptionMessage, stack } = exception;
  const fullUrl = `${APP_URL}${url}`;

  if (exceptionEntries.has(messageHash)) {
    const { message, urls, count } = exceptionEntries.get(messageHash) as IExceptionLineEntry;
    const newCount = count + 1;
    return {
      message,
      stack,
      count: newCount,
      urls: urls.add(fullUrl),
    };
  }

  return {
    message: exceptionMessage,
    stack,
    urls: new Set([fullUrl]),
    count: 1,
  };
};

const getExceptionObjects = (
  exceptions: cd.IExceptionEvent[]
): Map<string, IExceptionLineEntry> => {
  return exceptions.reduce((acc, exception) => {
    const entry = getMessageLineEntry(exception, acc);
    const { messageHash } = exception;
    acc.set(messageHash, entry);
    return acc;
  }, new Map<string, IExceptionLineEntry>());
};

const NUM_ISSUES_FIXED_STRING = 'Num issues fixed:';

const getExceptionMessages = (exceptions: cd.IExceptionEvent[]): string[] => {
  const exceptionObjects = getExceptionObjects(exceptions);
  const exceptionLineEntries = [...exceptionObjects.values()];

  return exceptionLineEntries.map((lineEntry) => {
    const { message: originalMessage, stack, count, urls } = lineEntry;
    const message = originalMessage.split('\n').join(' ');
    const healthCheckException = message.startsWith(NUM_ISSUES_FIXED_STRING);
    const subtitleLine = getSubtitleLineString(count, urls);
    const firstLine = healthCheckException ? 'Health check issues' : message;
    const trimmedAndJoinedStack = !!stack ? getStackString(stack, message) : '';
    const stackString = healthCheckException ? message : trimmedAndJoinedStack;
    const messageAndSubtitle = `*${firstLine}*\n${subtitleLine}`;
    const truncatedStack = !!stackString
      ? `\n\`\`\`${truncateText(stackString, messageAndSubtitle.length)}\`\`\``
      : '';
    return `${messageAndSubtitle}${truncatedStack}`;
  });
};

const getTitleString = (numExceptions: number): string => {
  const exceptions = `${numExceptions} Exceptions in the past 24 hours*`;
  const envLabel = isProd() ? 'PROD' : 'DEV';
  const envString = `*${envLabel}: `;
  const optionalAlert = isProd() ? [` ${allTag}`] : [];
  return [envString, exceptions, ...optionalAlert].join('');
};

const getSubtitleLineString = (count: number, urlsSet: Set<string>): string => {
  const urls = [...urlsSet];
  // Generates URL links line. (Ex. '[1] [2] [3]')
  const urlsString = urls
    .slice(0, NUM_URLS_LIMIT)
    .map((url, index) => chatURL(url, `[${index + 1}]`))
    .join(' ');
  // Adds '+' to end of URLS if more than num URLs limit
  const moreURLsThanLimitChar = urls.length > NUM_URLS_LIMIT ? '+' : '';
  return `Count: ${count} - ${urlsString}${moreURLsThanLimitChar}`;
};

const getStackString = (stack: string, message = ''): string => {
  // If first line of stack is message, then remove
  const stackLines = stack.split('\n').filter((line) => line !== '');
  if (stackLines[0].trim() === message.trim()) {
    stackLines.shift();
  }
  return stackLines.join('\n');
};

export const sendExceptionMessages = async (exceptions: cd.IExceptionEvent[]) => {
  const titleString = getTitleString(exceptions.length);
  await sendChatMessageWithText(titleString);

  const exceptionMessages = getExceptionMessages(exceptions);
  for (const message of exceptionMessages) {
    await sendChatMessageWithText(message);
  }
};

export const filterOutCodeComponentErrors = (exceptions: cd.IExceptionEvent[]) => {
  return exceptions.filter(
    (ex: cd.IExceptionEvent) => ex.message.indexOf(cd.CODE_COMPONENT_ERROR_PREFIX) === -1
  );
};

export const getDividerString = (): string => {
  return `\n${new Array(DIVIDER_LENGTH).fill(DIVIDER_CHAR).join('')}\n`;
};
