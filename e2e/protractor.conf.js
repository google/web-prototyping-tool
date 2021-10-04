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

/**
 * Protractor configuration file, see link for more information
 * https://github.com/angular/protractor/blob/master/lib/config.ts
 *
 * We launch 8 (defined in maxInstances below) chromium instances,
 * which load-balance the spec files.
 * Please refer to protractor documentation above,
 * on "shardTestFiles" and "maxInstances".
 *
 * However, we don't really use protractor's drivers to run test;
 * we use puppeteer instead. So we're just telling protractor to
 * launch puppeteer.
 */

const { SpecReporter, DisplayProcessor } = require('jasmine-spec-reporter');
const puppeteer = require('puppeteer');
const rootTSConfig = require('../tsconfig.json');
const { env } = require('process');

class JasmineSpecProcessorForBuildLog extends DisplayProcessor {
  displaySummaryErrorMessages(spec, log) {
    const { fullName, description } = spec;
    const suite = fullName.substr(0, fullName.length - description.length);
    const logLines = log.split('\n');
    logLines.unshift(`${suite}: ${description}`);
    logLines.push(''); // Extra line to make things tidier when concatenated

    return logLines.map((line) => `##E2E_LOG_PARSER_TAG## ${line}`).join('\n');
  }
}

// "install-e2e-chrome": "webdriver-manager update --versions.chrome=86.0.4240.22",

// Docs for this config: https://github.com/angular/protractor/blob/5.4.1/lib/config.ts
exports.config = {
  allScriptsTimeout: 20000,
  puppeteerTimeout: 10000, // Used on "waitForSelector", etc.
  specs: ['./src/**/*.e2e-spec.ts'],
  capabilities: {
    browserName: 'chrome',
    chromeOptions: {
      args: ['--disable-gpu', '--window-size=1460,1040', '--no-sandbox', '--disable-dev-shm-usage'],
      binary: puppeteer.executablePath(),
    },
    defaultViewport: { width: 1440, height: 900 },
  },
  directConnect: true,
  chromeDriver: '../node_modules/webdriver-manager/selenium/chromedriver_86.0.4240.22',
  baseUrl: 'http://localhost:4201/',
  framework: 'jasmine',
  jasmineNodeOpts: {
    showColors: !env.CLOUDBUILD,
    stopSpecOnExpectationFailure: true,
    defaultTimeoutInterval: 60000,
    print: function () {},
  },
  onPrepare() {
    require('ts-node').register({
      project: require('path').join(__dirname, './tsconfig.e2e.json'),
    });
    require('tsconfig-paths').register({
      baseUrl: './',
      paths: rootTSConfig.compilerOptions.paths,
    });
    jasmine.getEnv().addReporter(
      new SpecReporter({
        spec: { displayStacktrace: 'raw' },
        colors: { enabled: !env.CLOUDBUILD },
        customProcessors: env.CLOUDBUILD ? [JasmineSpecProcessorForBuildLog] : [],
      })
    );
  },
};
