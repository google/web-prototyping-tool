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
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { PropertiesService } from '../../../services/properties/properties.service';
import { Subscription, Observable } from 'rxjs';
import * as cd from 'cd-interfaces';
import { Store } from '@ngrx/store';
import { IProjectState, SymbolRename } from '../../../store';
import { SYMBOL_USER_FACING_NAME_LC } from 'cd-common/consts';
import { AbstractOverlayControllerDirective, OverlayService } from 'cd-common';

@Component({
  selector: 'app-symbol-isolation-properties',
  templateUrl: './symbol-isolation-properties.component.html',
  styleUrls: ['./symbol-isolation-properties.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SymbolIsolationPropertiesComponent
  extends AbstractOverlayControllerDirective
  implements OnDestroy
{
  private _subscriptions = new Subscription();
  private _symbolId = '';

  public publishEntry?: cd.IPublishEntry;
  public symbolProperties?: cd.ISymbolProperties;
  public user$?: Observable<Partial<cd.IUser> | undefined>;
  public editingEnabled = false;
  public SYMBOL_NAME = SYMBOL_USER_FACING_NAME_LC;
  public PublishType = cd.PublishType;

  @Input()
  set symbolId(symbolId: string) {
    if (!symbolId || symbolId === this._symbolId) return;
    this._subscriptions.unsubscribe();
    this._subscriptions = this._propertiesService
      .subscribeToProperties(symbolId)
      .subscribe(this.onPropertiesUpdate);
  }

  @Input() projectData?: cd.IProject;

  constructor(
    private _propertiesService: PropertiesService,
    private _cdRef: ChangeDetectorRef,
    private _projectStore: Store<IProjectState>,
    _overlayService: OverlayService
  ) {
    super(_overlayService);
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this._subscriptions.unsubscribe();
  }

  onTitleChange(name: string) {
    this._projectStore.dispatch(new SymbolRename(this._symbolId, name));
  }

  private onPropertiesUpdate = ([first]: cd.PropertyModel[]) => {
    if (first?.elementType !== cd.ElementEntitySubType.Symbol) return;
    this.symbolProperties = first as cd.ISymbolProperties;
    this._cdRef.markForCheck();
  };
}
