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

import { Pipe, PipeTransform } from '@angular/core';
import { ISelectInputs } from 'cd-interfaces';

/**
 * This is a workaround to fix an issue with Material Select not updating an option changes
 * Consider the following example:
 *
 * <mat-select [value]="input.value">
 *  <mat-option *ngFor"let option of input.options" [value]="option.value">{{option.name}}</mat-option>
 * </mat-select>
 *
 * If option.name changes mat-select will not update the component :(
 *
 * Instead we need to utilize mat-select-trigger to assign the value
 * <mat-select [value]="input.value">
 *  <mat-select-trigger>input | matSelectFix</mat-select-trigger>
 *  <mat-option *ngFor"let option of input.options" [value]="option.value">{{option.name}}</mat-option>
 * </mat-select>
 */
@Pipe({ name: 'matSelectFix' })
export class MatSelectFixPipe implements PipeTransform {
  transform(inputs: ISelectInputs): string | undefined {
    const currentValue = inputs.value;
    return inputs.options.find((item) => item.value === currentValue)?.name;
  }
}
