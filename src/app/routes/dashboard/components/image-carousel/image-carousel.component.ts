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
  ViewChildren,
  QueryList,
  ElementRef,
  AfterViewInit,
  ViewChild,
  OnChanges,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';
import { ScrollBehavior } from 'cd-common/consts';

const IMAGE_INDEX_ATTR = 'data-index';

@Component({
  selector: 'app-image-carousel',
  templateUrl: './image-carousel.component.html',
  styleUrls: ['./image-carousel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageCarouselComponent implements AfterViewInit, OnChanges, OnDestroy {
  public selectedIndex = 0;
  private _observer?: IntersectionObserver;

  @Input() images: string[] = [];

  @ViewChild('imageList', { static: true }) imageList!: ElementRef;
  @ViewChildren('imageEl') imageElements!: QueryList<ElementRef>;

  constructor(private _cdRef: ChangeDetectorRef) {}

  get hasImages(): boolean {
    return this.images.length > 1;
  }

  ngAfterViewInit() {
    this._setupObserver();
    this._updateObserverTargets();
  }

  ngOnChanges() {
    this._updateObserverTargets();
  }

  ngOnDestroy() {
    this._disconnectObserver();
  }

  onDotClicked(index: number) {
    this.selectedIndex = index;
    const imageRef = this.imageElements.toArray()[index];
    if (!imageRef) return;
    (imageRef.nativeElement as HTMLElement).scrollIntoView({ behavior: ScrollBehavior.Smooth });
  }

  private _setupObserver() {
    const imageListEl = this.imageList.nativeElement;
    const observerOptions = {
      root: imageListEl,
      rootMargin: '0px',
      threshold: 0.51, // threshold of just over halfway in view
    };
    this._observer = new IntersectionObserver(this._onIntersectionChange, observerOptions);
  }

  private _updateObserverTargets() {
    const { _observer } = this;
    if (!_observer) return;
    _observer.disconnect(); // remove all current targets

    const imageEls = this.imageElements.toArray().map((ref) => ref.nativeElement) as HTMLElement[];
    for (const el of imageEls) {
      _observer.observe(el);
    }
  }

  private _onIntersectionChange = (entries: IntersectionObserverEntry[]) => {
    const intersectingImage = entries.find((e) => e.isIntersecting);
    if (!intersectingImage) return;

    const imageIndex = Number(intersectingImage.target.getAttribute(IMAGE_INDEX_ATTR));
    if (this.selectedIndex !== imageIndex) {
      this.selectedIndex = imageIndex;
      this._cdRef.markForCheck();
    }
  };

  private _disconnectObserver = () => this._observer && this._observer.disconnect();
}
