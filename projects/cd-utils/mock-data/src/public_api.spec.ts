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

import { createMockText, MockTextType } from './public_api';

const MOCK_TEXT_RANGE = [
  [1, 1], // Word
  [2, 4], // Title
  [4, 8], // Phrase
  [10, 15], // Sentence
  [25, 45], // Sentences
  [45, 65], // Paragraph
];

describe('MockDataUtils', () => {
  describe('createMockText', () => {
    it('Should create a word', () => {
      const text = createMockText(MockTextType.Word);
      expect(text).not.toContain(' ');
      expect(text).not.toContain('.');
      expectRange(text, MockTextType.Word);
      expectStartsWithCapital(text);
    });

    it('Should create a phrase', () => {
      const text = createMockText(MockTextType.Phrase);
      expect(text).toContain(' ');
      expect(text).not.toContain('.');
      expectRange(text, MockTextType.Phrase);
      expectStartsWithCapital(text);
    });

    it('Should create a title', () => {
      const text = createMockText(MockTextType.Title);
      expect(text).toContain(' ');
      expect(text).not.toContain('.');
      text.split(' ').forEach((word) => {
        expectStartsWithCapital(word);
      });
      expectRange(text, MockTextType.Title);
    });

    it('Should create a sentence', () => {
      const text = createMockText(MockTextType.Sentence);
      expect(text).toContain(' ');
      expect(text).toContain('.');
      expect(text.trim().endsWith('.')).toBe(true);
      text.split(' ').forEach((word) => {
        expectStartsWithCapital(word);
      });
      expectRange(text, MockTextType.Sentence);
    });

    it('Should create multiple sentences', () => {
      const text = createMockText(MockTextType.Sentences);
      expect(text).toContain(' ');
      expect(text).toContain('.');
      expect(text.trim().endsWith('.')).toBe(true);
      text.split(' ').forEach((word) => {
        expectStartsWithCapital(word);
      });
      expectRange(text, MockTextType.Sentences);
    });

    it('Should create a paragraph', () => {
      const text = createMockText(MockTextType.Paragraph);
      expect(text).toContain(' ');
      expect(text).toContain('.');
      expect(text.trim().endsWith('.')).toBe(true);
      text.split(' ').forEach((word) => {
        expectStartsWithCapital(word);
      });
      expectRange(text, MockTextType.Paragraph);
    });
  });
});

function expectRange(str: string, type: MockTextType) {
  const len = str.split(' ').length;
  const [min, max] = MOCK_TEXT_RANGE[type];
  expect(len).toBeGreaterThanOrEqual(min);
  expect(len).toBeLessThanOrEqual(max);
}

function expectStartsWithCapital(str: string) {
  expect(str[0] === str[0]).toBe(true);
}
