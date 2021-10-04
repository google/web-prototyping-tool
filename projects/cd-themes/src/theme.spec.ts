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

import { Theme, TextType, ColorType, themeFromId } from './public_api';

describe('Themes', () => {
  const themeCheck = (themeId: Theme) => {
    const { id, name, theme } = themeFromId[themeId]();
    expect(theme).toBeDefined();
    expect(id).toBeDefined();
    expect(name).toBeDefined();
    expect(theme.themeId).toEqual(id);
    expect(theme.colors[ColorType.Primary]).toBeDefined();
    expect(theme.colors[ColorType.Secondary]).toBeDefined();
    expect(theme.colors[ColorType.Text]).toBeDefined();
    expect(theme.colors[ColorType.TextDark]).toBeDefined();
    expect(theme.colors[ColorType.TextLight]).toBeDefined();
    expect(theme.colors[ColorType.Surface]).toBeDefined();
    expect(theme.colors[ColorType.Success]).toBeDefined();
    expect(theme.colors[ColorType.Warning]).toBeDefined();
    expect(theme.colors[ColorType.ElevatedSurface]).toBeDefined();
    expect(theme.colors[ColorType.BackgroundBase]).toBeDefined();
    expect(theme.colors[ColorType.Border]).toBeDefined();
    expect(theme.typography[TextType.IconFontFamily]).toBeDefined();
    expect(theme.typography[TextType.Headline1]).toBeDefined();
    expect(theme.typography[TextType.Headline2]).toBeDefined();
    expect(theme.typography[TextType.Headline3]).toBeDefined();
    expect(theme.typography[TextType.Headline4]).toBeDefined();
    expect(theme.typography[TextType.Headline5]).toBeDefined();
    expect(theme.typography[TextType.Headline6]).toBeDefined();
    expect(theme.typography[TextType.Overline]).toBeDefined();
    expect(theme.typography[TextType.Subtitle1]).toBeDefined();
    expect(theme.typography[TextType.Subtitle2]).toBeDefined();
    expect(theme.typography[TextType.Caption]).toBeDefined();
    expect(theme.typography[TextType.Button]).toBeDefined();
    expect(theme.typography[TextType.Body1]).toBeDefined();
    expect(theme.typography[TextType.Body2]).toBeDefined();
  };

  it('Angular Material', () => themeCheck(Theme.AngularMaterial));
  it('Angular Material Dark', () => themeCheck(Theme.AngularMaterialDark));
  it('Google Material', () => themeCheck(Theme.GoogleMaterial));
  it('Fortnightly', () => themeCheck(Theme.Fortnightly));
  it('Crane', () => themeCheck(Theme.Crane));
  it('Baseline', () => themeCheck(Theme.Baseline));
  it('Baseline Dark', () => themeCheck(Theme.BaselineDark));
  it('Cloud Platform', () => themeCheck(Theme.));
});
