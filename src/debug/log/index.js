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

document.addEventListener('DOMContentLoaded', () => init());
const inboundChannel = new BroadcastChannel('in-channel');
const outboundChannel = new BroadcastChannel('out-channel');
const SCROLL_THRESHOLD = 40;
const MAX_ITEMS = 250;
const LOCALE_TIME = 'en-US';
const ACTIVE_CLASS = 'active';
const SAME_CLASS = 'same';
const LIST_ITEM = 'li';

let _refMap = new WeakMap();
let _scrollToBottom = true;
let _filter = '';
let _currentHash = '';

const getElem = (id) => document.getElementById(id);
const createElem = (tagName) => document.createElement(tagName);

const getIdRef = (data) => {
  if (data.rootId) return data.rootId;
  if (data.changes) return Object.keys(data.changes)[0];
  return '';
};

const filterList = (list, filter) => {
  for (let child of list.children) {
    const includes = child.dataset.name.includes(filter);
    child.style.display = includes ? '' : 'none';
  }
};

const checkHash = (list, hash) => {
  const sameList = list.querySelectorAll(`li[data-hash="${hash}"]`);
  sameList.forEach((item) => {
    if (item.classList.contains(ACTIVE_CLASS) === true) return;
    item.classList.add(SAME_CLASS);
  });
};

const checksum = (data) => {
  const str = JSON.stringify(data);
  return str.split('').reduce((acc, char) => {
    acc = (acc << 5) - acc + char.charCodeAt(0);
    return acc & acc;
  }, 0);
};

function init() {
  const list = getElem('list');
  const listItem = createElem(LIST_ITEM);
  const span = createElem('span');
  const scroller = getElem('scroller');
  const content = getElem('content');
  const search = getElem('search');
  const copyBtn = getElem('copy');
  const clearBtn = getElem('clear');

  function generateItem(data, inbound) {
    const li = listItem.cloneNode();
    const spanTitle = span.cloneNode();
    const spanTime = span.cloneNode();
    const suffix = getIdRef(data);
    const prefix = inbound ? '⇨' : '⬅';
    const title = `${data.name} ${suffix}`;

    spanTitle.textContent = `${prefix} ${title}`;
    spanTime.classList.add('time');
    spanTime.textContent = new Date().toLocaleTimeString(LOCALE_TIME);
    li.appendChild(spanTitle);
    li.appendChild(spanTime);
    li.dataset.hash = checksum(data);
    li.dataset.name = title.toLowerCase();
    list.appendChild(li);
    _refMap.set(li, data);

    if (list.children.length > MAX_ITEMS) {
      _refMap.delete(list.firstChild);
      list.firstChild.remove();
    }

    if (_scrollToBottom) li.scrollIntoView();

    filterList(list, _filter);
    checkHash(list, _currentHash);
  }

  function clearActive() {
    const active = list.querySelector(`.${ACTIVE_CLASS}`);

    if (active) {
      active.classList.remove(ACTIVE_CLASS);
    }
  }

  function selectItem(target) {
    clearActive();

    target.classList.add(ACTIVE_CLASS);
    content.textContent = JSON.stringify(_refMap.get(target), null, 2);
    list.querySelectorAll(`.${SAME_CLASS}`).forEach((item) => item.classList.remove(SAME_CLASS));
    _currentHash = target.dataset.hash;

    checkHash(list, _currentHash);
  }

  function copyItemContents() {
    if (copyBtn.classList.contains(ACTIVE_CLASS)) return;
    window.navigator.clipboard.writeText(content.textContent).then(() => {
      copyBtn.classList.add(ACTIVE_CLASS);
      setTimeout(() => copyBtn.classList.remove(ACTIVE_CLASS), 1000);
    });
  }

  document.onkeydown = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const dIndex = e.key === 'ArrowDown' ? 1 : -1;
      const active = list.querySelector(`.${ACTIVE_CLASS}`);
      const children = [...list.children];
      const filteredChildren = children.filter((child) => child.style.display !== 'none');

      if (children.length > 0 || active) {
        const activeIndex = children.indexOf(active);
        const totalItems = children.length - 1;
        let newIndex = 0;

        if (active) {
          if (_filter) {
            search.blur();

            const filteredIndex = filteredChildren.indexOf(active);
            newIndex = children.indexOf(filteredChildren[filteredIndex + dIndex]);

            const firstFilteredChildIndex = children.indexOf(filteredChildren[0]);
            const lastFilteredChildIndex = children.indexOf(
              filteredChildren[filteredChildren.length - 1]
            );

            if (newIndex < firstFilteredChildIndex)
              newIndex = dIndex === 1 ? lastFilteredChildIndex : firstFilteredChildIndex;
            if (newIndex > lastFilteredChildIndex) newIndex = lastFilteredChildIndex;
          } else {
            newIndex = Math.min(totalItems, Math.max(activeIndex + dIndex, 0));
          }
        } else {
          if (_filter) {
            newIndex = children.indexOf(filteredChildren[0]);
          }
        }

        selectItem(children[newIndex]);
      }
    } else if (e.key === '/') {
      e.preventDefault();
      search.focus();
    } else if (e.target === search) {
      if (e.key === 'Escape' && search.value === '') {
        search.blur();
      }
    } else if (e.key === 'c' && e.metaKey) {
      const active = list.querySelector(`.${ACTIVE_CLASS}`);

      if (active) {
        copyItemContents();
      }
    }
  };

  list.onclick = (e) => {
    const target = e.target.closest(LIST_ITEM);
    if (!target) return;

    selectItem(target);
  };

  search.oninput = () => {
    _filter = search.value.toLowerCase();
    filterList(list, _filter);
  };

  search.onfocus = () => {
    clearActive();
    content.textContent = '';
  };

  clearBtn.onclick = () => {
    _filter = '';
    _currentHash = '';
    _refMap = new WeakMap();
    _scrollToBottom = true;
    list.innerHTML = '';
    content.textContent = '';
  };

  copyBtn.onclick = () => {
    copyItemContents();
  };

  scroller.onscroll = () => {
    _scrollToBottom =
      scroller.scrollTop > scroller.scrollHeight - scroller.clientHeight - SCROLL_THRESHOLD;
  };

  inboundChannel.onmessage = ({ data }) => generateItem(data, true);
  outboundChannel.onmessage = ({ data }) => generateItem(data, false);
}
