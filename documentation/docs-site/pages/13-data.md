---
title: Data Sources & Binding
date: Last Modified
permalink: /data/index.html
toc: true
eleventyNavigation:
  key: data
  title: Data
  order: 13
---

[json-data]: https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/JSON

Designing with data allows for more realistic prototypes and user scenarios. With WebPrototypingTool, components can be bound to imported data sources or the properties on [other components](#component-binding).

![](/static/img/data/data-hero.png)

## Data panel

To get started, click the <i class="ico btm">insert_chart_outlined</i> icon or use the [shortcut](/basics/shortcuts/) key `D` to toggle open the panel. Click the add button in the top right of the panel to upload a new data source, choose from a preset or write your own within the tool. Currently only [JSON][json-data] data is supported, utilizing the provided [import methods](#import-methods).

![](/static/img/data/data-panel.png)

::: callout
**Caution:** Large datasets may significantly slow down the editor and prototype. The maximum size allowed is 512 KB but for best results avoid exceeding 30 KB.
:::

### Import methods

| Source            | Description                                                             |
| ----------------- | ----------------------------------------------------------------------- |
| Direct input      | Hand-write a JSON object                                                |
| Upload JSON file  | Upload a JSON file already on your computer                             |
| Sample table data | Choose from a list of provided table datasets                           |
| External source   | See the below table for a list of [external sources](#external-sources) |

Once data has been added, click the name in the panel to display the content in a tree view. To edit the content, click the <i class="ico btm">edit</i> button in the upper right corner. If more space is needed for editing, use the <i class="ico btm">open_in_full</i> to expand the overlay.

@[video](/static/img/data/data-edit.webm)

WebPrototypingTool will attempt to automatically fix invalid [JSON][json-data] as you type however, keep an eye on the <i class="ico btm">checked</i> validation notification in the bottom left since invalid code **will not be saved**. When editing is complete, click the **update** button to save changes.

## External sources

The following are the external sources supported for importing JSON data into your project.

<div class="two-col">

<img src="{{ '/static/img/data/data-external-sources.png' | url}}" >

| Source        | Description                                |
| ------------- | ------------------------------------------ |
| URL           | Import from a simple HTTP _Get_ request    |
| Google Sheets | Import Google Sheet data as a JSON dataset |

</div>

### URL

This option enables you to import data from a simple HTTP _Get_ request.

@[video](/static/img/data/data-url-source.webm)

## Using data

To use data, select a component and hover over inputs in the properties panel; those which support binding will show a <i class="ico btm">add_box</i> button beside the label. Click the button to reveal a picker and select a data source.

Click a **key** within the data source to create the binding designated by a chip appearing on the input field.

@[video](/static/img/data/data-use.webm)

Some inputs only accept specific value types from a data source. For example, a checkbox accepts a **boolean** to specify a checked state. Most inputs accept simple value types such as **strings**, **numbers** and **booleans** but choosing an object (nested structure) or array may result in seeing `[Object Object]` in the output.

<!-- Items inside an array will display a numeric index when viewing from the tree. -->

![](/static/img/data/data-incompatible.png)

There are a few components that may accept objects such as [code components](/components/code-components/). To use the entire data source as the binding select the top most node in the tree.

![](/static/img/data/data-top-level.png)

## Component binding

In addition to binding to data sources, the states of a component can be bound togethers by selecting the `Project elements` data source in the picker. Components that support output [actions](/actions/) for specific values will be linked in both directions.

@[video](/static/img/data/data-binding.webm)


## Rich Text

Use data binding with [Rich Text](/components/primitives/#text) to dynamically update content based on user input or behaviors.

@[video](/static/img/data/data-richtext.webm)


