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
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import * as cd from 'cd-interfaces';
import { isImageOriginalSize } from '../../../../utils/assets.utils';

@Component({
  selector: 'app-image-size-props',
  templateUrl: './image-size.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageSizeComponent implements OnChanges {
  public isResetButtonDisabled = false;
  public styles = {};

  @Input() asset: cd.IProjectAsset | undefined;

  @Input()
  set model(value: cd.IStyleDeclaration) {
    const { width, height } = value;
    this.styles = { width, height };
  }

  @Output() resetImageSize = new EventEmitter<void>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.asset || changes.model) {
      this.isResetButtonDisabled = this.determineDisabled(this.styles, this.asset);
    }
  }

  determineDisabled(styles: cd.IStyleDeclaration, asset: cd.IProjectAsset | undefined): boolean {
    if (!asset) return true;
    return isImageOriginalSize(styles, asset);
  }

  onReset(e: MouseEvent) {
    const target = e.currentTarget as HTMLElement;
    if (target) target.blur();
    const { asset } = this;
    if (!asset) return;
    this.resetImageSize.emit();
  }
}
