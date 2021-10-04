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

const baseConfig = require('./protractor.conf.js');
const { config } = baseConfig;

config.allScriptsTimeout = 0x7fffffff;
config.puppeteerTimeout = 0x7fffffff;
config.jasmineNodeOpts.defaultTimeoutInterval = 0x7fffffff;
config.capabilities.chromeOptions.args.push(
  '--auto-open-devtools-for-tabs',
  '--window-size=1990,1040'
);

exports.config = config;
