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

import { BehaviorSubject, Subscription } from 'rxjs';
import { AngularFireUploadTask } from '@angular/fire/storage';
import { toDecimal } from 'cd-utils/numeric';

export class AFStorageUploadHelper {
  private subscriptions = new Subscription();
  private readonly progressSubject: BehaviorSubject<number>;

  constructor(private uploadTask: AngularFireUploadTask) {
    this.progressSubject = new BehaviorSubject<number>(0);

    this.setupPercentageChanges();
    uploadTask.then(this.onComplete);
    uploadTask.catch(this.onError);
  }

  public getStream = () => this.progressSubject.asObservable();

  private onComplete = () => {
    const { progressSubject, subscriptions } = this;
    progressSubject.complete();
    subscriptions.unsubscribe();
  };

  private onError = (err: Error) => {
    const { progressSubject, subscriptions } = this;
    progressSubject.error(err);
    subscriptions.unsubscribe();
  };

  private setupPercentageChanges = () => {
    const { uploadTask, subscriptions } = this;
    subscriptions.add(uploadTask.percentageChanges().subscribe(this.onPercentageChanges));
  };

  private onPercentageChanges = (percentage = 0) => {
    // Percentage is number | undefined even though AngularFire
    // documentation says it's always a number, and doesn't say when it can be
    // undefined. Assuming undefined = 0%.
    const progress = toDecimal(percentage);
    this.progressSubject.next(progress);
  };
}
