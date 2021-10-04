---
title: State API
date: Last Modified
permalink: /beyond-the-basics/state-api/index.html
toc: true
eleventyNavigation:
  key: state-api
  title: State API (advanced)
  order: 19
---

The state of a prototype can be accessed from within [code components](/components/code-components/) or a [runJS action](/actions/runjs/) using the State API which is attached to the **global scope** and prefixed by the keyword `api`.

### getProjectState

Returns a flat object containing the entire prototype state for every element on every board.

```ts
api.getProjectState();
```

### getProjectData

Returns an object containing every [dataset](/data/).

```ts
api.getProjectData();
```

### getProjectBoards

Returns an array containing the state of every [board](/basics/boards/).

```ts
api.getProjectBoards();
```

### getProjectImageAssets

Returns an array containing every [image asset](/assets).

```ts
api.getProjectImageAssets();
```

Below is an example of what is returned:

```json
[
  {
    "id": "ScxkDGjIuYiv5Bicbqd5",
    "name": "App logo",
    "width": 264,
    "height": 255
  },
  {
    "id": "ScxkHluSKJMmzwzRlmYw",
    "name": "Home icon",
    "width": 85,
    "height": 238
  }
]
```

**Example:** If you wanted to update the src for an [Image](/components/primitives/#image)

```ts
const elem = api.getComponentState(target);
const assets = api.getProjectImageAssets();
const logo = assets.find((asset) => asset.name === 'logo');
api.setInputForComponent(elem.id, 'src', { id: logo.id });
```

### getDatasetDataForId

Returns a specific [dataset](/data/) for an Id.

```ts
api.getDatasetDataForId(datasetId:string);
```

### setDatasetData

Sets the data for a specific [dataset](/data/) Id. Data should be either an object or an array.

```ts
api.setDatasetData(datasetId:string, data: {} | []);
```

<br />

::: callout
**Tip** Click the `Copy Id` button in the overflow menu of a dataset to copy its Id to your clipboard.
:::

![](/static/img/data/data-copy-dataset-id.png)

### getComponentStateForId

Returns the state of a component for a given Id.

```ts
api.getComponentStateForId(id:string)
```

### getComponentState

Returns the state of the current component.

```ts
api.getComponentState(elem: HTMLElement)
```

- To use this from inside a [web component](/components/code-components/) pass in `this`
- To use with [runJS action](/actions/runjs/) pass in `target`

### getComponentsOnCurrentBoard

Pass in the current element to get teh state for components on the current board.

```ts
api.getComponentsOnCurrentBoard(elem: HTMLElement)
```

- To use this from inside a [web component](/components/code-components/) pass in `this`
- To use with [runJS action](/actions/runjs/) pass in `target`

### setInputForComponent

Set the value of an input for a component based on Id.

```ts
api.setInputForComponent(id: string, inputName: string, value: any)
```

::: callout
**Caveat:** This does not currently work with instances of symbols
:::

**Example:** If you wanted to update the label of a [Button](/components/material/#button) has the following `inputs`:

```json
{
  "id": "BOeiQbqfFJPBce41q8pA", // Component Id
  "inputs": {
    "label": "Button",
    "color": "primary",
    "hidden": false,
    "small": false,
    "iconRightSide": false,
    "disabled": false,
    "variant": "Raised"
  }
}
```

To change the button's label from "Button" to "Foo" with the following:

```ts
api.setInputForComponent('BOeiQbqfFJPBce41q8pA', 'label', 'Foo');
```

### setStyleForComponent

Set the value of a specific CSS style for a component based on id.

```ts
api.setStyleForComponent(id: string, styleName: string, value: any);
```

::: callout
**Caveat:** This does not currently work with instances of symbols
:::

**Example:** If you wanted to update the background of an element:

```ts
api.setStyleForComponent('BOeiQbqfFJPBce41q8pA', 'background', 'red');
```

### addProjectStateListener

Listen for prototype state changes and return current prototype state. Note that this will get removed when navigating between boards.

```ts
api.addProjectStateListener((state) => {
  console.log(state);
});
```

### removeProjectStateListener

Manually unsubscribe from project state changes, this requires holding a reference to the callback method

```ts
api.removeProjectStateListener(onChangesCallback);
```

Below is an example of subscribing / unsubscribing within a [web component](/components/code-components/)

```ts
class MyCustomElement extends HTMLElement {
  // Callback must be an arrow function
  onProjectStateChanges = (state) => {
    console.log(state);
  };

  /** Lifecycle hook for when this component is created */
  connectedCallback() {
    api.addProjectStateListener(this.onProjectStateChanges);
  }

  /** Lifecycle hook for when this component is removed */
  disconnectedCallback() {
    api.removeProjectStateListener(this.onProjectStateChanges);
  }
}
```

### navigateToBoard

Perform a navigation event to a specific board. `To` is the id for the board you wish to navigate to. If your navigation occurs inside a [portal](/components/primitives/#portal) you must specify a `from` which is the current html element. For [runJS action](/actions/runjs/) that is `self` for a [code components](/components/code-components/) use `this`. Use the third argument to force navigation to occur at the root level.

```ts
api.navigateToBoard(to: string, from?: HTMLElement, top?: boolean);
```

Examples

```ts
// RunJS
api.navigateToBoard(to: 'sOTs9qvcAm6zxjfVqX3T', from: self);

// Code component
api.navigateToBoard(to: 'sOTs9qvcAm6zxjfVqX3T', from: this);
```

### Tip: Finding Component IDs

Many of the above functions require the ids of the components and boards within a project. An easy way to find the ids for any given component is by going to [settings](/beyond-the-basics/settings/), toggle the **advanced** switch and selecting **Show element IDs**.

![](/static/img/beyond/show-ids.png)

Once checked, select a component and open the **code tab** in the properties panel to copy its id.

## Sample

In the demo below a [runJS action](/actions/runjs/) is attached to the red button which updates all button labels within this prototype.


```ts
const state = api.getProjectState();

for (let elem of Object.values(state)) {
  if (elem.elementType !== 'Button') continue;
  api.setInputForComponent(elem.id, 'label', 'Update!');
}
```

