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
const mode = process.env.NODE_ENV || 'development';
const TerserPlugin = require('terser-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: path.resolve(__dirname + '/src/index.ts'),
  target: 'node',
  externals: [nodeExternals()],
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
      'cd-interfaces': path.resolve(__dirname, '../../dist/cd-interfaces'),
      'cd-utils': path.resolve(__dirname, '../../dist/cd-utils'),
      'cd-metadata': path.resolve(__dirname, '../../dist/cd-metadata'),
      'cd-common/consts': path.resolve(__dirname, '../../dist/cd-common/consts'),
      'cd-common/utils': path.resolve(__dirname, '../../dist/cd-common/utils'),
      'cd-common/pipes': path.resolve(__dirname, '../../dist/cd-common/pipes'),
      'cd-common/directives': path.resolve(__dirname, '../../dist/cd-common/directives'),
      'cd-common/services': path.resolve(__dirname, '../../dist/cd-common/services'),
      'cd-common/datasets': path.resolve(__dirname, '../../dist/cd-common/datasets'),
    },
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: path.resolve(__dirname + '/app.yaml') },
        { from: path.resolve(__dirname + '/package.json') },
        { from: path.resolve(__dirname + '/.gcloudignore') },
      ],
    }),
  ],
  output: {
    filename: 'screenshot-service.js',
    path: path.resolve(__dirname, '../../dist/'),
  },
};
