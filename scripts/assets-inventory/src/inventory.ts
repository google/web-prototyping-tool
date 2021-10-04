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
import chalk from 'chalk';

import * as consts from './consts';
import * as utils from './utils';
import * as cd from 'cd-interfaces';

const DIGITS_REGEX = /\d+/g;

enum ExtName {
  Gif = '.gif',
  Svg = '.svg',
  Png = '.png',
  Jpg = '.jpg',
  Jpeg = '.jpeg',
}

const copyAssetFromConfig = async (item: Partial<cd.IAssetsImporterItem>, srcDir: string) => {
  if (!item.variants) return;

  const { category, name, variants } = item;
  const variantValues = Object.values(item.variants);

  await Promise.all(
    variantValues.map(async (variant) => {
      if (!variant) return;

      const srcFile = `${srcDir}/${variant}`;
      const outputFile = `${consts.DEFAULT_OUTPUT_DIRECTORY}/${variant}`;

      await utils.copyFile(srcFile, outputFile);
    })
  );

  const nameTag = name?.toLowerCase().replace(consts.GLOBAL_SPACE_REGEX, consts.DASH_CHARACTER);

  return {
    category,
    name,
    dir: consts.OUTPUT_ABS_PATH,
    variants,
    tags: [nameTag],
  };
};

const createListsOfVariationSizes = (files: string[]): string[][] => {
  const multicolorList = [];
  const colorList = [];
  const flatList = [];
  const shadedList = [];
  const blueList = [];

  for (const file of files) {
    const parts: string[] = file.split(consts.DASH_CHARACTER);
    const variation: string = parts[parts.length - 1].split('.')[0];

    switch (variation) {
      case cd.AssetVariant.Multicolor:
        multicolorList.push(file);
        break;
      case cd.AssetVariant.Color:
        colorList.push(file);
        break;
      case cd.AssetVariant.Flat:
        flatList.push(file);
        break;
      case cd.AssetVariant.Shaded:
        shadedList.push(file);
        break;
      case cd.AssetVariant.Blue:
        blueList.push(file);
        break;
    }
  }

  const outerList = [multicolorList, colorList, shadedList, blueList, flatList];

  return outerList;
};

const generateFilesForDir = async (dirName: string) => {
  const files = fs.readdirSync(dirName);

  const svgExists = files.some((file: string) => {
    return path.extname(file) === ExtName.Svg;
  });

  if (!svgExists) {
    console.log(chalk.yellow(`🙄 No SVG found under ${dirName}`));
    return;
  }

  const svgVersions: string[] = await filterSvg(dirName, files);
  const unorderedVariations = createListsOfVariationSizes(svgVersions);
  const variations = sortVariations(unorderedVariations);

  pruneFiles(dirName, variations);

  const newPath = utils.removeDoubleDashes(dirName);
};

const getVariants = (dirFiles: string[]) => {
  return dirFiles.reduce((acc, curr) => {
    const fileNameNoExt = path.basename(curr, path.extname(curr));
    const fileNameNoExtParts = fileNameNoExt.split(consts.DASH_CHARACTER);
    const type = fileNameNoExtParts[fileNameNoExtParts.length - 1];

    acc = {
      ...acc,
      [type]: path.basename(curr),
    };

    return acc;
  }, {});
};

const sortAssetCatalogAlphabetically = (list: Partial<cd.IAssetsImporterItem>[]) => {
  return list
    .slice()
    .sort((a: Partial<cd.IAssetsImporterItem>, b: Partial<cd.IAssetsImporterItem>) => {
      const textA = a.name || '';
      const textB = b.name || '';

      return textA < textB ? -1 : textA > textB ? 1 : 0;
    });
};

const sortVariations = (variationsList: string[][]): string[][] => {
  return variationsList.map((variationList: string[]): string[] => {
    return variationList.sort((a: string, b: string) => {
      const aParts = a.split(consts.DASH_CHARACTER);
      const aSize = utils.parseParts(aParts, aParts);
      const bParts = b.split(consts.DASH_CHARACTER);
      const bSize = utils.parseParts(bParts, aParts);

      if (aSize > bSize) return 1;
      if (aSize < bSize) return -1;
      return 0;
    });
  });
};

const pruneFiles = (dirName: string, variationsLists: string[][]) => {
  for (const list of variationsLists) {
    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      const filePath = utils.buildPath(dirName, file);
      const isBestQuality = list.length === 1 || i !== list.length - 1;

      if (isBestQuality) {
        const newFileName = file.replace(DIGITS_REGEX, '');
        const newFilePath = utils.buildPath(dirName, newFileName);
        const normalizedNewFilePath = utils.removeDoubleDashes(newFilePath);

        try {
          fs.renameSync(filePath, normalizedNewFilePath);
        } catch (error) {
          throw error;
        }
      } else {
        try {
          fs.unlinkSync(filePath);
        } catch (error) {
          throw error;
        }
      }
    }
  }
};

const filterSvg = async (dirName: string, files: string[]) => {
  return files.reduce((acc, curr) => {
    const filePath = utils.buildPath(dirName, curr);
    const isFile = fs.statSync(filePath).isFile();
    const isSvg = path.extname(curr) === ExtName.Svg;

    if (isSvg) {
      acc.push(curr);
    }

    if (!isSvg && isFile) {
      try {
        fs.unlinkSync(filePath);
      } catch (error) {
        throw error;
      }
    }

    return acc;
  }, [] as string[]);
};

export const generateInventory = async (files: string[]) => {
  const listOfDirs = utils.listDirs(files);

  const f = files.reduce((acc, curr) => {
    const dirName = path.dirname(curr);

    if (acc.includes(dirName)) return acc;

    acc.push(dirName);

    return acc;
  }, [] as string[]);

  for (const item of listOfDirs) {
    const dirParts = item.split(consts.FORWARD_SLASH_CHARACTER);
    const childDirName = dirParts[dirParts.length - 1];

    if (childDirName === cd.AssetCategory.ProductIcon) {
      await generateFilesForDir(item);
    }
  }
};

export const generateJson = async (processedDir: string) => {
  const files = utils.walkDir(processedDir);
  const listOfDirs = utils.listDirs(files);
  const manifest: cd.IAssetsImporterItem[] = [];

  for (const directory of listOfDirs) {
    const productDirParts = directory.split(path.sep);
    const productDir = productDirParts[productDirParts.length - 2];
    const assetType = productDirParts[productDirParts.length - 1];

    if (!productDir) continue;

    const name = utils.kebabToTitleCase(productDir);
    const dirFiles = utils.walkDir(directory);
    const dir = utils.buildPath(consts.OUTPUT_ABS_PATH, productDir, assetType);
    const variants = getVariants(dirFiles);

    const item = {
      category: assetType,
      name,
      dir,
      variants,
      tags: [assetType, name.toLowerCase()],
    };

    manifest.push(item);

    continue;
  }

  return manifest;
};

export const processAssetCatalog = async (config: string) => {
  const configArr = utils.readConfig(config);
  const configDir = path.dirname(config);
  const assetManifest: any[] = [];
  const sorted = sortAssetCatalogAlphabetically(configArr);

  for (const item of sorted) {
    const asset = await copyAssetFromConfig(item, configDir);
    assetManifest.push(asset);
  }

  const cloudAssetsFile = utils.readConfig(consts.ASSETS_MANIFEST);
  const fullManifest = [...assetManifest, ...cloudAssetsFile];
  const fullJsonManifest = JSON.stringify(fullManifest);

  await utils.writeFile(`${consts.DEFAULT_OUTPUT_DIRECTORY}/cloud-assets.json`, fullJsonManifest);
};

export const detectDuplicateAssets = (assets: cd.IAssetsImporterItem[]) => {
  const sorted = sortAssetCatalogAlphabetically(assets);

  const dups = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].name === sorted[i + 1].name) {
      console.log(chalk.red('Duplicate detected:'));
      console.log(chalk.yellow(sorted[i].name));
      console.log(sorted[i + 1].name);
      dups.push(sorted[i]);
      dups.push(sorted[i + 1]);
    }
  }

  return dups;
};
