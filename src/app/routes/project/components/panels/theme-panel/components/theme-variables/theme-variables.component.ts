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
  ComponentRef,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';
import { IDesignSystem, IDesignVariable, DesignVariableType } from 'cd-interfaces';
import { VariableEditorComponent } from '../variable-editor/variable-editor.component';
import { incrementNameForDesignSystemCategory } from '../../utils/theme.utils';
import { generateIDWithLength } from 'cd-utils/guid';
import { OverlayService } from 'cd-common';
import { Subscription } from 'rxjs';
import { UnitTypes } from 'cd-metadata/units';
import { sortDesignSystemValues } from 'cd-themes';

const OFFSET_OVERLAY_TOP = 90;
const OFFSET_OVERLAY_LEFT = 90;

const DEFAULT_CONFIG: IDesignVariable = {
  name: 'Custom',
  value: 0,
  units: UnitTypes.Pixels,
  type: DesignVariableType.Layout,
};

@Component({
  selector: 'app-theme-variables',
  templateUrl: './theme-variables.component.html',
  styleUrls: ['./theme-variables.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeVariablesComponent implements OnDestroy {
  private _componentRef?: ComponentRef<VariableEditorComponent>;
  public _designSystem?: IDesignSystem;
  public variables: IDesignVariable[] = [];
  public editingVariable: IDesignVariable | null = null;

  @Input()
  public set designSystem(designSystem: IDesignSystem | undefined) {
    this._designSystem = designSystem;
    const variables = designSystem?.variables;
    if (!variables) return;
    this.variables = Object.entries(variables)
      .map(([id, value]) => ({ ...value, id }))
      .sort(sortDesignSystemValues);
  }

  public get designSystem() {
    return this._designSystem;
  }

  @Output() changeVariable = new EventEmitter<IDesignVariable>();
  @Output() removeVariable = new EventEmitter<string>();

  constructor(protected _cdRef: ChangeDetectorRef, protected _overlayService: OverlayService) {}

  getOverlayConfig(e: MouseEvent) {
    const target = e.currentTarget as HTMLElement;
    const { top, left, width, height } = target.getBoundingClientRect();
    const x = left + width - OFFSET_OVERLAY_LEFT;
    const y = top + height - OFFSET_OVERLAY_TOP;
    return { x, y, disableAutoFocus: true };
  }

  onAddItem(e: MouseEvent) {
    const id = generateIDWithLength(5).toLowerCase();
    const overlayConfig = this.getOverlayConfig(e);
    overlayConfig.x += OFFSET_OVERLAY_LEFT;
    const componentRef = this._overlayService.attachComponent(
      VariableEditorComponent,
      overlayConfig
    );
    const subscriptions = componentRef.instance.add.subscribe(this.onAddVariable);
    componentRef.instance.designSystem = this._designSystem;
    componentRef.instance.addVariable = true;

    const name = incrementNameForDesignSystemCategory(
      DEFAULT_CONFIG.name,
      this.designSystem?.variables
    );
    const index = this.variables.length;
    componentRef.instance.value = { ...DEFAULT_CONFIG, id, name, index };
    componentRef.onDestroy(() => subscriptions.unsubscribe());
    this._componentRef = componentRef;
  }

  onAddVariable = (designVariable: IDesignVariable): void => {
    this.cleanupComponentRef();
    this.changeVariable.emit(designVariable);
  };

  onEditItem(e: MouseEvent, item: IDesignVariable) {
    const overlayConfig = this.getOverlayConfig(e);
    const componentRef = this._overlayService.attachComponent(
      VariableEditorComponent,
      overlayConfig
    );

    componentRef.instance.value = item;
    componentRef.instance.removeVariable = true;
    componentRef.instance.designSystem = this._designSystem;

    this.editingVariable = item;
    this._cdRef.detectChanges();

    const subscriptions = new Subscription();
    subscriptions.add(componentRef.instance.remove.subscribe(this.onRemoveVariable));
    subscriptions.add(componentRef.instance.valueChange.subscribe(this.onEditVariable));
    this._componentRef = componentRef;

    componentRef.onDestroy(() => {
      subscriptions.unsubscribe();
      this.editingVariable = null;
      this._cdRef.detectChanges();
    });
  }

  onEditVariable = (variable: IDesignVariable): void => {
    this.changeVariable.emit(variable);
  };

  onRemoveVariable = (id: string): void => {
    this.cleanupComponentRef();
    this.removeVariable.emit(id);
  };

  cleanupComponentRef() {
    if (!this._componentRef) return;
    this._overlayService.close();
    this._componentRef = undefined;
  }

  ngOnDestroy(): void {
    this.editingVariable = null;
    this.cleanupComponentRef();
  }
}
