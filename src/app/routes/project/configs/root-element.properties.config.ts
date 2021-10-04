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

import { SelectItemType, ISelectItem } from 'cd-interfaces';
import { AUTO_VALUE } from 'cd-common/consts';

const boardSizes = {
  LaptopMdpi: {
    id: 'laptop-mdpi',
    title: 'MDPI Laptop',
    icon: 'laptop_mac',
    width: 1280,
    height: 800,
  },
  LaptopHidpi: {
    id: 'laptop-hdpi',
    title: 'HDPI Laptop',
    icon: 'laptop_mac',
    width: 1440,
    height: 900,
  },
  Pixel3Xl: {
    id: 'pixel-3-xl',
    title: 'Pixel 3 XL',
    icon: 'phone_android',
    width: 360,
    height: 740,
  },
  Pixel3: {
    id: 'pixel-3',
    title: 'Pixel 3',
    icon: 'phone_android',
    width: 360,
    height: 720,
  },
  Pixel2: {
    id: 'pixel-2',
    title: 'Pixel 2',
    icon: 'phone_android',
    width: 412,
    height: 732,
  },
  IPhone8Plus: {
    id: 'iphone-8-plus',
    icon: 'phone_iphone',
    title: 'iPhone 6/7/8 Plus',
    width: 414,
    height: 736,
  },
  IPhone8: {
    id: 'iphone-8',
    icon: 'phone_iphone',
    title: 'iPhone 6/7/8',
    width: 375,
    height: 667,
  },
  IPhoneX: {
    id: 'iphone-x',
    title: 'iPhone X',
    icon: 'smartphone',
    width: 375,
    height: 812,
  },
  IPhoneXMax: {
    id: 'iphone-x-max',
    title: 'iPhone X Max',
    icon: 'smartphone',
    width: 414,
    height: 896,
  },
  IPad: {
    id: 'ipad',
    title: 'iPad 9.7"',
    icon: 'tablet_mac',
    width: 768,
    height: 1024,
  },
  IPadPro: {
    id: 'ipad-pro',
    title: 'iPad Pro 11"',
    icon: 'tablet_mac',
    width: 834,
    height: 1194,
  },
};

export const sizeConfig = [
  boardSizes.LaptopHidpi,
  boardSizes.LaptopMdpi,
  boardSizes.IPadPro,
  boardSizes.IPad,
  boardSizes.Pixel3Xl,
  boardSizes.Pixel3,
  boardSizes.Pixel2,
  boardSizes.IPhoneXMax,
  boardSizes.IPhoneX,
  boardSizes.IPhone8Plus,
  boardSizes.IPhone8,
];

export const bkdSizeConfig: ISelectItem[] = [
  {
    title: 'Tile',
    value: AUTO_VALUE,
    type: SelectItemType.Empty,
    divider: true,
  },
  {
    title: 'Cover',
    value: 'cover',
  },
  {
    title: 'Contain',
    value: 'contain',
  },
];
