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

const EXCEPTIONS_CHAT_KEY = 'AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI';
const EXCEPTIONS_CHAT_TOKEN = 'lmLCmIanWnUzEWllMWQ3jnMYEtuY5kuCS0W1ZsaUwds%3D';
const EXCEPTIONS_CHAT_ROOM = 'AAAAYP-uYRE';
export const SPACES_BASE = `spaces/${EXCEPTIONS_CHAT_ROOM}`;
export const EXCEPTIONS_CHAT_API_PATH = `/v1/${SPACES_BASE}/messages?key=${EXCEPTIONS_CHAT_KEY}&token=${EXCEPTIONS_CHAT_TOKEN}`;
