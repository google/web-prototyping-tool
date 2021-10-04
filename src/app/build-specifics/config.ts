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

import { AngularFirestore } from '@angular/fire/firestore';
import { FIREBASE_OPTIONS, AngularFireModule } from '@angular/fire';
import { AngularFireStorage } from '@angular/fire/storage';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestoreMock } from '../services/mocks/angular-firestore.mock.service';
import { AngularFireAuthMock } from '../database/test/angular-fire-auth.mock.service';
import { AngularFireStorageMock } from '../database/test/angular-fire-storage.mock.service';
import { environment } from 'src/environments/environment';
import { AbstractStorageService } from '../services/storage/abstract-storage.service';
import { FireStorageService } from '../services/storage/fire-storage.service';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';

// Mock modules config
export const mockModules = [];

export const mockProviders = [
  { provide: AngularFirestore, useClass: AngularFirestoreMock },
  { provide: AngularFireAuth, useClass: AngularFireAuthMock },
  { provide: AngularFireStorage, useClass: AngularFireStorageMock },
  { provide: FIREBASE_OPTIONS, useValue: environment.firebase },
];

// Dev modules config
export const devModules = [
  AngularFireModule.initializeApp(environment.firebase),
  StoreDevtoolsModule.instrument({ maxAge: 25 }),
];

export const devProviders = [{ provide: AbstractStorageService, useClass: FireStorageService }];

// Prod modules config
export const prodModules = [AngularFireModule.initializeApp(environment.firebase)];

export const prodProviders = [{ provide: AbstractStorageService, useClass: FireStorageService }];
