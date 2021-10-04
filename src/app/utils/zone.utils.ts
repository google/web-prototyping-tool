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

import { NgZone } from '@angular/core';
import { SchedulerLike, Subscription } from 'rxjs';

class ZoneScheduler implements SchedulerLike {
  constructor(protected _zone: NgZone, protected scheduler: SchedulerLike) {}

  schedule(...args: any[]): Subscription {
    return this._zone.runOutsideAngular(() =>
      this.scheduler.schedule.apply(this.scheduler, args as any)
    );
  }

  now(): number {
    return this.scheduler.now();
  }
}

class EnterZoneScheduler extends ZoneScheduler {
  schedule(...args: any[]): Subscription {
    return this._zone.run(() => this.scheduler.schedule.apply(this.scheduler, args as any));
  }
}

export function exitZone(zone: NgZone, scheduler: SchedulerLike): SchedulerLike {
  return new ZoneScheduler(zone, scheduler);
}

export function enterZone(zone: NgZone, scheduler: SchedulerLike): SchedulerLike {
  return new EnterZoneScheduler(zone, scheduler);
}
