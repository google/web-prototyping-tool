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

import * as cd from 'cd-interfaces';
import { isString } from 'cd-utils/string';

export const BLOB_SCHEMA = 'blob:';
const FILENAME_DENSITY_EXT_REGEX = /(?:@([0-9.]+)x)?\.[^.]+$/i;
const DEFAULT_DENSITY = 1;
const FETCH_CONFIG: RequestInit = { credentials: 'include' };

export const fetchBlob = (url: string): Promise<Blob> => {
  return fetch(url, FETCH_CONFIG).then((response) => response.blob());
};

export const fetchJSON = <T>(url: string): Promise<T> => {
  return fetch(url, FETCH_CONFIG).then((response) => response.json());
};

export const fileFromBlob = (blob: Blob, fileName: string): File => {
  const modifiedBlob: any = blob;

  modifiedBlob.lastModifiedDate = new Date();
  modifiedBlob.name = fileName;

  return <File>modifiedBlob;
};

export const isImageMime = (type: string): boolean => {
  return Object.values(cd.ImageMime as cd.IStringMap<string>).includes(type);
};

export const isJsonMime = (type: string): boolean => {
  return cd.FileMime.JSON === type;
};

export const selectFiles = (
  acceptTypes: ReadonlyArray<string>,
  multiple = true
): Promise<File[] | null> => {
  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = multiple;
  if (acceptTypes) input.accept = acceptTypes.toString();

  input.click();

  return new Promise((resolve) => {
    input.onchange = () => {
      const { files } = input;
      if (files === null) {
        resolve(null);
        return;
      }

      // Users can bypass input.accept, so filter again.
      // (observed at least on Chrome + macOS)
      const filteredFiles = filterFileTypes(files, acceptTypes);
      resolve(filteredFiles);
    };
  });
};

export const filterFileTypes = (
  files: File[] | FileList,
  acceptTypes: ReadonlyArray<string>
): File[] => Array.from(files).filter((file) => acceptTypes.includes(file.type));

export interface IImageFileMetadata {
  name: string;
  density: number;
  width: number;
  height: number;
  imageType: cd.ImageMime;
  blobUrl: string;
}

export const getImageFileMetadata = (file: File): Promise<IImageFileMetadata> => {
  const blobUrl = URL.createObjectURL(file);
  const density = getImageFileDensity(file);
  const name = getImageFileName(file);
  const imageType = file.type as cd.ImageMime;

  const image = new Image();

  const returnPromise = new Promise<IImageFileMetadata>((resolve, reject) => {
    image.onload = () => {
      const width = image.width / density;
      const height = image.height / density;

      resolve({ name, density, width, height, imageType, blobUrl });
    };

    image.onerror = (err: any) => reject(err);
  });

  image.src = blobUrl;

  return returnPromise;
};

export const destroyImageFileMetadata = ({ blobUrl }: IImageFileMetadata) => {
  URL.revokeObjectURL(blobUrl);
};

export const getImageFileDensity = (file: File): number => {
  const match = file.name.match(FILENAME_DENSITY_EXT_REGEX);
  if (!match) return DEFAULT_DENSITY;

  const densityString = match[1];
  if (!densityString) return DEFAULT_DENSITY;

  const density = parseFloat(densityString);
  return isNaN(density) ? DEFAULT_DENSITY : density;
};

export const getImageFileName = ({ name }: File): string =>
  name.replace(FILENAME_DENSITY_EXT_REGEX, '');

/**
 * Converts string into blob for downloading.
 */
export const downloadStringAsFile = (str: string, fileName: string) => {
  const blob = new Blob([str], { type: 'text/json;charset=utf-8;' });
  downloadBlobAsFile(blob, fileName);
};

export const downloadJsonAsFile = (obj: any, fileName: string) => {
  const json = JSON.stringify(obj, null, 2);
  downloadStringAsFile(json, fileName);
};

export const downloadBlobAsFile = (blob: Blob, fileName: string) => {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const isBlobUrl = (url: string) => url.startsWith(BLOB_SCHEMA);

export const getBlobFromBlobUrl = async (url: string): Promise<Blob> => {
  const response = await fetch(url);
  const blob = await response.blob();

  return blob;
};

/**
 * Create a Blob with mimeType "application/json"
 *
 * If a string is passed in, it should be stringified JSON, otherwise if it is object or array,
 * it will be stringifed and inserted into the Blob
 */
export const createJsonBlob = (json: Record<string, any> | any[] | string): Blob => {
  const jsonString = isString(json) ? json : JSON.stringify(json);
  return new Blob([jsonString], { type: cd.FileMime.JSON });
};

/**
 * Create a File with mimeType "application/json"
 */
export const createJsonFile = (
  json: Record<string, any> | any[] | string,
  fileName: string
): File => {
  const blob = createJsonBlob(json);
  return fileFromBlob(blob, fileName);
};
