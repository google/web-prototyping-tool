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

import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { DEFAULT_IFRAME_URL, DEFAULT_UNITS } from 'cd-common/consts';
import { generateIValue } from 'cd-common/utils';

import * as gdConfig from './docs-embed-props/docs-embed.config';
import * as gsConfig from './sheets-embed-props/sheets-embed.config';
import * as gslConfig from './slides-embed-props/slides-embed.config';
import * as gmConfig from './map-embed-props/map.config';
import * as fiConfig from './figma-embed-props/figma.config';
import * as ytConfig from './youtube-embed-props/youtube.config';
import * as cd from 'cd-interfaces';

const DEFAULT_EMBED_SIZE = [633, 426];

@Component({
  selector: 'app-embed-props',
  templateUrl: './embed-props.component.html',
  styleUrls: ['./embed-props.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmbedPropsComponent {
  private _src = '';
  public EmbedVariant = cd.EmbedVariant;
  public menuData = [
    { title: 'Website', value: cd.EmbedVariant.Default },
    { title: 'YouTube', value: cd.EmbedVariant.YouTube },
    { title: 'Figma', value: cd.EmbedVariant.Figma },
    { title: 'Maps', value: cd.EmbedVariant.GoogleMaps },
    { title: 'Docs', value: cd.EmbedVariant.GoogleDocs },
    { title: 'Sheets', value: cd.EmbedVariant.GoogleSheets },
    { title: 'Slides', value: cd.EmbedVariant.GoogleSlides },
  ];

  @Input() variant?: cd.EmbedVariant;

  @Input()
  set src(value: string) {
    this._src = value;
    this.variant = this.variantForSource(value);
  }
  get src(): string {
    return this._src;
  }

  @Output() valueChange = new EventEmitter<Partial<cd.IIFrameInputs>>();
  @Output() styleChange = new EventEmitter<Partial<cd.IStyleAttributes>>();

  variantForSource(value: string): cd.EmbedVariant {
    if (value.includes(ytConfig.YOUTUBE_EMBED_URL)) return cd.EmbedVariant.YouTube;
    if (value.includes(fiConfig.FIGMA_BASE)) return cd.EmbedVariant.Figma;
    if (value.includes(gmConfig.GOOGLE_MAPS_EMBED_URL)) return cd.EmbedVariant.GoogleMaps;
    if (value.includes(gdConfig.DOCS_BASE_URL)) return cd.EmbedVariant.GoogleDocs;
    if (value.includes(gsConfig.SHEETS_BASE_URL)) return cd.EmbedVariant.GoogleSheets;
    if (value.includes(gslConfig.SLIDES_BASE_URL)) return cd.EmbedVariant.GoogleSlides;
    return cd.EmbedVariant.Default;
  }

  onSourceChange(src: string) {
    this.valueChange.emit({ src });
  }

  updateVariant(variant: cd.EmbedVariant) {
    if (this.variant === variant) return;
    this.valueChange.emit({ variant });
  }

  defaultURLForVariant(variant: cd.EmbedVariant) {
    if (variant === cd.EmbedVariant.Figma) return fiConfig.buildDefaultFigmaProject();
    if (variant === cd.EmbedVariant.YouTube) return ytConfig.DEFAULT_YOUTUBE_VIDEO;
    if (variant === cd.EmbedVariant.GoogleMaps) return gmConfig.DEFAULT_MAPS_URL;
    if (variant === cd.EmbedVariant.GoogleDocs) return gdConfig.DEFAULT_GOOGLE_DOC;
    if (variant === cd.EmbedVariant.GoogleSheets) return gsConfig.DEFAULT_GOOGLE_SHEET;
    if (variant === cd.EmbedVariant.GoogleSlides) return gslConfig.DEFAULT_GOOGLE_SLIDES;
    return DEFAULT_IFRAME_URL;
  }

  defaultStylesForVariant(variant: cd.EmbedVariant): Partial<cd.IStyleAttributes> {
    const isYoutube = variant === cd.EmbedVariant.YouTube;
    const size = isYoutube ? ytConfig.DEFUALT_YOUTUBE_SIZE : DEFAULT_EMBED_SIZE;
    const [w, h] = size;
    const width = generateIValue(w, DEFAULT_UNITS);
    const height = generateIValue(h, DEFAULT_UNITS);
    return { width, height } as Partial<cd.IStyleAttributes>;
  }

  assignDefaultSourceValuesForVariant(variant: cd.EmbedVariant) {
    const src = this.defaultURLForVariant(variant);
    const styles = this.defaultStylesForVariant(variant);
    this.valueChange.emit({ variant, src });
    this.styleChange.emit(styles);
  }

  onVariantSelect(item: cd.ISelectItem) {
    const variant = item.value as cd.EmbedVariant;
    this.assignDefaultSourceValuesForVariant(variant);
  }
}
