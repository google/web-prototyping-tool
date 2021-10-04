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

import {
  Component,
  ChangeDetectionStrategy,
  Input,
  HostBinding,
  HostListener,
} from '@angular/core';
import * as cd from 'cd-interfaces';
import { svgTranslate } from 'cd-utils/css';

const TEXT_OFFSET = 10;

@Component({
  selector: 'g[app-marquee-layer]',
  template: `
    <svg:rect class="marquee" [cdSVGRect]="marqueeRect"></svg:rect>
    <svg:g
      app-info-text
      *ngIf="createBoard"
      [text]="infoText"
      zoom="1"
      [attr.transform]="infoTextPosition"
    ></svg:g>

    <svg:rect
      *ngFor="let cursor of peerMarqueeCursors; trackBy: trackByFn"
      class="peer-marquee"
      [attr.stroke]="cursor.sessionId | peerColorPipe: darkTheme:0.4"
      [attr.fill]="cursor.sessionId | peerColorPipe: darkTheme:0.1"
      [cdSVGRect]="cursor | peerMarqueeRectPositionPipe: zoom:canvas"
    ></svg:rect>
  `,
  styleUrls: ['./marquee-layer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarqueeLayerComponent {
  private _marqueeRect?: cd.IRect;
  public infoTextPosition = '';
  public infoText = '';

  @Input()
  @HostBinding('class.create-board')
  createBoard = false;

  @Input() zoom = 1;
  @Input() darkTheme = false;
  @Input() canvas?: cd.ICanvas;
  @Input() peerMarqueeCursors: cd.IUserCursor[] = [];

  @Input()
  set marqueeRect(rect: cd.IRect | undefined) {
    this._marqueeRect = rect;
    if (rect) {
      const { zoom } = this;
      const w = Math.round(rect.width / zoom);
      const h = Math.round(rect.height / zoom);
      this.infoText = `${w} x ${h}`;
    } else {
      this.infoText = '';
      this.infoTextPosition = '';
    }
  }
  get marqueeRect() {
    return this._marqueeRect;
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove({ pageX, pageY }: MouseEvent) {
    this.infoTextPosition = svgTranslate(pageX + TEXT_OFFSET, pageY + TEXT_OFFSET);
  }

  trackByFn(_index: number, cursor: cd.IUserCursor) {
    if (!cursor.marqueeRect) return undefined;
    const { zoom } = this;
    const { x, y, width, height } = cursor.marqueeRect;
    return `${x}-${y}-${width}-${height}-${zoom}`;
  }
}
