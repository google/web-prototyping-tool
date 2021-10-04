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

import type { IFontFamily, IStringMap, IDesignSystem } from 'cd-interfaces';
import { FontManager } from 'cd-utils/stylesheet';
import { FontKind } from 'cd-metadata/fonts';

const FONT_URL = 'https://fonts.googleapis.com';
const PREVIEW_TEXT = '+,.AIMSTWabcdefghijklmnopqrstuvwy';
const PREVIEW_NAMESPACE = ':PREV';
const fontCache = new Map<string, string>();
/**
 * Load fonts from fonts.google.com and cache results
 * TODO implement service worker for offline cache
 * @param family
 * @param variants
 * @param text
 * @param preview
 * @param doc
 */
export const loadFont = (
  family: string,
  variants: string[],
  text: string = '',
  preview = false,
  doc?: HTMLDocument
): Promise<void> => {
  const keySuffix = preview ? PREVIEW_NAMESPACE : '';
  const key = `${family}${keySuffix}`;
  const fontManager = FontManager.instance(doc);

  if (fontManager.hasRule(key)) {
    // Font rule is already applied, ignore query
    return Promise.resolve();
  }

  const variantStr = variants.toString();
  const familyStr = `family=${family}${variantStr ? `:${variantStr}` : ''}`;
  const textStr = text ? `text=${text}` : '';
  const subsetStr = 'subset=latin';
  const queryString = [familyStr, subsetStr, textStr].filter((item) => !!item).join('&');
  const url = encodeURI(`${FONT_URL}/css?${queryString}`);
  const cachedResult = fontCache.get(url);
  if (cachedResult) {
    // Font data has already been fetched
    fontManager.addRule(cachedResult, key);
    return Promise.resolve();
  }
  return fetch(url)
    .then((result) => result.text())
    .then((result) => {
      fontCache.set(url, result);
      fontManager.addRule(result, key);
    });
};

export function loadFontPreview({ family, variants }: IFontFamily): Promise<void> {
  const [first] = variants;
  return loadFont(family, [first], PREVIEW_TEXT, true);
}

/**
 * Load fonts but ignore system fonts
 * @param fonts
 */
const filterSystemFonts = (fonts: IStringMap<IFontFamily>): IFontFamily[] => {
  const systemFont = FontKind.System.toLocaleLowerCase();
  return Object.values(fonts).filter(({ kind = FontKind.Default }) => {
    return kind.toLocaleLowerCase() !== systemFont;
  });
};

export const loadFontFamilies = (fonts?: IStringMap<IFontFamily>, doc?: HTMLDocument) => {
  if (!fonts) return;
  const list = filterSystemFonts(fonts);
  return Promise.all(list.map((font) => loadFont(font.family, font.variants, '', false, doc)));
};

/** Constructs a url for loading google fonts */
export const fontURLFromDesignSystem = (ds: IDesignSystem): string => {
  const fonts = Object.values(ds.fonts).filter((font) => {
    return font.kind !== FontKind.System;
  });
  const fontParams = fonts
    .reduce<string[]>((acc, font) => {
      const name = font.family.split(' ').join('+');
      const variants = font.variants.length ? ':' + font.variants.join() : '';
      acc.push(name + variants);
      return acc;
    }, [])
    .join('|');

  return `${FONT_URL}/css?family=${fontParams}&display=swap`;
};
