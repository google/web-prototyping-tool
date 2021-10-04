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

import { NgModule } from '@angular/core';
import { A11yPipeModule } from './a11y/a11y.pipe.module';
import { AnalyticsParamsPipeModule } from './analytics-params/analytics-params.pipe.module';
import { AvatarPipeModule } from './avatar/avatar-pipe.module';
import { ColorPipeModule } from './color/color.pipe.module';
import { FirebasePipeModule } from './firebase/firebase.module';
import { FontPipeModule } from './fonts/font.pipe.module';
import { FormatFileSizePipeModule } from './file-size/file-size.module';
import { IValuePipeModule } from './ivalue/ivalue.module';
import { MarkSelectedPipeModule } from './mark-selected/mark-selected.module';
import { MenuItemsModule } from './menu-items/menu-items.module';
import { SafeHtmlModule } from './safe-html/safe-html.module';
import { SafeUrlModule } from './safe-url/safe-url.module';
import { StringsPipeModule } from './strings/strings.pipe.module';
import { SvgPipeModule } from './svg/svg.pipe.module';

export * from './color/color.pipe';
export * from './file-size/file-size.pipe';
export * from './firebase/firebase.pipe';
export * from './fonts/font.pipe';
export * from './mark-selected/mark-checked.pipe';
export * from './mark-selected/mark-selected.pipe';
export * from './safe-html/safe-html.pipe';
export * from './safe-url/safe-url.pipe';

export { TranslateSVGFrame, RectToSVGStyle, IRectToSVGStyle } from './svg/svg.pipe';

export {
  A11yPipeModule,
  AnalyticsParamsPipeModule,
  AvatarPipeModule,
  ColorPipeModule,
  FirebasePipeModule,
  FontPipeModule,
  FormatFileSizePipeModule,
  IValuePipeModule,
  MarkSelectedPipeModule,
  MenuItemsModule,
  SafeHtmlModule,
  SafeUrlModule,
  StringsPipeModule,
  SvgPipeModule,
};

@NgModule({
  imports: [
    A11yPipeModule,
    AnalyticsParamsPipeModule,
    AvatarPipeModule,
    ColorPipeModule,
    FirebasePipeModule,
    FontPipeModule,
    FormatFileSizePipeModule,
    IValuePipeModule,
    MarkSelectedPipeModule,
    MenuItemsModule,
    SafeHtmlModule,
    SafeUrlModule,
    StringsPipeModule,
    SvgPipeModule,
  ],
  exports: [
    A11yPipeModule,
    AnalyticsParamsPipeModule,
    AvatarPipeModule,
    ColorPipeModule,
    FirebasePipeModule,
    FontPipeModule,
    FormatFileSizePipeModule,
    IValuePipeModule,
    MarkSelectedPipeModule,
    MenuItemsModule,
    SafeHtmlModule,
    SafeUrlModule,
    StringsPipeModule,
    SvgPipeModule,
  ],
})
export class CdCommonPipeModule {}
