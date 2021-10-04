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

import * as https from 'https';

/** Room: " Image Tests" */
const IMAGE_TEST_CHAT_ROOM = 'AAAA0zLmtbo';
const IMAGE_TEST_CHAT_KEY = 'AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI';
const IMAGE_TEST_CHAT_TOKEN = 'zrWL17a-jv5OEV5mDPi-eDcKjtNRvnLxZrj3BfW-cMY%3D';
const IMAGE_TEST_CHAT_API_PATH = `/v1/spaces/${IMAGE_TEST_CHAT_ROOM}/messages?key=${IMAGE_TEST_CHAT_KEY}&token=${IMAGE_TEST_CHAT_TOKEN}`;

const CHAT_HOST = 'chat.googleapis.com';
const THREAD_KEY = 'threadKey';
const HTTP_POST = 'POST';
const HTTP_CONTENT_TYPE_KEY = 'Content-Type';
const HTTP_APPLICATION_JSON = 'application/json';
const SEND_MESSAGE_ERROR = 'SendMessage Error:';
const DATA_EVENT = 'data';
const END_EVENT = 'end';
const ERROR_EVENT = 'error';

/** Sends a card with failed image, and buttons for failed/baseline.l */
export const sendImageFailureCard = (
  baselineImageUrl: string,
  errorImageUrl: string
): Promise<void> => {
  return postChatRequest({
    cards: [
      {
        sections: [
          {
            widgets: [
              {
                image: { imageUrl: errorImageUrl },
              },
              {
                buttons: [
                  {
                    textButton: {
                      text: 'View Baseline',
                      onClick: {
                        openLink: {
                          url: baselineImageUrl,
                        },
                      },
                    },
                  },
                  {
                    textButton: {
                      text: 'View Error',
                      onClick: {
                        openLink: {
                          url: errorImageUrl,
                        },
                      },
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  });
};

/** Sends a single text message to chat. */
export const sendChatMessage = (message: string, threadId?: string): Promise<void> => {
  return postChatRequest({ text: message }, threadId);
};

const postChatRequest = (data: {}, threadId?: string): Promise<void> => {
  let path = IMAGE_TEST_CHAT_API_PATH;
  if (threadId) {
    path += `&${THREAD_KEY}=${threadId}`;
  }

  const options: https.RequestOptions = {
    hostname: CHAT_HOST,
    path: path,
    method: HTTP_POST,
    headers: { [HTTP_CONTENT_TYPE_KEY]: HTTP_APPLICATION_JSON },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      res.on(DATA_EVENT, (resData) => {
        if (!res.statusCode) return;

        if (res.statusCode >= 400) {
          console.error(
            SEND_MESSAGE_ERROR,
            options.hostname,
            res.statusCode,
            res.statusMessage,
            resData.toString()
          );
        }
      });

      res.on(END_EVENT, () => {
        if (!res.statusCode) return;
        if (res.statusCode >= 200 && res.statusCode <= 299) {
          resolve();
        } else {
          reject(`${res.statusCode} ${res.statusMessage}`);
        }
      });
    });

    req.on(ERROR_EVENT, reject);
    req.write(JSON.stringify(data));
    req.end();
  });
};
