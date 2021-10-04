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

import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { AngularFirestoreCollection, AngularFirestore } from '@angular/fire/firestore';
import { Observable, Subscription } from 'rxjs';
import { IStatusMessage } from '../../../project/interfaces/status-banner.interface';
import { ToastsService } from '../../../../services/toasts/toasts.service';
import { statusMessagePathForId } from 'src/app/database/path.utils';
import { FirebaseCollection } from 'cd-common/consts';
import { map } from 'rxjs/operators';

interface IStatusMessageDetail extends IStatusMessage {
  docId: string;
}

@Component({
  selector: 'app-banner-editor',
  templateUrl: './banner-editor.component.html',
  styleUrls: ['./banner-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BannerEditorComponent implements OnInit {
  private _subscriptions = new Subscription();
  private _statusMessageCollection?: AngularFirestoreCollection<IStatusMessage>;
  public activeStatusID = '';
  public activeStatusDocID = '';
  public activeStatusMessage = '';
  public activeStatusLinkTitle = '';
  public activeStatusLinkURL = '';
  public statusMessage?: Observable<IStatusMessageDetail>;

  constructor(
    private _afs: AngularFirestore,
    private _toastService: ToastsService,
    private _cdRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this._statusMessageCollection = this._afs.collection<IStatusMessage>(
      FirebaseCollection.StatusMessage
    );

    this.statusMessage = this._statusMessageCollection.snapshotChanges().pipe(
      map((messages) => {
        const message = messages[0];
        const data = message.payload.doc.data();
        const docId = message.payload.doc.id;
        return { docId, ...data };
      })
    );

    this._subscriptions.add(this.statusMessage.subscribe(this.handleStatusMessage));
  }

  private handleStatusMessage = (message: IStatusMessageDetail) => {
    this.activeStatusID = message.id;
    this.activeStatusDocID = message.docId;
    this.activeStatusMessage = message.message;

    if (message.link) {
      this.activeStatusLinkTitle = message.link.title;
      this.activeStatusLinkURL = message.link.url;
    }

    this._cdRef.markForCheck();
  };

  async commitStatusBanner() {
    if (!this.activeStatusDocID) return;

    const docPath = statusMessagePathForId(this.activeStatusDocID);
    const message: Partial<IStatusMessageDetail> = {
      id: this.activeStatusID,
      message: this.activeStatusMessage,
    };

    if (this.activeStatusLinkTitle && this.activeStatusLinkURL) {
      message.link = {
        title: this.activeStatusLinkTitle,
        url: this.activeStatusLinkURL,
      };
    }

    await this._afs.doc(docPath).set(message);
    this._toastService.addToast({
      message: 'Successfully updated status banner message',
    });
  }

  onStatusIDChange(text: string) {
    this.activeStatusID = text;
  }

  onStatusMessageChange(text: string) {
    this.activeStatusMessage = text;
  }

  onStatusLinkTextChange(text: string) {
    this.activeStatusLinkTitle = text;
  }

  onStatusLinkURLChange(text: string) {
    this.activeStatusLinkURL = text;
  }
}
