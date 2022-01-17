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

import { Injectable, OnDestroy } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { BehaviorSubject, Subscription, Observable, of } from 'rxjs';
import { ScreenshotService } from 'src/app/services/screenshot-lookup/screenshot-lookup.service';
import { AngularFirestore } from '@angular/fire/firestore';
import { areArraysEqual } from 'cd-utils/array';
import { distinctUntilChanged, tap, take, filter, map } from 'rxjs/operators';
import { IProjectState } from '../../store/reducers';
import { getProject } from '../../store/selectors';
import { FirebaseCollection, FirebaseField, FirebaseQueryOperation } from 'cd-common/consts';
import * as cd from 'cd-interfaces';
import firebase from 'firebase/app';

@Injectable({
  providedIn: 'root',
})
export class SymbolScreenshotsService implements OnDestroy {
  private _subscriptions = new Subscription();
  private _screenshotSubscription = new Subscription();
  private _symbolUnsubscriber?: Function;
  private _codeComponentUnsubscriber?: Function;

  public componentScreenshots$ = new BehaviorSubject<Map<string, cd.IScreenshotLookup>>(new Map());

  constructor(
    private _screenshotService: ScreenshotService,
    private readonly _projectStore: Store<IProjectState>,
    private _afs: AngularFirestore
  ) {
    const project$ = this._projectStore.pipe(
      select(getProject),
      distinctUntilChanged((x, y) => {
        if (!x || !y) return false;
        return areArraysEqual(x.symbolIds, y.symbolIds);
      })
    );
    this._subscriptions.add(project$.subscribe(this._onProjectSubscription));
  }

  ngOnDestroy() {
    // Warning: this is never called
    this._screenshotSubscription.unsubscribe();
    this._subscriptions.unsubscribe();
    this._unsubsribeSymbols();
  }

  lookupSymbolScreenshot = (symbolId: string): Observable<cd.IScreenshotRef> => {
    // return cached if present
    const cachedLookup = this.screenshotForId(symbolId);
    if (cachedLookup) return of(cachedLookup as cd.IScreenshotRef);

    return this._screenshotService.getScreenshot(symbolId).pipe(
      tap((ref) => {
        // update cache
        const screenshots = new Map(this.componentScreenshots$.value);
        const timestamp = firebase.firestore.Timestamp.now();
        const lookup = { ...ref, timestamp };
        screenshots.set(symbolId, lookup);
        this.componentScreenshots$.next(screenshots);
        return ref;
      })
    );
  };

  subscribeToSymbolScreenshot = (symbolId: string): Observable<string | undefined> => {
    return this.componentScreenshots$.pipe(
      filter((value) => value.has(symbolId)),
      map((value) => value.get(symbolId)?.url),
      distinctUntilChanged()
    );
  };

  screenshotForId(id: string): cd.IScreenshotLookup | undefined {
    const screenshots = this.componentScreenshots$.getValue();
    return screenshots.get(id);
  }

  regenerateSymbolScreenshot(symbolId: string, projectId: string) {
    this._screenshotService.triggerCreateScreenshot(symbolId, projectId);
  }

  private _unsubsribeSymbols = () => {
    if (this._symbolUnsubscriber) this._symbolUnsubscriber();
    if (this._codeComponentUnsubscriber) this._codeComponentUnsubscriber();
  };

  private _onProjectSubscription = (project?: cd.IProject) => {
    this._unsubsribeSymbols();
    if (!project) return;

    // clear previous subscription and subscribe to updated set of symbol ids
    this._symbolUnsubscriber = this._afs.firestore
      .collection(FirebaseCollection.ProjectContents)
      .where(FirebaseField.ProjectId, FirebaseQueryOperation.Equals, project.id)
      .where(
        FirebaseField.ElementType,
        FirebaseQueryOperation.Equals,
        cd.ElementEntitySubType.Symbol
      )
      .onSnapshot(this._onComponentSnapshot);

    // Also subscribe to code components in the project
    this._codeComponentUnsubscriber = this._afs.firestore
      .collection(FirebaseCollection.ProjectContents)
      .where(FirebaseField.ProjectId, FirebaseQueryOperation.Equals, project.id)
      .where(FirebaseField.DocumentType, FirebaseQueryOperation.Equals, cd.EntityType.CodeComponent)
      .onSnapshot(this._onComponentSnapshot);
  };

  // if the symbol doc change was an update to the lastScreenshotTime property
  // or if we don't have a screenshot for this symbol yet. request a new screenshot
  private _onComponentSnapshot = (snapshot: firebase.firestore.QuerySnapshot) => {
    for (const doc of snapshot.docs) {
      const component = doc.data() as cd.CustomComponent;
      this._componentUpdated(component);
    }
  };

  private _componentUpdated = (component: cd.CustomComponent) => {
    const { id, lastScreenshotTime } = component;
    const currentLookup = this.screenshotForId(id);

    // if there is a screenshot timestamp present on this symbol
    // and we don't have a screenshot, or the current screenshot is not most recent
    if (
      lastScreenshotTime &&
      (!currentLookup || currentLookup.timestamp.seconds < lastScreenshotTime.seconds)
    ) {
      // go ahead and set new timestamp in lookup, so that we don't lookup again if subsequent
      // changes occur before we have completed this screenshot request
      if (currentLookup) {
        currentLookup.timestamp = lastScreenshotTime;
        this.componentScreenshots$.value.set(id, currentLookup);
      }

      this._screenshotSubscription.add(
        this._screenshotService
          .getScreenshot(id)
          .pipe(take(1))
          .subscribe((ref) => {
            if (!ref.url) return;
            const screenshots = new Map(this.componentScreenshots$.value);
            screenshots.set(id, { ...ref, timestamp: lastScreenshotTime });
            this.componentScreenshots$.next(screenshots);
          })
      );
    }
  };
}
