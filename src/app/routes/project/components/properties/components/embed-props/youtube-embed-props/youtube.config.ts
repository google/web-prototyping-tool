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

export enum YouTubeParams {
  AutoPlay = 'autoplay',
  Controls = 'controls',
  /** Allows controlling the video via postmessage */
  JSApi = 'enablejsapi',
}

export const YOUTUBE_EMBED_URL = 'youtube.com/embed/';
export const DEFAULT_YOUTUBE_VIDEO = `https://www.${YOUTUBE_EMBED_URL}y0U4sD3_lX4?${YouTubeParams.JSApi}=1`;
export const YOUTUBE_WATCH_URL = 'https://www.youtube.com/watch?v=';
export const DEFUALT_YOUTUBE_SIZE = [480, 270];
