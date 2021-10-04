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

const path = require('path');
const DefaultConfig = require('./webpack.config.js');
const { resolve } = DefaultConfig;

// Add an alias to map default email config to prod email config
const defaultConfig = path.resolve(__dirname, './functions/src/environments/environment.ts');
const prodConfig = path.resolve(__dirname, './functions/src/environments/environment.prod.ts');

resolve.alias[defaultConfig] = prodConfig;

module.exports = {
  ...DefaultConfig,
  resolve,
};
