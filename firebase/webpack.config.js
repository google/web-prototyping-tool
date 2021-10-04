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
const nodeExternals = require('webpack-node-externals');
const mode = 'production';
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  entry: path.resolve(__dirname + '/functions/src/index.ts'),
  target: 'node',
  externals: [nodeExternals()],
  stats: {
    warningsFilter: /System.import/,
  },
  mode,
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          output: {
            comments: false,
          },
        },
      }),
    ],
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: 'ts-loader',
        exclude: /node_modules/g,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      'cd-interfaces': path.resolve(__dirname, '../dist/cd-interfaces'),
      'cd-utils': path.resolve(__dirname, '../dist/cd-utils'),
      'cd-utils/array': path.resolve(__dirname, '../dist/cd-utils/array'),
      'cd-utils/class': path.resolve(__dirname, '../dist/cd-utils/class'),
      'cd-utils/clipboard': path.resolve(__dirname, '../dist/cd-utils/clipboard'),
      'cd-utils/color': path.resolve(__dirname, '../dist/cd-utils/color'),
      'cd-utils/content-editable': path.resolve(__dirname, '../dist/cd-utils/content'),
      'cd-utils/css': path.resolve(__dirname, '../dist/cd-utils/css'),
      'cd-utils/dom': path.resolve(__dirname, '../dist/cd-utils/dom'),
      'cd-utils/drag': path.resolve(__dirname, '../dist/cd-utils/drag'),
      'cd-utils/files': path.resolve(__dirname, '../dist/cd-utils/files'),
      'cd-utils/geometry': path.resolve(__dirname, '../dist/cd-utils/geometry'),
      'cd-utils/guid': path.resolve(__dirname, '../dist/cd-utils/guid'),
      'cd-utils/keycodes': path.resolve(__dirname, '../dist/cd-utils/keycodes'),
      'cd-utils/map': path.resolve(__dirname, '../dist/cd-utils/map'),
      'cd-utils/mock-data': path.resolve(__dirname, '../dist/cd-utils/mock'),
      'cd-utils/numeric': path.resolve(__dirname, '../dist/cd-utils/numeric'),
      'cd-utils/object': path.resolve(__dirname, '../dist/cd-utils/object'),
      'cd-utils/selection': path.resolve(__dirname, '../dist/cd-utils/selection'),
      'cd-utils/set': path.resolve(__dirname, '../dist/cd-utils/set'),
      'cd-utils/string': path.resolve(__dirname, '../dist/cd-utils/string'),
      'cd-utils/stylesheet': path.resolve(__dirname, '../dist/cd-utils/stylesheet'),
      'cd-utils/svg': path.resolve(__dirname, '../dist/cd-utils/svg'),
      'cd-utils/url': path.resolve(__dirname, '../dist/cd-utils/url'),
      'cd-metadata': path.resolve(__dirname, '../dist/cd-metadata'),
      'cd-common/consts': path.resolve(__dirname, '../dist/cd-common/consts'),
      'cd-common/utils': path.resolve(__dirname, '../dist/cd-common/utils'),
      'cd-common/models': path.resolve(__dirname, '../dist/cd-common/models'),
      'cd-common/datasets': path.resolve(__dirname, '../dist/cd-common/datasets'),
      'cd-themes': path.resolve(__dirname, '../dist/cd-themes'),
    },
  },
  output: {
    filename: 'index.js',
    libraryTarget: 'this',
    path: path.resolve(__dirname, 'lib'),
  },
};
