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

'use strict';
const ACTIVE_CLASS = 'active';
const EXPAND_CLASS = 'exp';
const MAIN_NAV_ID = 'main-navigation';

function showNavigation() {
  const navigation = document.getElementById(MAIN_NAV_ID);
  navigation.classList.remove('hidden', 'sticky', 'pt-32');
  navigation.classList.add(
    'absolute',
    'right-0',
    'top-0',
    '-mt-0',
    'z-50',
    'pt-0',
    'bg-white',
    'border-l',
    'border-gray-200'
  );
}

function closeNavigation() {
  const navigation = document.getElementById(MAIN_NAV_ID);
  navigation.classList.add('hidden');
  navigation.classList.remove(
    'absolute',
    'right-0',
    'z-50',
    'bg-gray-100',
    'border-r',
    'border-gray-800'
  );
}

function scrollNavIntoView() {
  const navigation = document.getElementById(MAIN_NAV_ID);
  const active = navigation.querySelector('li.active');
  if (!active) return;
  active.scrollIntoView({ block: 'center' });
}

function initTableOfContents() {
  const toc_elem = document.querySelector('.toc ol');
  if (!toc_elem) return;
  const toc = Array.from(toc_elem.querySelectorAll('li a'));
  const headers = toc.map((elem) => {
    const link = elem.href;
    const elems = link.split('#');
    return elems[elems.length - 1];
  });

  const config = {
    root: null,
    rootMargin: '0px',
    threshold: 0.5,
  };

  const VIS_CLASS = 'is-vis';
  let _prevIdx = -1;
  const observer = new IntersectionObserver((changes) => {
    const activeElem = toc_elem.querySelector(`.${ACTIVE_CLASS}`);
    if (activeElem) activeElem.classList.remove(ACTIVE_CLASS);
    for (const change of changes) {
      const headerIdx = headers.indexOf(change.target.id);
      const element = toc[headerIdx];
      if (change.isIntersecting && change.intersectionRatio >= 0.5) {
        element.classList.add(VIS_CLASS);
        _prevIdx = headerIdx;
      } else {
        element.classList.remove(VIS_CLASS);
      }
    }

    const first = Array.from(toc_elem.querySelectorAll(`.${VIS_CLASS}`))[0]; // .reverse()
    if (first) first.classList.add(ACTIVE_CLASS);

    if (!first && _prevIdx !== -1) {
      toc[_prevIdx].classList.add(ACTIVE_CLASS);
    }
  }, config);

  for (const id of headers) {
    const elem = document.getElementById(id);
    observer.observe(elem);
  }
}

const onNavArrowToggle = (e) => {
  console.log('cliiick');
  const parent = e.currentTarget.parentElement;
  e.preventDefault();
  parent.classList.toggle(EXPAND_CLASS);
};

function initNestedNavArrows() {
  const navigation = document.getElementById(MAIN_NAV_ID);
  const arrows = navigation.querySelectorAll('.nav-btn');

  for (const arrow of arrows) {
    arrow.addEventListener('click', onNavArrowToggle);
    const parent = arrow.parentElement;
    const parentIsActive = parent.classList.contains(ACTIVE_CLASS);
    const hasActiveChild = parentIsActive || parent.querySelector(`.${ACTIVE_CLASS}`) !== null;
    if (hasActiveChild) parent.classList.add(EXPAND_CLASS);
  }

  setTimeout(() => {
    navigation.classList.add('init');
  }, 500);
}

window.addEventListener('DOMContentLoaded', () => {
  initNestedNavArrows();
  scrollNavIntoView();
  initTableOfContents();
});
