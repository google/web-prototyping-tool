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

(function (window, document) {
  const path = document.body.dataset.path;
  const HIDDEN_CLASS = 'hidden';
  const SEARCH_FIELD_ID = 'searchField';
  const SEARCH_RESULTS_ID = 'search-results';
  const NO_RESULTS_ID = 'no-results-found';
  const SEARCH_JSON_PATH = path + 'search-index.json';

  const fetchSearchData = () => {
    return fetch(SEARCH_JSON_PATH).then((response) =>
      response.json().then((rawIndex) => {
        return elasticlunr.Index.load(rawIndex);
      })
    );
  };

  const onSearch = async (e) => {
    if (!window.searchIndex) {
      window.searchIndex = await fetchSearchData();
    }

    const config = { bool: 'OR', expand: true };
    const query = e.target.value;
    const results = window.searchIndex.search(query, config);
    const searchBox = document.getElementById(SEARCH_FIELD_ID);
    const resEl = document.getElementById(SEARCH_RESULTS_ID);
    const noResultsEl = document.getElementById(NO_RESULTS_ID);

    searchBox.addEventListener('focus', (event) => {
      event.target.classList.remove(HIDDEN_CLASS);
      resEl.classList.remove(HIDDEN_CLASS);
    });

    document.addEventListener('click', (event) => {
      const isClickInside = searchBox.contains(event.target);
      if (!isClickInside) {
        console.log(HIDDEN_CLASS);
        resEl.classList.add(HIDDEN_CLASS), noResultsEl.classList.add(HIDDEN_CLASS);
        noResultsEl.classList.add(HIDDEN_CLASS);
      }
    });

    resEl.innerHTML = '';

    if (query != '') {
      if (results != '') {
        console.log('results!', results);
        noResultsEl.classList.add(HIDDEN_CLASS);
        resEl.classList.add('p-4');
        results.map((r) => {
          const { id, title, description, content } = window.searchIndex.documentStore.getDoc(
            r.ref
          );
          const header = query.replaceAll(' ', '-');
          const exactmatch = content.includes(`id="${header}"`);
          const el = document.createElement('li', { tabindex: '-1' });
          resEl.appendChild(el);

          const a = document.createElement('a');
          const href = path + id.substr(1) + (exactmatch ? '#' + header : '');
          a.setAttribute('href', href);
          a.textContent = title;
          el.appendChild(a);
        });
      } else {
        noResultsEl.classList.remove(HIDDEN_CLASS);
      }
    } else {
      noResultsEl.classList.add(HIDDEN_CLASS);
    }
  };

  const searchFiled = document.getElementById(SEARCH_FIELD_ID);
  searchFiled.addEventListener('input', onSearch);
})(window, document);
