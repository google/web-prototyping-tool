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

const fs = require('fs');
const path = require('path');
const _exec = require('child_process').exec;
const UTF8 = 'utf8';

const walkDir = (dir, fileTypes = [], fileList = []) => {
  const files = fs.readdirSync(dir);
  for (let file of files) {
    const filePath = `${dir}/${file}`;
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      fileList = walkDir(filePath, fileTypes, fileList);
    } else {
      if (file && fileTypes.includes(path.extname(file))) {
        fileList.push(filePath);
      }
    }
  }
  return fileList;
};

const createDir = filePath => {
  console.log(filePath);
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(filePath);
  }
};

const readFile = filePath =>
  new Promise((resolve, reject) => {
    // console.log('read file', filePath)
    fs.readFile(filePath, UTF8, (err, data) => {
      if (err) return reject();
      resolve(data);
    });
  });

const exec = (args, opts) =>
  new Promise((resolve, reject) => {
    console.log('running ' + args);
    _exec(args, opts, (err, stdout) => {
      if (err) return reject(err);
      return resolve(stdout);
    });
  });

const writeFile = (filePath, contents) =>
  new Promise((resolve, reject) => {
    console.log('writing file', filePath);
    fs.writeFile(filePath, contents, UTF8, err => {
      if (err) {
        console.log('err', err);
        return reject();
      }
      resolve();
    });
  });

const readFileSync = file => fs.readFileSync(path.resolve(__dirname, file), UTF8);

const capitalizeFirstLetter = string => string.charAt(0).toUpperCase() + string.slice(1);

const toCamelCase = str =>
  str.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());

const appendImportsToFile = (fileContents, importValue) => {
  const IMPORT_REGEX = /(import.+)+[^{\;]/g;
  const importList = fileContents.match(IMPORT_REGEX);
  const lastImport = importList[importList.length - 1];
  return fileContents.replace(lastImport, lastImport + importValue);
};

module.exports = {
  readFile,
  readFileSync,
  walkDir,
  exec,
  createDir,
  writeFile,
  appendImportsToFile,
  capitalizeFirstLetter,
  toCamelCase,
};
