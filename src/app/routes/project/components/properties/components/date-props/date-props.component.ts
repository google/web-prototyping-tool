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

import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';

const SPLIT_VALUE = '-';

@Component({
  selector: 'app-date-props',
  templateUrl: './date-props.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatePropsComponent {
  public day = 24;
  public month = 2;
  public year = 2020;

  @Input() label = 'Date';

  @Input()
  public set value(value: string) {
    if (value) {
      const [year, month, day] = value.split(SPLIT_VALUE);
      this.year = parseInt(year, 10);
      this.month = parseInt(month, 10);
      this.day = parseInt(day, 10);
    }
  }

  @Output() valueChange = new EventEmitter<string>();

  onDayChange(day: number) {
    this.day = day;
    this.updateDate();
  }

  onMonthChange(month: number) {
    this.month = month;
    this.updateDate();
  }

  onYearChange(year: number) {
    this.year = year;
    this.updateDate();
  }

  updateDate() {
    const { year, month, day } = this;
    // Join values and add leading zero
    const value = [year, month, day].map((amt) => (amt < 10 ? '0' + amt : amt)).join(SPLIT_VALUE);
    this.valueChange.emit(value);
  }
}
