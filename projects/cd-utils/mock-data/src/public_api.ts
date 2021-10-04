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

export enum MockTextType {
  Word,
  Title,
  Phrase,
  Sentence,
  Sentences,
  Paragraph,
}

// prettier-ignore
const MOCK_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing',
  'elit', 'curabitur', 'vel', 'hendrerit', 'libero', 'eleifend', 'blandit',
  'nunc', 'ornare', 'odio', 'ut', 'orci', 'gravida', 'imperdiet', 'nullam',
  'purus', 'lacinia', 'a', 'pretium', 'quis', 'congue', 'praesent',
  'sagittis', 'laoreet', 'auctor', 'mauris', 'non', 'velit', 'eros',
  'dictum', 'proin', 'accumsan', 'sapien', 'nec', 'massa', 'volutpat',
  'venenatis', 'sed', 'eu', 'molestie', 'lacus', 'quisque', 'porttitor',
  'ligula', 'dui', 'mollis', 'tempus', 'at', 'magna', 'vestibulum',
  'turpis', 'ac', 'diam', 'tincidunt', 'id', 'condimentum', 'enim',
  'neque', 'fusce', 'augue', 'leo', 'eget', 'semper', 'mattis', 'tortor',
  'scelerisque', 'nulla', 'interdum', 'tellus', 'malesuada', 'rhoncus',
  'porta', 'sem', 'aliquet', 'et', 'nam', 'suspendisse', 'potenti',
  'vivamus', 'luctus', 'fringilla', 'erat', 'donec', 'justo', 'vehicula',
  'ultricies', 'varius', 'ante', 'primis', 'faucibus', 'ultrices',
  'dapibus', 'nisl', 'feugiat', 'egestas', 'class', 'aptent', 'taciti',
  'sociosqu', 'ad', 'litora', 'torquent', 'per', 'conubia', 'nostra',
  'inceptos', 'himenaeos', 'phasellus', 'nibh', 'pulvinar', 'vitae',
  'urna', 'iaculis', 'lobortis', 'nisi', 'viverra', 'arcu', 'morbi',
  'sollicitudin', 'integer', 'rutrum', 'duis', 'est', 'etiam',
  'bibendum', 'donec', 'pharetra', 'vulputate', 'maecenas', 'mi',
  'fermentum', 'consequat', 'suscipit', 'aliquam', 'habitant',
  'senectus', 'netus', 'fames', 'quisque', 'euismod', 'curabitur',
  'lectus', 'elementum', 'tempor', 'risus', 'cras',
];

const MOCK_TEXT_RANGE = [
  [1, 1], // Word
  [3, 5], // Title
  [5, 9], // Phrase
  [10, 15], // Sentence
  [25, 45], // Sentences
  [45, 65], // Paragraph
];

// Defines how punctuation is added to sentences and paragraphs
const PUNC_MIN = 5;
const PUNC_MAX = 10;

/**
 * Creates "lorem ipsum" mock text.
 */
export const createMockText = (mockType?: MockTextType): string => {
  // Default to sentence
  mockType = mockType ?? MockTextType.Sentence;

  // Min/max range of the text
  const [min, max] = MOCK_TEXT_RANGE[mockType];

  // Create a random count of words between the range
  const wordCount = getRandomInt(min, max);

  // The array of random words
  const text: string[] = new Array(wordCount).fill('');

  // Use punctuation for sentences and paragraphs
  const insertPunc = mockType >= MockTextType.Sentences;
  let puncIndex: number = insertPunc ? getRandomInt(PUNC_MIN, PUNC_MAX) : 0;

  // Build a complete string with possible casing and punctuation
  return text
    .map((_, i: number) => {
      let word = MOCK_WORDS[getRandomInt(0, MOCK_WORDS.length - 1)];
      const newSentence = insertPunc && i === puncIndex && wordCount - 1 - puncIndex > PUNC_MIN;

      // Capitalize if first word, is of type title, or a new sentence
      if (i === 0 || mockType === MockTextType.Title || newSentence) {
        word = toTitleCase(word);
      }

      if (i !== 0) {
        // Insert period if starting a new sentence
        if (newSentence) {
          word = '. ' + word;
          puncIndex += getRandomInt(PUNC_MIN, PUNC_MAX);
        }

        // Space between words
        else {
          word = ' ' + word;
        }
      }

      // Add final period for sentences/paragraphs
      if (mockType && mockType >= MockTextType.Sentence && i === wordCount - 1) {
        word += '. ';
      }

      return word;
    })
    .join('');
};

const getRandomInt = (min: number, max: number): number => {
  return Math.floor(max - Math.random() * (max - min));
};

const toTitleCase = (str: string): string => {
  return str[0].toUpperCase() + str.slice(1);
};
