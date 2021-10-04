---
title: 'Run JS Code Action'
date: Last Modified
permalink: /actions/runjs/index.html
eleventyNavigation:
  order: 9
  parent: actions
  key: actions-runjs
  title: 'Run JS Code'
---

For added flexibility there is an advanced action to run custom JavaScript code. This can be used to target a specific component and modify styles, or to call public functions on [code components](/components/code-components) or native elements like [video](/components/primitives/#media).

::: callout
**Warning**: This advanced feature may cause the app to freeze or break if your code has errors.
:::

<!-- ![](/static/img/actions/runjs-overview.png) -->

<div class="two-col">

<img src="{{ '/static/img/actions/runjs.png' | url}}" >

| Property                        | Description                                                                      |
| ------------------------------- | -------------------------------------------------------------------------------- |
| Trigger                         | Event that initiates the action                                                  |
| Delay                           | How long to wait before executing                                                |
| Target                          | Another element on the board. Defaults to the action's element (self) if not set |
| Script                          | The code to execute                                                              |
| <i class="ico">check</i>        | Tells you if the code is valid, but may not catch runtime errors                 |
| <i class="ico">open_in_full</i> | Expands the script editor to fullscreen                                          |

</div>
 
`self` and `target` are reserved variables within the script's scope which refer to the selected element and the configured target element respectively.

## Demo

The above example targets the [media element](/components/primitives/#media) to start playing a video:

```js
target.play();
```

Showing a native alert is done with:

```js
alert('hello google');
```

Starting a timer that updates text inside an element:

```js
let count = 100;
let timer = setInterval(() => {
  target.innerText = String(count);
  count--;
  if (count === 0) {
    clearInterval(timer);
  }
}, 100);
```

## Prototype State API

The underlying data model of a prototype can be accessed using the [State API](/beyond-the-basics/state-api/) which is attached to the global scope and prefixed by the keyword `api`.

```ts
// Current project state
api.getProjectState();

// All datasets within the project
api.getProjectData();

// Get the object model for the target
api.getComponentState(target);

// Set the value of an input on a component
api.setInputForComponent(id, inputName, value);

// and more...
```

[Click here](/beyond-the-basics/state-api/) for the full list of exposed methods...
