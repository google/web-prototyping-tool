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

'use strict';
const { walkDir, readFile, writeFile, readFileSync } = require('./utils');
const _exec = require('child_process').exec;
const START = '/*\n * Copyright 2021 Google LLC';
const END = '*/';
const extensions = ['.ts', '.js', '.css', '.scss'];
const directories = [
  './firebase',
  './src',
  './scripts',
  './e2e',
  './projects/cd-common',
  './projects/cd-interfaces',
  './projects/cd-metadata',
  './projects/cd-themes',
  './projects/cd-utils',
  './projects/renderer',
  './projects/render-outlet',
  './projects/component-demos',
  './projects/cd-export',
  './projects/cd-definitions',
  './backend-services',
  './documentation',
];
console.log('📄 Running License generator');

const license = readFileSync('LICENSE');
const args = process.argv.slice(2);
const force_update = args.includes('-f');
const dont_add = args.includes('-na');

directories.map((dir) => {
  console.log(`Reading directory ${dir}`);
  const files = walkDir(dir, extensions);
  Promise.all(
    files.map((file) =>
      readFile(file)
        .then((data) => {
          const startLic = data.indexOf(START);
          // Does a license exist ?
          if (startLic !== -1) {
            // Does license match current ?
            const endLic = data.indexOf(END, startLic);
            if (endLic !== -1) {
              const lic = data.substring(startLic, endLic + END.length);
              if (lic !== license && force_update === true) {
                console.log('✏️ Updating license for ', file);
                return data.replace(lic, license);
              }
            } else {
              throw new Error(`🔥 Could not find end of license for ${file}`);
            }
          } else {
            console.log('✏️ Adding license to', file);
            return license + `\n\n` + data;
          }
        })
        .then((newFile) => {
          if (!newFile) return;
          return writeFile(file, newFile).then(() => {
            if (dont_add) return;
            return _exec(`git add ${file}`);
          });
        })
    )
  ).catch((e) => {
    console.error(e);
    process.exit(1);
  });
});
