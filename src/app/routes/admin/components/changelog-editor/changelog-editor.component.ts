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
import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { AngularFirestoreCollection, AngularFirestore } from '@angular/fire/firestore';
import { FirebaseCollection } from 'cd-common/consts';
import dayjs from 'dayjs';
import firebase from 'firebase/app';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { newsUpdatesPathForId } from 'src/app/database/path.utils';
import { ToastsService } from '../../../../services/toasts/toasts.service';

interface INewsDetail extends cd.INewsItem {
  id: string;
}

const TEMP_NEW_ELEMENT_ID = 'TEMP_NEW_ID';

@Component({
  selector: 'app-changelog-editor',
  templateUrl: './changelog-editor.component.html',
  styleUrls: ['./changelog-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangelogEditorComponent implements OnInit {
  private _newsCollection?: AngularFirestoreCollection<cd.INewsItem>;
  public activeDetails = 'description';
  public activeTitle = 'title';
  public activeDay = 24;
  public activeMonth = 2;
  public activeYear = 2020;
  public activeDate?: firebase.firestore.Timestamp;
  public activeId = '';
  public newsFeed?: Observable<INewsDetail[]>;

  get isAddingNew() {
    return this.activeId === TEMP_NEW_ELEMENT_ID;
  }

  get month() {
    return this.activeMonth + 1;
  }

  get fullEntry(): cd.INewsItem {
    return {
      title: this.activeTitle,
      date: this.activeDate || firebase.firestore.Timestamp.now(),
      details: this.activeDetails,
    };
  }

  constructor(
    private _afs: AngularFirestore,
    private _cdRef: ChangeDetectorRef,
    private _toastService: ToastsService
  ) {}

  ngOnInit() {
    this._newsCollection = this._afs.collection<cd.INewsItem>(
      FirebaseCollection.NewsUpdates,
      (ref) => ref.orderBy('date', 'desc')
    );

    this.newsFeed = this._newsCollection.snapshotChanges().pipe(
      map((actions) =>
        actions.map((a) => {
          const data = a.payload.doc.data() as cd.INewsItem;
          const id = a.payload.doc.id;
          return { id, ...data };
        })
      )
    );
  }

  onDayChange(day: number) {
    this.activeDay = day;
    this.updateDate();
  }

  onMonthChange(month: number) {
    this.activeMonth = month - 1;
    this.updateDate();
  }

  onYearChange(year: number) {
    this.activeYear = year;
    this.updateDate();
  }

  updateDate() {
    const { activeYear, activeMonth, activeDay } = this;
    this.activeDate = firebase.firestore.Timestamp.fromDate(
      new Date(activeYear, activeMonth, activeDay)
    );
    this._cdRef.markForCheck();
  }

  onTextChange({ innerHTML }: cd.ITextInputs) {
    this.activeDetails = innerHTML as string;
    this._cdRef.markForCheck();
  }

  onTitleChange(e: Event) {
    this.activeTitle = (e.target as HTMLInputElement).value;
    this._cdRef.markForCheck();
  }

  assignDateFromTimestamp(value: firebase.firestore.Timestamp) {
    const datetimeObj = dayjs(value.toMillis());
    this.activeMonth = datetimeObj.month();
    this.activeDay = datetimeObj.date();
    this.activeYear = datetimeObj.year();
    this.activeDate = value;
  }

  assignActive(e: Event, item: INewsDetail) {
    e.stopPropagation();
    if (this.activeId === item.id) return;
    this.activeDetails = item.details;
    this.activeId = item.id;
    this.activeTitle = item.title;
    this.assignDateFromTimestamp(item.date);
    this.updateDate();
    this._cdRef.detectChanges();
  }

  addNews(e: Event) {
    e.stopPropagation();
    this.activeId = TEMP_NEW_ELEMENT_ID;
    this.activeDetails = 'description';
    this.activeTitle = 'Alpha';
    const datetime = firebase.firestore.Timestamp.now();
    this.assignDateFromTimestamp(datetime);
    this._cdRef.markForCheck();
  }

  clearSelection() {
    if (!this.activeId) return;
    this.activeDetails = '';
    this.activeId = '';
    this.activeTitle = '';
    this.activeDate = undefined;
    this._cdRef.detectChanges();
  }

  onCancel() {
    this.activeId = '';
    this._cdRef.markForCheck();
  }

  async deleteNews() {
    if (!this.activeId) return;
    const docPath = newsUpdatesPathForId(this.activeId);
    await this._afs.doc(docPath).delete();
    this.clearSelection();
    this._toastService.addToast({
      message: 'Successfully deleted changelog entry',
    });
    this._cdRef.markForCheck();
  }

  async saveEdits() {
    if (!this._newsCollection) return;

    if (this.isAddingNew) {
      this.activeId = '';
      await this._newsCollection.add(this.fullEntry);

      this._toastService.addToast({
        message: 'Successfully added new changelog entry',
      });
    } else {
      const docPath = newsUpdatesPathForId(this.activeId);
      await this._afs.doc(docPath).set(this.fullEntry);

      this._toastService.addToast({
        message: 'Successfully edited changelog entry',
      });
    }

    this._cdRef.markForCheck();
  }
}
