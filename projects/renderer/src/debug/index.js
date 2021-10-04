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

const PerfEvent = {
  JitStart: 'jit-start',
  JitEnd: 'jit-end',
  ChangeDetection: 'cd',
  RequestChangeDetection: 'request-cd',
  RequestRenderRects: 'request-rects',
  RenderRects: 'rects',
  PreviewMode: 'preview-mode',
};

const Perf = {
  Measure: 'measure',
  Mark: 'mark',
  Resource: 'resource',
};

const colorMap = {
  [PerfEvent.JitStart]: '#FF4848',
  [PerfEvent.JitEnd]: '#FE9859',
  [PerfEvent.ChangeDetection]: '#75CBF7',
  [PerfEvent.RequestChangeDetection]: '#478FB4',
  [PerfEvent.RequestRenderRects]: '#4A9D86',
  [PerfEvent.RenderRects]: '#87FFDE',
  [PerfEvent.PreviewMode]: '#FF6FBB',
};

const labelMap = {
  [PerfEvent.JitStart]: 'Jit Compilation Start',
  [PerfEvent.JitEnd]: 'Jit Compilation End',
  [PerfEvent.ChangeDetection]: 'Change Detection',
  [PerfEvent.RequestChangeDetection]: 'Request Change Detection',
  [PerfEvent.RequestRenderRects]: 'Request Render Rects',
  [PerfEvent.RenderRects]: 'Render Rects',
  [PerfEvent.PreviewMode]: 'Preview Mode',
};

const entryTypesColor = {
  [Perf.Measure]: '#F8FF87',
  [Perf.Mark]: '#FFB96F',
  [Perf.Resource]: '#B28DFF',
};

const CELL_SIZE = 6;
const GAP = 2;

function addItem(template, name, colorValue, dataId) {
  const item = template.content.cloneNode(true);
  item.querySelector('li').dataset.id = dataId;
  const color = item.querySelector('div');
  const label = item.querySelector('span');
  color.style.background = colorValue;
  label.textContent = name;
  return item;
}

function buildLegend() {
  const template = document.getElementById('legend-item');
  const ul = document.createElement('ul');

  for (const name of Object.values(PerfEvent)) {
    const li = addItem(template, labelMap[name], colorMap[name], name);
    ul.appendChild(li);
  }
  const res = addItem(template, 'Resource', entryTypesColor[Perf.Resource], Perf.Resource);
  ul.appendChild(res);
  document.body.appendChild(ul);
}

function init() {
  buildLegend();

  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const renderChannel = new BroadcastChannel('render-channel');
  //////////////////////////////////////////////////////
  let _activeItem = undefined;
  const entries = [];

  const ul = document.querySelector('ul');
  ul.addEventListener('mouseover', (e) => {
    const target = e.target.closest('li');
    const activeItem = target?.dataset?.id;
    if (_activeItem !== activeItem) {
      _activeItem = activeItem;
      render();
    }
  });
  ul.addEventListener('mouseleave', (e) => {
    _activeItem = undefined;
    render();
  });

  const render = () => {
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    const offset = entries.length * (CELL_SIZE + GAP) - width;
    const alphaState = _activeItem === undefined ? 1 : 0.4;
    ctx.globalAlpha = alphaState;

    for (let i = 0; i < entries.length; i++) {
      const item = entries[i];

      const x = (CELL_SIZE + GAP) * i - offset;
      if (x < -GAP) continue;
      for (let j = 0; j < item.length; j++) {
        const entry = item[j];
        if (entry.name === _activeItem || entry.entryType === _activeItem) {
          ctx.globalAlpha = 1;
        }
        const style = colorMap[entry.name] || entryTypesColor[entry.entryType] || 'red';
        ctx.fillStyle = style;

        const y = height - (CELL_SIZE + GAP) * j - CELL_SIZE;

        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);

        ctx.globalAlpha = alphaState;
      }
    }
    ctx.globalAlpha = 1;
  };

  renderChannel.onmessage = ({ data }) => {
    entries.push(data);
    render(entries);
  };
}
