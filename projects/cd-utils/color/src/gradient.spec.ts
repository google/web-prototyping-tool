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

import { parseGradient } from './gradient';

describe('GradientUtils', () => {
  it('didGradientsParse', () => {
    const linearGradient = parseGradient(
      'linear-gradient(90deg, rgba(131,58,180,1) 0%, rgba(253,29,29,1) 48%, rgba(252,176,69,1) 100%)'
    );

    expect(linearGradient.mode).toEqual('linear-gradient');
    expect(linearGradient.angle).toEqual(90);
    expect(linearGradient.stops.length).toEqual(3);
    expect(linearGradient.stops).toEqual([
      { color: 'rgba(131,58,180,1)', stop: 0 },
      { color: 'rgba(253,29,29,1)', stop: 48 },
      { color: 'rgba(252,176,69,1)', stop: 100 },
    ]);

    const conicGradient = parseGradient(
      'conic-gradient(from 20deg, rgb(131,58,180) 0%, rgba(252,176,69,1) 100%)'
    );

    expect(conicGradient.mode).toEqual('conic-gradient');
    expect(conicGradient.stops.length).toEqual(2);
    expect(conicGradient.angle).toEqual(20);
    expect(conicGradient.stops).toEqual([
      { color: 'rgb(131,58,180)', stop: 0 },
      { color: 'rgba(252,176,69,1)', stop: 100 },
    ]);

    const radialGradient = parseGradient('radial-gradient(#fff 0%, red 48%, #fff 100%)');
    expect(radialGradient.stops.length).toEqual(3);
    expect(radialGradient.stops).toEqual([
      { color: '#fff', stop: 0 },
      { color: 'red', stop: 48 },
      { color: '#fff', stop: 100 },
    ]);
  });
});
