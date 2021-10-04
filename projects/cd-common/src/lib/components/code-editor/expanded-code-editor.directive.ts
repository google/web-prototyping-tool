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
  Directive,
  OnDestroy,
  ComponentRef,
  Input,
  Output,
  EventEmitter,
  ChangeDetectorRef,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { OverlayService } from '../overlay/overlay.service';
import { CodeEditorModalComponent } from './code-editor-modal.component';
import { CodeEditorComponent } from './code-editor.component';

@Directive({
  selector: '[cdExpandedCodeEditor]',
})
export class ExpandedCodeEditorDirective implements OnDestroy {
  private _subscription = Subscription.EMPTY;
  private _componentRef?: ComponentRef<CodeEditorModalComponent>;
  private _isValid = true;
  private _value = '';

  @Input() placeholder = '';
  @Input()
  set isValid(value) {
    this._isValid = value;
    if (!this._componentRef) return;

    this._componentRef.instance.updateValidity(value);
  }
  get isValid() {
    return this._isValid;
  }

  @Input()
  set value(value) {
    this._value = value;
    if (!this._componentRef) return;
    this._componentRef.instance.updateValue(value);
  }
  get value() {
    return this._value;
  }

  @Output() closeExpanded = new EventEmitter<void>();

  constructor(
    private _cdRef: ChangeDetectorRef,
    private _overlayService: OverlayService,
    private _host: CodeEditorComponent
  ) {}

  onValueChange = (value: string) => {
    this._host.valueChange.emit(value);
  };

  onChange = (value: string) => {
    this._host.change.emit(value);
  };

  get expanded() {
    return this._componentRef !== undefined;
  }

  createExpandedTextArea(title: string) {
    const config = { noPadding: true };

    const componentRef = this._overlayService.attachComponent(CodeEditorModalComponent, config);
    componentRef.instance.value = this.value;
    componentRef.instance.isValid = this.isValid;
    componentRef.instance.placeholder = this.placeholder;
    componentRef.instance.title = title;
    this._subscription = new Subscription();
    this._subscription.add(componentRef.instance.valueChange.subscribe(this.onValueChange));
    this._subscription.add(componentRef.instance.codeChange.subscribe(this.onChange));
    this._subscription.add(componentRef.instance.dismissOverlay.subscribe(this._cleanup));
    this._subscription.add(
      componentRef.onDestroy(() => {
        this._componentRef = undefined;
        this._subscription.unsubscribe();
        this.closeExpanded.emit();
        this._cdRef.markForCheck();
      })
    );
    this._componentRef = componentRef;
  }

  public closeModal = () => {
    this._overlayService.close();
    this.closeExpanded.emit();
  };

  private _cleanup = () => {
    if (!this._componentRef) return;

    this._overlayService.close();
    this._componentRef.destroy();
    this._componentRef = undefined;
  };

  ngOnDestroy() {
    this._subscription.unsubscribe();
    this._cleanup();
  }
}
