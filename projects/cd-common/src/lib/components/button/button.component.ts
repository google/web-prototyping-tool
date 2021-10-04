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
  ElementRef,
  Input,
  OnInit,
  ViewChild,
  HostBinding,
} from '@angular/core';
import { ComponentSize } from 'cd-interfaces';
import { coerceBooleanProperty } from '@angular/cdk/coercion';

const BUTTON_CLASS_ATTRIBUTES: string[] = [
  'cd-button',
  'cd-unelevated-button',
  'cd-outlined-button',
  'cd-dashed-button',
  'cd-shaped-button',
  'cd-icon-button',
  'cd-inverted-button',
];

@Component({
  selector: `button[cd-button], button[cd-unelevated-button],
    button[cd-outlined-button], button[cd-dashed-button], button[cd-shaped-button],
    button[cd-icon-button], button[cd-inverted-button], a[cd-button],
    a[cd-unelevated-button], a[cd-outlined-button], a[cd-dashed-button],
    a[cd-shaped-button], a[cd-icon-button], a[cd-inverted-button]`,
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
  exportAs: 'cdButton',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent implements OnInit {
  private _fab = false;
  public hasContent = false;

  @Input() text?: string;
  @Input() size: ComponentSize = ComponentSize.Small;
  @Input() iconName?: string;
  @Input() iconSize: ComponentSize = ComponentSize.Medium;
  @Input() disabled?: boolean;

  @HostBinding('class.ready') ready = false;

  @HostBinding('class.active')
  @Input()
  active = false;

  @HostBinding('class.small')
  get getSmall() {
    return this.size === ComponentSize.Small;
  }

  @HostBinding('class.medium')
  get getMedium() {
    return this.size === ComponentSize.Medium;
  }

  @HostBinding('class.large')
  get getLarge() {
    return this.size === ComponentSize.Large;
  }

  @HostBinding('class.icon-button')
  get getIconButton(): boolean {
    return this.hasIcon && !this.hasContent;
  }

  @HostBinding('class.has-icon')
  get getHasIcon(): boolean {
    return this.hasIcon;
  }

  @HostBinding('class.disabled')
  get getDisabled() {
    return this.disabled;
  }

  @Input()
  @HostBinding('class.fab')
  set fabStyle(value: boolean) {
    this._fab = coerceBooleanProperty(value);
  }
  get fabStyle() {
    return this._fab;
  }

  @ViewChild('contentRef', { read: ElementRef, static: true }) _contentRef!: ElementRef;

  constructor(protected _elementRef: ElementRef) {}

  ngOnInit(): void {
    const { childNodes } = this._contentRef.nativeElement;
    const hasTextContent = this.text !== undefined;
    this.hasContent = hasTextContent || childNodes.length > 0;
    this.ready = true;

    const hostElem = this._getHostElement();
    for (const attr of BUTTON_CLASS_ATTRIBUTES) {
      if (this._hasHostAttributes(hostElem, attr)) {
        hostElem.classList.add(attr);
      }
    }
  }

  get hasIcon(): boolean {
    return this.iconName !== undefined;
  }

  get hideContent(): boolean {
    return !this.hasContent && !this.text;
  }

  updateIconName(iconName: string) {
    this.iconName = iconName;
  }

  _getHostElement(): HTMLElement {
    return this._elementRef.nativeElement;
  }

  _hasHostAttributes(hostElem: HTMLElement, ...attributes: string[]) {
    return attributes.some((attribute) => hostElem.hasAttribute(attribute));
  }
}
