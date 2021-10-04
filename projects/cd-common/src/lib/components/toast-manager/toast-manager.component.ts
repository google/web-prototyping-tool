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
  ViewChild,
  ViewContainerRef,
  ComponentFactoryResolver,
  EventEmitter,
  ChangeDetectionStrategy,
  ComponentRef,
} from '@angular/core';
import { IToast } from 'cd-interfaces';
import { ToastComponent } from '../toast/toast.component';

interface IToastRef {
  config: IToast;
  componentRef: ComponentRef<ToastComponent>;
}

@Component({
  selector: 'cd-toast-manager',
  templateUrl: './toast-manager.component.html',
  styleUrls: ['./toast-manager.component.scss'],
  entryComponents: [ToastComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastManagerComponent {
  private _currentToasts: Array<IToastRef> = [];

  @Output() readonly toastRemoved = new EventEmitter<IToast>();
  @ViewChild('toasts', { read: ViewContainerRef }) container!: ViewContainerRef;

  @Input()
  set toasts(toasts: IToast[]) {
    const { _currentToasts } = this;

    // Close any toasts that are not in the new array of toasts
    const closeToasts = _currentToasts.filter((ref) => !toasts.find((t) => t.id === ref.config.id));
    this.closeToastRefs(closeToasts);

    for (const config of toasts) {
      const existingToast = _currentToasts.find((t) => t.config.id === config.id);
      if (existingToast) {
        existingToast.config = config;
        this.updateToast(existingToast.componentRef, config, false);
      } else {
        const componentRef = this.createToast(config);
        const toastRef: IToastRef = { config, componentRef };
        _currentToasts.push(toastRef);
      }
    }
  }

  get toasts(): IToast[] {
    return this._currentToasts.map((item) => item.config);
  }

  get toastRefs(): Array<IToastRef> {
    return this._currentToasts;
  }

  constructor(private resolver: ComponentFactoryResolver) {}

  closeToastRefs(refs: IToastRef[]) {
    for (const ref of refs) {
      this.closeToast(ref.componentRef);
    }
  }

  createToast(config: IToast): ComponentRef<ToastComponent> {
    const factory = this.resolver.resolveComponentFactory(ToastComponent);
    const cmpRef = this.container.createComponent(factory);
    this.updateToast(cmpRef, config);
    const subscription = cmpRef.instance.destroy.subscribe(() => this.destroyToast(cmpRef));
    cmpRef.onDestroy(() => subscription.unsubscribe());
    return cmpRef;
  }

  updateToast(componentRef: ComponentRef<ToastComponent>, config: IToast, initialOpen = true) {
    const { instance } = componentRef;
    instance.id = config.id;
    instance.duration = config.duration;
    instance.iconName = config.iconName;
    instance.message = config.message;
    instance.confirmLabel = config.confirmLabel;
    instance.dismissLabel = config.dismissLabel;
    instance.confirmIconName = config.confirmIconName;
    instance.dismissIconName = config.dismissIconName;
    instance.callback = config.callback;
    instance.showLoader = !!config.showLoader;
    if (initialOpen) instance.opened = true;
    componentRef.instance.cdRef.markForCheck();
  }

  closeToast(componentRef: ComponentRef<ToastComponent>) {
    componentRef.instance.close();
  }

  destroyToast = (componentRef: ComponentRef<ToastComponent>) => {
    componentRef.destroy();

    const indexOfToast = this._currentToasts.findIndex(
      (toastRef) => toastRef.componentRef === componentRef
    );

    if (indexOfToast > -1) {
      const removedToast = this._currentToasts.splice(indexOfToast, 1)[0].config;
      this.toastRemoved.emit(removedToast);
    }
  };
}
