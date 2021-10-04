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

import { Pipe, PipeTransform } from '@angular/core';
import { isMaterialIcon } from 'cd-common/utils';
import { IDesignSystem, SelectedIcon } from 'cd-interfaces';
import { IconStyle, ICON_FONT_FAMILY_CLASS_MAP, ICON_STYLE_CLASSES } from 'cd-themes';
import { toSentenceCase } from 'cd-utils/string';
@Pipe({ name: 'iconNameFormatPipe' })
export class IconNameFormatPipe implements PipeTransform {
  transform(value: SelectedIcon): any {
    const name = isMaterialIcon(value) ? value : value.name;
    return toSentenceCase(name);
  }
}

@Pipe({ name: 'matIconClassNamePipe' })
export class MatIconClassNamePipe implements PipeTransform {
  transform(ds: IDesignSystem | undefined): any {
    const iconFontFamily = ds?.icons.family;
    return iconFontFamily
      ? ICON_FONT_FAMILY_CLASS_MAP[iconFontFamily]
      : ICON_STYLE_CLASSES[IconStyle.MATERIAL_ICONS_FILLED];
  }
}
