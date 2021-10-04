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
  OnInit,
  ChangeDetectionStrategy,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { environment } from 'src/environments/environment';
import { AbstractBannerDirective } from '../abstract.banner';
import { DatabaseService } from 'src/app/database/database.service';
import { FirebaseCollection } from 'cd-common/consts';
import { take } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { IStatusMessage } from '../../../interfaces/status-banner.interface';

const STATUS_ID = 'status-banner';

@Component({
  selector: 'app-status-banner',
  templateUrl: './status-banner.component.html',
  styleUrls: ['./status-banner.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBannerComponent extends AbstractBannerDirective implements OnInit, OnDestroy {
  public status?: IStatusMessage;
  public showBanner = false;
  private _subscription = Subscription.EMPTY;

  constructor(private _db: DatabaseService, private _cdRef: ChangeDetectorRef) {
    super();
  }

  ngOnInit() {
    if (environment.e2e) {
      this.showBanner = true;
      return;
    }

    this._subscription = this._db
      .getCollection(FirebaseCollection.StatusMessage, (ref) => ref.limit(1))
      .pipe(take(1))
      .subscribe((value) => {
        const msg = value && (value[0] as IStatusMessage);
        if (msg) {
          const status = window.localStorage.getItem(STATUS_ID);
          this.showBanner = status !== msg.id;
          this.status = msg;
          this._cdRef.markForCheck();
        }
      });
  }

  onDismiss() {
    if (!this.status) return;
    window.localStorage.setItem(STATUS_ID, this.status.id);
    this.showBanner = false;
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }
}
