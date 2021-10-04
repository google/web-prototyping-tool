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

import { Component, OnInit } from '@angular/core';
import { routes } from './app-routing.module';

const DARK_THEME = 'dark-theme';

@Component({
  selector: 'app-root',
  template: `
    <aside class="sidebar">
      <header>
        <h3></h3>
        <button class="theme-toggle" (click)="onThemeToggle()">
          <i class="google-material-icons">mode_night</i>
        </button>
      </header>
      <ul>
        <li
          *ngFor="let item of routes"
          [routerLink]="item.path"
          routerLinkActive="active"
          preserveFragment
        >
          {{ item.path }}
        </li>
      </ul>
    </aside>
    <div class="container">
      <router-outlet></router-outlet>
    </div>
  `,
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  public routes = routes;

  ngOnInit(): void {
    const darkTheme = window.location.hash.substr(1) === DARK_THEME;
    if (darkTheme) this.onThemeToggle();
  }

  onThemeToggle() {
    const toggle = document.body.classList.toggle(DARK_THEME);
    window.location.hash = toggle ? DARK_THEME : '';
  }
}
