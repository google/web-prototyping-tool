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

import chalk from 'chalk';
import program from 'commander';
import fs from 'fs';

import * as consts from './consts';
import * as inventory from './inventory';
import * as utils from './utils';
import * as cd from 'cd-interfaces';

const SOURCE_DIRECTORY = '../../src/assets/assets-gallery/cloud-product-icons-database';
const NON_HEXAGON_REGEX = /non-hexagon/;

// Source directory has a weird naming convention.
// These get converted to Cloud nomenclature:
// ProductIcon
// SystemIcon
export enum SourceAssetCategory {
  Icon = 'non-hexagon',
}

program
  .version('0.0.1')
  .description('A cli to generate Cloud assets')
  .option('-o, --output <path>', `output directory. defaults to ${consts.DEFAULT_OUTPUT_DIRECTORY}`)
  .option('-d, --assetDir <path>', `working assets directory. defaults to ${SOURCE_DIRECTORY}`);

program
  .command('generate')
  .description('Generate Cloud assets inventory')
  .option(
    '-c, --config <path>',
    'set config path. defaults to importing all files from assets directory'
  )
  .option('--no-optimize', "don't optimize")
  .action(async (cmd) => {
    console.log(chalk.white('1. Started processing Cloud Assets'));

    const { imageDir = SOURCE_DIRECTORY, output = consts.DEFAULT_OUTPUT_DIRECTORY } = program;
    const imageFiles = utils.walkDir(imageDir);

    await utils.exec(`rm -rf ${consts.DEFAULT_OUTPUT_DIRECTORY}/*`);

    await Promise.all(
      imageFiles.map(async (file: any) => {
        const imgOutputDir = output + file.replace(imageDir, '');
        const imgOutputDirNormalized = imgOutputDir
          .replace(consts.GLOBAL_SPACE_REGEX, consts.DASH_CHARACTER)
          .replace(consts.GLOBARL_UNDERSCORE_REGEX, consts.DASH_CHARACTER)
          .toLowerCase();

        // Source directory lists product icons as 'non-hexagon' icons
        const imgOutputDirNameReplaced = imgOutputDirNormalized.replace(
          NON_HEXAGON_REGEX,
          cd.AssetCategory.ProductIcon
        );

        try {
          await utils.copyFile(file, imgOutputDirNameReplaced);
        } catch (error) {
          console.error(error);
        }

        return;
      })
    );

    console.log(chalk.white('2. Copying Files'));

    const copiedFiles = utils.walkDir(consts.DEFAULT_OUTPUT_DIRECTORY);
    await inventory.generateInventory(copiedFiles);

    const manifest = await inventory.generateJson(consts.DEFAULT_OUTPUT_DIRECTORY);
    const manifestJson = JSON.stringify(manifest);
    await utils.writeFile(`${consts.DEFAULT_OUTPUT_DIRECTORY}/cloud-assets.json`, manifestJson);

    console.log(chalk.white(`3. Finished processing Drive Cloud Assets`));

    console.log(chalk.white('4. Started processing Assets from config'));

    if (cmd.config) {
      const config = cmd.config;
      await inventory.processAssetCatalog(config);
    }

    console.log(chalk.white('5. Generating Manifest'));
    console.log(
      chalk.white(`Manifest saved to ${consts.DEFAULT_OUTPUT_DIRECTORY}/cloud-assets.json`)
    );

    console.log(chalk.white('6. Checking for duplicates'));

    const combinedAssetManifest = JSON.parse(fs.readFileSync(consts.ASSETS_MANIFEST, consts.UTF8));
    const dups = inventory.detectDuplicateAssets(combinedAssetManifest);

    if (dups.length > 0) console.log(`Duplicates: ${dups}`);
  });

program.parse(process.argv);
