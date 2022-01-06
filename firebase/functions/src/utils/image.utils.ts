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

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { optimize } from 'svgo';
import { spawn } from 'child-process-promise';
import { ObjectMetadata } from 'firebase-functions/lib/providers/storage';
import { Bucket } from '@google-cloud/storage';
import * as cd from 'cd-interfaces';
import * as im from '../consts/image-magick.consts';

import { uploadFile, getDownloadUrl } from './storage.utils';

export const batchUpload = (
  targets: cd.IImageConversionTarget[],
  bucket: Bucket,
  metadata: cd.IStringMap<any>,
  cacheControl?: string
) => Promise.all(targets.map((target) => upload(bucket, target, metadata, cacheControl)));

export const upload = async (
  bucket: Bucket,
  target: cd.IImageConversionTarget,
  metadata: cd.IStringMap<any>, // FireStorage-level metadata
  cacheControl?: string // Google Cloud Storage-level metadata
  // TODO: Eventually, if we need to provide more GCS-level metadata keys/values,
  // then we can convert those to a dict, but we need to name the params carefully.
) => {
  const { local, remote } = target.destPaths;
  // "metadata" key is nested and appears in two levels, see example code of https://cloud.google.com/nodejs/docs/reference/storage/2.3.x/Bucket#upload
  return uploadFile(bucket, local, remote, { metadata, cacheControl });
};

export const generateThumbnailArgs = (
  { width: originalWidth, height: originalHeight }: cd.IImageDimension,
  maxWidth: number,
  aspectRatio: number,
  scale = 1
): string[] => {
  const scaledMaxWidth = maxWidth * scale;
  const scaledMaxHeight = maxWidth / aspectRatio;
  const { IMAGEMAGICK_DO_NOT_ENLARGE, IMAGEMAGICK_THUMBNAIL } = im;
  const ratio =
    originalWidth / originalHeight >= aspectRatio
      ? `${scaledMaxWidth}${IMAGEMAGICK_DO_NOT_ENLARGE}`
      : `x${scaledMaxHeight}${IMAGEMAGICK_DO_NOT_ENLARGE}`;

  return [IMAGEMAGICK_THUMBNAIL, ratio];
};

export const generateCropArgs = (width: number, aspectRatio: number, scale = 1): string[] => {
  const height = width / aspectRatio;
  const scaledWidth = width * scale;
  const scaledHeight = height * scale;
  const geometry = `${scaledWidth}x${scaledHeight}`;
  const min = `${geometry}${im.IMAGEMAGICK_ENSURE_MIN}`;
  const offset = `${geometry}+0+0`;
  const geo = im.IMAGEMAGICK_GEOMETRY;
  const crop = im.IMAGEMAGICK_CENTER_CROP;
  const thumb = im.IMAGEMAGICK_THUMBNAIL;
  return [geo, min, ...crop, offset, thumb, geometry];
};

export const convertSVG = (
  srcLocalPath: string,
  targets: cd.IImageConversionTarget[]
): Promise<void> => {
  const svg = fs.readFileSync(srcLocalPath, 'utf8');
  const optimizedSVG = optimize(svg);
  for (const target of targets) {
    fs.writeFileSync(target.destPaths.local, optimizedSVG.data);
  }
  return Promise.resolve();
};

export const getSourcePaths = (object: ObjectMetadata): cd.IPaths => {
  const remotePath = object.name as string;
  const basename = path.basename(remotePath);
  const localPath = path.join(os.tmpdir(), basename);

  return { local: localPath, remote: remotePath };
};

export const generateDestPaths = (srcRemotePath: string, name: string): cd.IPaths => {
  const remoteDirname = path.dirname(srcRemotePath);
  const filenameExt = path.extname(srcRemotePath);
  const destBasename = `${name}${filenameExt}`;
  const remotePath = path.join(remoteDirname, destBasename);
  const localPath = path.join(os.tmpdir(), destBasename);
  return { local: localPath, remote: remotePath };
};

export const getTargetDownloadUrls = async (
  bucket: Bucket,
  targets: cd.IImageConversionTarget[]
): Promise<cd.IStringMap<string>> => {
  const urls: cd.IStringMap<string> = {};

  for (const target of targets) {
    const { destPaths, name } = target;
    const { remote: destRemotePath } = destPaths;
    urls[name] = await getDownloadUrl(bucket, destRemotePath);
  }

  return urls;
};

const flattenArray = <T>(array: T[][]): T[] => {
  return array.reduce((prev, curr) => [...prev, ...curr], [] as T[]);
};

// The trick in performant ImageMagick conversion is to let it read the source
// file only once, and output multiple target files from memory. i.e., we only
// invoke ImageMagick only once.
// To do this, we want to bring up an image stack;
// see https://imagemagick.org/script/command-line-processing.php#stack.
// Here the syntax is a little bit different from the doc, in that we put all
// conversion operations in the stack, and disable the normal, non-stack output
// by assigning "null:" as the output's file reference. This allows the args
// to be symmetrical & easier to read.
// Instead of:
//     convert source.jpg ( +clone -thumbnail 200w -write 200.jpg +delete ) ( +clone -thumbnail 300w -write 300.jpg +delete ) -thumbnail 400w 400.jpg
// We write:
//     convert source.jpg ( +clone -thumbnail 200w -write 200.jpg +delete ) ( +clone -thumbnail 300w -write 300.jpg +delete ) ( +clone -thumbnail 400w -write 400.jpg +delete ) null:
export const convert = async (srcLocalPath: string, targets: cd.IImageConversionTarget[]) => {
  const commandStacks = targets.map(generateConvertCommandStack);
  const stackArgs = flattenArray(commandStacks);
  // Append `[0]` to the local path, so only the 1st frame of animated images is accessed.
  // This syntax also works with non-animated images, so there is no need to check the type.
  const args = [`${srcLocalPath}[0]`, ...stackArgs, im.IMAGEMAGICK_NULL_OUTPUT];
  await spawn(im.IMAGEMAGICK_COMMAND, args);
};

export const generateConvertCommandStack = (target: cd.IImageConversionTarget): string[] => {
  const { convertArgs, destPaths } = target;
  // prettier-ignore
  return [
    ...im.IMAGEMAGICK_STACK_BEGIN,  // ( +clone
    ...convertArgs,                 // -thumbnail '{width}>x{height}>'
    im.IMAGEMAGICK_WRITE,           // -write
    destPaths.local,                // {destination path}
    ...im.IMAGEMAGICK_STACK_END,    // +delete )
  ];
};

export const deleteLocalConvertedFiles = (targets: cd.IImageConversionTarget[]) => {
  for (const target of targets) {
    fs.unlinkSync(target.destPaths.local);
  }
};

export const deleteConversionTargets = async (
  bucket: Bucket,
  srcRemotePath: string
): Promise<void> => {
  const srcRemoteDirname = path.dirname(srcRemotePath);
  const [files] = await bucket.getFiles({ prefix: srcRemoteDirname });
  if (!files) throw new Error('cannot find files to delete');
  for (const file of files) {
    console.log('deleting', file.name);
    await file.delete();
  }
};

export const convertTargets = (
  contentType: string | undefined,
  srcLocalPath: string,
  targets: cd.IImageConversionTarget[]
): Promise<void> => {
  if (contentType === undefined) return Promise.reject('unknown content type');
  return contentType === cd.ImageMime.SVG
    ? convertSVG(srcLocalPath, targets)
    : convert(srcLocalPath, targets);
};
