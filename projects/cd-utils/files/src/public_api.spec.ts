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

import * as filesUtils from './public_api';

describe('FilesUtils', () => {
  describe('getImageFileDensity', () => {
    const fakeFile = (name: string) => ({ name } as File);

    const getImageFileDensity = filesUtils.getImageFileDensity;

    it('Should return density info in filename', () => {
      const file1 = fakeFile('test@1.5x.jpg');
      const density1 = getImageFileDensity(file1);
      expect(density1).toEqual(1.5);

      const file2 = fakeFile('test@2x.jpg');
      const density2 = getImageFileDensity(file2);
      expect(density2).toEqual(2);

      const file3 = fakeFile('test.image@4x.jpeg');
      const density3 = getImageFileDensity(file3);
      expect(density3).toEqual(4);
    });

    it('Should return 1 if density info not present in filename', () => {
      const file1 = fakeFile('test.jpg');
      const density1 = getImageFileDensity(file1);
      expect(density1).toEqual(1);

      const file2 = fakeFile('test.image.jpg');
      const density2 = getImageFileDensity(file2);
      expect(density2).toEqual(1);

      const file3 = fakeFile('test.image');
      const density3 = getImageFileDensity(file3);
      expect(density3).toEqual(1);
    });

    it('Should return 1 if density info in filename is malformed', () => {
      const file1 = fakeFile('test@.jpg');
      const density1 = getImageFileDensity(file1);
      expect(density1).toEqual(1);

      const file2 = fakeFile('test.image@ex.jpg');
      const density2 = getImageFileDensity(file2);
      expect(density2).toEqual(1);

      const file3 = fakeFile('test.image@2ex.jpg');
      const density3 = getImageFileDensity(file3);
      expect(density3).toEqual(1);
    });
  });
});
