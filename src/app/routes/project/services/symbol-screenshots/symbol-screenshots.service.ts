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
import { BehaviorSubject, Subscription, Observable, of } from 'rxjs';
import { ScreenshotService } from 'src/app/services/screenshot-lookup/screenshot-lookup.service';
import { ProjectContentService } from 'src/app/database/changes/project-content.service';
import { distinctUntilChanged, tap, take, filter, map } from 'rxjs/operators';
import * as cd from 'cd-interfaces';
import firebase from 'firebase/app';

@Injectable({
  providedIn: 'root',
})
export class SymbolScreenshotsService implements OnDestroy {
  private _subscriptions = new Subscription();
  private _screenshotSubscription = new Subscription();

  public componentScreenshots$ = new BehaviorSubject<Map<string, cd.IScreenshotLookup>>(new Map());

  constructor(
    private _screenshotService: ScreenshotService,
    private _projectContentService: ProjectContentService
  ) {
    const { symbolsArray$, codeCmpArray$ } = this._projectContentService;
    this._subscriptions.add(symbolsArray$.subscribe(this._onComponents));
    this._subscriptions.add(codeCmpArray$.subscribe(this._onComponents));
  }

  ngOnDestroy() {
    // Warning: this is never called
    this._screenshotSubscription.unsubscribe();
    this._subscriptions.unsubscribe();
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

  private _onComponents = (components: cd.CustomComponent[]) => {
    for (const component of components) {
      this._componentUpdated(component);
    }
  };

  // if the symbol doc change was an update to the lastScreenshotTime property
  // or if we don't have a screenshot for this symbol yet. request a new screenshot
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
