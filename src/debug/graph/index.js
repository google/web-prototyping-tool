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

const channel = new BroadcastChannel('graph-channel');
const BOARD_COLOR = '#b47cff';
const SYMBOL_COLOR = '#FFF04D';
const SYMBOL_INSTANCE_COLOR = '#7BE882';
const PORTAL_COLOR = '#FC70FF';
const ELEMENT_COLOR = '#57C4FF';
const GRAPH_OPTIONS = {
  nodes: {
    shape: 'box',
    margin: { top: 4, right: 12, bottom: 2, left: 12 },
  },
  layout: {
    hierarchical: {
      enabled: true,
      sortMethod: 'directed',
      shakeTowards: 'roots',
      treeSpacing: 10,
    },
  },
  physics: {
    enabled: true,
    repulsion: {
      nodeDistance: 100,
    },
    hierarchicalRepulsion: {
      avoidOverlap: 1,
      nodeDistance: 100,
    },
  },
};

let currentGraphType = 'dependencies';

document.addEventListener('DOMContentLoaded', () => init());

function showElementDetails(elementJson) {
  if (!elementJson) return;
  const jsonString = JSON.stringify(elementJson, null, 4);
  const el = document.getElementById('elementDetailsJson');
  el.classList.add('hidden');
  el.innerHTML = jsonString;
  hljs.highlightBlock(el);
  el.classList.remove('hidden');
  document.getElementById('elementDetails').classList.remove('hidden');
}

function closeElementDetails() {
  document.getElementById('elementDetails').classList.add('hidden');
}

function hideSpinner() {
  document.getElementById('spinner').classList.add('hidden');
  document.getElementById('graph').classList.remove('transparent');
}

function showSpinner() {
  document.getElementById('graph').classList.add('transparent');
  document.getElementById('spinner').classList.remove('hidden');
}

function init() {
  const container = document.getElementById('graph');
  const initialData = { nodes: [], edges: [] };
  const network = new vis.Network(container, initialData, GRAPH_OPTIONS);
  let project, elementProperties;

  network.on('selectNode', function (params) {
    const selectedNode = params.nodes && params.nodes[0];
    if (!selectedNode || !elementProperties) return;
    showElementDetails(elementProperties[selectedNode]);
  });

  network.on('deselectNode', function (params) {
    closeElementDetails();
  });

  network.on('afterDrawing', function (params) {
    hideSpinner();
  });

  function getColor(elementType) {
    if (elementType === 'Board') return BOARD_COLOR;
    if (elementType === 'Symbol') return SYMBOL_COLOR;
    if (elementType === 'SymbolInstance') return SYMBOL_INSTANCE_COLOR;
    if (elementType === 'BoardPortal') return PORTAL_COLOR;
    if (elementType === 'Tabs') return PORTAL_COLOR;
    if (elementType === 'Stepper') return PORTAL_COLOR;
    if (elementType === 'ExpansionPanel') return PORTAL_COLOR;
    return ELEMENT_COLOR;
  }

  function setGraphData(nodes, edges) {
    const nodeDataset = new vis.DataSet();
    nodeDataset.add(nodes);

    const edgeDataset = new vis.DataSet();
    edgeDataset.add(edges);

    const data = {
      nodes: nodes,
      edges: edges,
    };
    network.setData(data);
  }

  function hasDependencies(props) {
    const { elementType } = props;
    return (
      elementType === 'SymbolInstance' ||
      elementType === 'BoardPortal' ||
      elementType === 'Tabs' ||
      elementType === 'Stepper' ||
      elementType === 'ExpansionPanel'
    );
  }

  function calcDependenciesOfRoot(rootProps, elementProperties) {
    const allElements = Object.values(elementProperties);
    const childElementsWithDependencies = allElements.filter(
      (item) => item.rootId === rootProps.id && hasDependencies(item)
    );

    const dependencyIdSet = childElementsWithDependencies.reduce((acc, currChild) => {
      const { referenceId, childPortals } = currChild.inputs;
      if (referenceId) {
        acc.add(referenceId);
      } else if (childPortals && childPortals.length > 0) {
        for (const childPortal of childPortals) {
          if (childPortal.value) acc.add(childPortal.value);
        }
      }
      return acc;
    }, new Set());

    return Array.from(dependencyIdSet);
  }

  function calcDependencyGraph(project, elementProperties) {
    const allRoots = [...project.boardIds, ...project.symbolIds];
    const nodes = allRoots.map((id) => {
      const { name, elementType } = elementProperties[id];
      const color = getColor(elementType);
      return { id, label: name, color };
    });

    let edgeCount = 0;
    const edges = allRoots.reduce((acc, rootId) => {
      const props = elementProperties[rootId];
      if (!props) return acc;
      const dependencyIds = calcDependenciesOfRoot(props, elementProperties);
      for (const id of dependencyIds) {
        acc.push({ id: edgeCount++, from: rootId, to: id, arrows: 'to' });
      }
      return acc;
    }, []);

    return [nodes, edges];
  }

  function calcProjectGraph(_project, elementProperties) {
    const allElements = Object.values(elementProperties);
    const nodes = allElements.map((el) => {
      const { id, name, elementType } = el;
      const color = getColor(elementType);
      return { id, label: name, color };
    });

    let edgeCount = 0;
    const edges = allElements.reduce((acc, el) => {
      const { id, referenceId, childIds, childPortals } = el;
      const children = childIds || [];
      for (const childId of children) {
        acc.push({ id: edgeCount++, from: id, to: childId, arrows: 'to' });
      }
      if (referenceId) {
        acc.push({ id: edgeCount++, from: id, to: referenceId, arrows: 'to' });
      }
      if (childPortals) {
        for (const portal of childPortals) {
          acc.push({ id: edgeCount++, from: id, to: portal.value, arrows: 'to' });
        }
      }

      return acc;
    }, []);

    return [nodes, edges];
  }

  function calcGraphData() {
    let nodes = [],
      edges = [];
    if (project && elementProperties) {
      if (currentGraphType === 'dependencies') {
        [nodes, edges] = calcDependencyGraph(project, elementProperties);
      } else {
        [nodes, edges] = calcProjectGraph(project, elementProperties);
      }
    }
    setGraphData(nodes, edges);
  }

  function updateGraph(data) {
    project = data.project;
    elementProperties = data.elementProperties;
    calcGraphData();
  }

  function requestUpdate() {
    channel.postMessage({ graphUpdateRequest: true });
  }

  function onGraphTypeChange(e) {
    showSpinner();

    currentGraphType = e.target.value;
    calcGraphData();
  }

  function drawLegend() {
    const legendContainer = document.getElementById('legend');
    legendContainer.innerHTML = '';

    const legendItems = [
      { color: BOARD_COLOR, name: 'Board' },
      { color: SYMBOL_COLOR, name: 'Component Definition' },
      { color: SYMBOL_INSTANCE_COLOR, name: 'Component Instance' },
      { color: PORTAL_COLOR, name: 'Board Portal' },
      { color: ELEMENT_COLOR, name: 'Element' },
    ];

    for (const { color, name } of legendItems) {
      const item = document.createElement('div');
      item.setAttribute('class', 'legend-item');

      const itemColorBlock = document.createElement('div');
      itemColorBlock.setAttribute('class', 'legend-item-color-block');
      itemColorBlock.style.backgroundColor = color;
      item.appendChild(itemColorBlock);

      const itemText = document.createTextNode(name);
      item.appendChild(itemText);

      legendContainer.appendChild(item);
    }
  }

  document.getElementById('closeButton').addEventListener('click', closeElementDetails);
  document.getElementById('updateButton').addEventListener('click', requestUpdate);
  document
    .querySelectorAll('input')
    .forEach((i) => i.addEventListener('change', onGraphTypeChange));
  channel.onmessage = ({ data }) => updateGraph(data);

  drawLegend();
  requestUpdate();
}
