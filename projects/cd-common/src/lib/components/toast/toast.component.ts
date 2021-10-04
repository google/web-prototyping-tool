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
  Input,
  Output,
  HostBinding,
  HostListener,
  EventEmitter,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';

@Component({
  selector: 'cd-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastComponent implements OnDestroy {
  private _opened = false;
  private _animating = false;
  private _timer = 0;
  private _confirmLabel?: string;
  private _dismissLabel?: string;

  @Input() showLoader = false;
  @Input() duration?: number; // Set to -1 for untimed toast
  @Input() message?: string;
  @Input() iconName?: string;
  @Input() confirmIconName?: string;
  @Input() dismissIconName?: string;
  @Input() id?: string;
  @Input() callback?: () => void;
  @Output() readonly confirm = new EventEmitter<void>();
  @Output() readonly dismiss = new EventEmitter<void>();
  @Output() readonly destroy = new EventEmitter<void>();

  @Input()
  set opened(value: boolean) {
    if (value === undefined || value === this._opened) return;
    this._animating = true;
    this._opened = value;
    if (this._opened && this.isAutoClose) {
      this._timer = window.setTimeout(this.close, this.duration);
    }
  }
  get opened(): boolean {
    return this._opened;
  }

  @Input()
  set confirmLabel(value: any) {
    this._confirmLabel = value;
  }
  get confirmLabel(): any {
    if (this.confirmButtonIsText) return this._confirmLabel;
  }

  @Input()
  set dismissLabel(value: any) {
    this._dismissLabel = value;
  }
  get dismissLabel(): any {
    if (this.dismissButtonIsText) return this._dismissLabel;
  }

  @HostBinding('class.opened')
  get getOpened(): boolean {
    return this._opened;
  }

  @HostBinding('class.animating')
  get getAnimating(): boolean {
    return this._animating;
  }

  @HostBinding('class.hidden')
  get getHidden(): boolean {
    return !this._opened && !this._animating;
  }

  @HostListener('transitionend', ['$event'])
  onEnd(e: TransitionEvent): void {
    if (e.target !== e.currentTarget) return;

    this._animating = false;

    if (this._opened === false) {
      this.destroy.emit();
    }
  }

  constructor(public cdRef: ChangeDetectorRef) {}

  get isAutoClose(): Boolean {
    return this.duration !== -1 && this.duration !== undefined;
  }

  hasAttributes = (...args: any[]): boolean => args.some((item) => item !== undefined);

  get hasActions(): boolean {
    return this.hasAttributes(
      this._confirmLabel,
      this._dismissLabel,
      this.confirmIconName,
      this.dismissIconName
    );
  }

  get showConfirmButton(): boolean {
    return this.hasAttributes(this._confirmLabel, this.confirmIconName);
  }

  get showDismissButton(): boolean {
    return this.hasAttributes(this._dismissLabel, this.dismissIconName);
  }

  get confirmButtonIsText(): boolean {
    return !!this._confirmLabel && !this.confirmIconName;
  }

  get dismissButtonIsText(): boolean {
    return !!this._dismissLabel && !this.dismissIconName;
  }

  public open() {
    this.opened = true;
  }

  public close = () => {
    this.cleanup();
    this.opened = false;
    this.cdRef.markForCheck();
  };

  public cleanup = () => {
    window.clearTimeout(this._timer);
  };

  public onConfirmClick() {
    if (this.callback) {
      this.callback();
    }
    this.confirm.emit();
    this.close();
  }

  public onDismissClick() {
    this.dismiss.emit();
    this.close();
  }

  ngOnDestroy(): void {
    this.cleanup();
  }
}
