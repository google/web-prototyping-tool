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

import fs from 'fs';
import path from 'path';
import * as child from 'child_process';

import * as consts from './consts';

export const buildPath = (...args: string[]) => {
  return args.join(consts.FORWARD_SLASH_CHARACTER);
};

export const copyFile = async (filePath: string, destPath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    makeDirSyncIfNoneExists(destPath);

    fs.copyFile(filePath, destPath, (error) => {
      if (error) {
        console.error(error);
        return reject();
      }

      resolve();
    });
  });
};

export const exec = (args: string, opts?: any) => {
  return new Promise((resolve, reject) => {
    child.exec(args, opts, (err, stdout) => {
      if (err) return reject(err);
      return resolve(stdout);
    });
  });
};

export const kebabToTitleCase = (str: string): string => {
  const parts = str.split(consts.FORWARD_SLASH_CHARACTER);
  return parts
    .map((part) => {
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(consts.SPACE_CHARACTER);
};

export const listDirs = (files: string[]): string[] => {
  return files.reduce((acc, curr) => {
    const dirName = path.dirname(curr);

    if (acc.includes(dirName)) return acc;

    acc.push(dirName);

    return acc;
  }, [] as string[]);
};

export const makeDirSyncIfNoneExists = (dir: string) => {
  const newPath = dir.substring(0, dir.lastIndexOf(consts.FORWARD_SLASH_CHARACTER));

  if (fs.existsSync(newPath)) return;

  fs.mkdirSync(newPath, { recursive: true });
};

export const parseParts = (firstParts: string[], secondParts: string[]) => {
  return parseInt(firstParts[secondParts.length - 2], 10);
};

export const readConfig = (config: string) => {
  return JSON.parse(fs.readFileSync(config, consts.UTF8));
};

export const readFile = (filePath: string) =>
  new Promise((resolve, reject) => {
    fs.readFile(filePath, consts.UTF8, (err, data) => {
      if (err) return reject(err);
      resolve(data);
    });
  });

export const removeDoubleDashes = (str: string): string => {
  return str.replace(consts.CONSEQUTIVE_DASHES_REGEX, consts.DASH_CHARACTER);
};

export const renameFile = (original: string, replacement: string): Promise<string | undefined> => {
  return new Promise((resolve, reject) => {
    if (original === replacement) return resolve(replacement);

    fs.rename(original, replacement, (err) => {
      if (err) return reject(err);

      resolve(undefined);
    });
  });
};

export const walkDir = (dir: string, fileType?: string, fileList = []) => {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = `${dir}/${file}`;
    const stat = fs.statSync(filePath);

    if (stat && stat.isDirectory()) {
      fileList = walkDir(filePath, fileType, fileList);
    } else {
      if (file) {
        fileList.push(filePath as never);
      }
    }
  }

  return fileList;
};

export const writeFile = (filePath: string, contents: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, contents, consts.UTF8, (err) => {
      if (err) {
        console.log('err', err);
        return reject(err);
      }

      resolve();
    });
  });
};
