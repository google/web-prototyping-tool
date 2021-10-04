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

import { IStringMap } from 'cd-interfaces';

// Match opening/closing style tags
const STYLE_TAG_REGEX = /<style>|<\/style></g;

// Match contents of CSS rule:  `selector { content }`
const RULE_CONTENT_REGEX = /{([^}]+)}/;

interface IConstructableStyleSheet extends CSSStyleSheet {
  replaceSync(text: string): void;
}

/**
 * Parses CSS text into a map using constructed style sheets.  The parser is
 * relatively forgiving, by parsing full and partial CSS syntax, as well as
 * <style> tags. It ignores any selectors though, and only returns style rules.
 */
export const parseCss = (cssText: string): IStringMap<string> => {
  // Text might have copied <style> tags
  cssText = cssText.replace(STYLE_TAG_REGEX, '');

  const sheet = new CSSStyleSheet() as IConstructableStyleSheet;

  // Text might be valid CSS, including selectors and curly braces
  sheet.replaceSync(cssText);
  const styles = convertStyleSheetRulesToStyleMap(sheet as CSSStyleSheet);

  // Text might be partial CSS, only name and values
  const wrappedCss = `* { ${cssText} }`;
  sheet.replaceSync(wrappedCss);
  const partialStyles = convertStyleSheetRulesToStyleMap(sheet as CSSStyleSheet);

  return { ...styles, ...partialStyles };
};

/** Use constructed stylesheet to collect all found values. */
const convertStyleSheetRulesToStyleMap = (sheet: CSSStyleSheet): IStringMap<string> => {
  const rules = Array.from(sheet.cssRules) as CSSStyleRule[];

  return rules.reduce<IStringMap<string>>((styles, rule) => {
    // Retrieve parsed styles for rule using `cssText` since some complex properties,
    // such as background and padding, are automatically separated. For example,
    // `padding: 0` would add padding-[left,right,top,bottom] to the style map.
    const matches = RULE_CONTENT_REGEX.exec(rule.cssText);
    if (matches && matches.length) {
      // Parse `name: value; name2: value2`
      matches[1].split(';').forEach((nameValue: string) => {
        nameValue = nameValue.trim();
        if (nameValue) {
          const [name, value] = nameValue.split(':');
          styles[name.trim()] = value.trim();
        }
      });
    }

    return styles;
  }, {});
};
