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

import type * as cd from 'cd-interfaces';
import {
  Component,
  ChangeDetectionStrategy,
  Input,
  ComponentRef,
  ElementRef,
  OnDestroy,
  ChangeDetectorRef,
  ViewChild,
} from '@angular/core';
import * as utils from 'src/app/utils/user.utils';
import { OverflowIndicatorsComponent } from './overflow-indicators/overflow-indicators.component';
import { OverlayService } from 'cd-common';

const MAX_INDICATORS = 4;

@Component({
  selector: 'app-presence-indicators',
  templateUrl: './presence-indicators.component.html',
  styleUrls: ['./presence-indicators.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PresenceIndicatorsComponent implements OnDestroy {
  private _componentRef?: ComponentRef<OverflowIndicatorsComponent>;

  public MAX_INDICATORS = MAX_INDICATORS;
  public visibleUsers: cd.IUserPresence[] = [];
  public overflowUsers: cd.IUserPresence[] = [];
  public userMenu: cd.IMenuConfig[] = utils.USER_ACTIONS_MENU;

  @ViewChild('overflowIndicator') overflowIndicator?: ElementRef;

  @Input() darkTheme = false;

  @Input() set presentUsers(users: cd.IUserPresence[]) {
    if (users.length > MAX_INDICATORS) {
      this.visibleUsers = users.slice(0, MAX_INDICATORS - 1);
      this.overflowUsers = users.slice(MAX_INDICATORS - 1);
    } else {
      this.visibleUsers = users;
      this.overflowUsers = [];
    }
  }

  constructor(private _overlayService: OverlayService, private _cdRef: ChangeDetectorRef) {}

  cleanupComponentRef() {
    if (!this._componentRef) return;
    this._overlayService.close();
    this._componentRef = undefined;
  }

  ngOnDestroy() {
    this.cleanupComponentRef();
  }

  closeOverflowOverlay() {
    this.cleanupComponentRef();
  }

  trackByFn(_index: number, presence: cd.IUserPresence): string {
    return presence.sessionId;
  }

  onMenuSelect(item: cd.IMenuConfig, presence: cd.IUserPresence) {
    const email = presence?.user?.email;
    if (!email) return;
    if (item.value === utils.UserMenuEvents.Projects) utils.openUserProjects(email);
    if (item.value === utils.UserMenuEvents.Teams) utils.openUserTeamsPage(email);
  }

  onOverflowClick() {
    if (this._componentRef || !this.overflowIndicator) return;
    const parentRect = this.overflowIndicator.nativeElement.getBoundingClientRect();
    const config = { parentRect, alignBottom: true, xOffset: 4, yOffset: 6 };
    const componentRef = this._overlayService.attachComponent(OverflowIndicatorsComponent, config);
    const { instance } = componentRef;
    instance.darkTheme = this.darkTheme;
    instance.overflowUsers = this.overflowUsers;
    this._componentRef = componentRef;

    componentRef.onDestroy(() => {
      this._componentRef = undefined;
      this._cdRef.markForCheck();
    });
  }
}
