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

const elasticlunr = require('elasticlunr');
const emojiRegex = require('emoji-regex/RGI_Emoji.js');
const EMOJI_REGEX = /([#0-9]\u20E3)|[\xA9\xAE\u203C\u2047-\u2049\u2122\u2139\u3030\u303D\u3297\u3299][\uFE00-\uFEFF]?|[\u2190-\u21FF][\uFE00-\uFEFF]?|[\u2300-\u23FF][\uFE00-\uFEFF]?|[\u2460-\u24FF][\uFE00-\uFEFF]?|[\u25A0-\u25FF][\uFE00-\uFEFF]?|[\u2600-\u27BF][\uFE00-\uFEFF]?|[\u2900-\u297F][\uFE00-\uFEFF]?|[\u2B00-\u2BF0][\uFE00-\uFEFF]?|(?:\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDEFF])[\uFE00-\uFEFF]?/g;
const MEANINGLESS_REGEX = /\b(\.|\,|\<;|the|a|an|and|am|who|what|attribute|that|selected|how|right|left|table|src|any|components|textalign|description|by|ico|within|will|textalign|style|you|I|to|if|of|off|me|my|on|in|it|is|at|as|we|do|be|has|but|was|so|no|not|or|up|for|utilizes|web|are|currently|supports|powerful|used|behavior|code|href|strong|span|div|li|thead|noreferrer|tbody|videoplayer|img|https|project|tips|prototype|function)\b/gi;
const NEW_LINES_PUNCT_REGEX = /\.|\,|\?|<p>|-|—|\n/g;
const HTML_AND_NEWLINES_REGEX = /(.*?&lt;.*?&gt;)/gi;
const REPEAT_SPACES_REGEX = /[ ]{2,}/g;

module.exports = function (collection) {
  // what fields we'd like our index to consist of
  const index = elasticlunr(function () {
    this.addField('title');
    this.addField('content');
    this.setRef('id');
  });

  // loop through each page and add it to the index
  collection.forEach((page) => {
    index.addDoc({
      id: page.url,
      title: page.template.frontMatter.data.title,
      content: squash(page.templateContent),
    });
  });

  function squash(text) {
    const regex = emojiRegex();
    const content = new String(text).toLowerCase();
    const plain = unescape(content.replace(HTML_AND_NEWLINES_REGEX, ''));
    const words = plain.split(' ');
    const deduped = [...new Set(words)];
    const dedupedStr = deduped.join(' ');
    let result = dedupedStr
      .replace(MEANINGLESS_REGEX, '')
      .replace(NEW_LINES_PUNCT_REGEX, '')
      .replace(REPEAT_SPACES_REGEX, ' ')
      .replace(EMOJI_REGEX, '');

    let match;
    while ((match = regex.exec(result))) {
      const emoji = match[0];
      result = result.replace(emoji, ' ');
    }

    return result;
  }

  return index.toJSON();
};
