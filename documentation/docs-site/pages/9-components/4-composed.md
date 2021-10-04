---
title: Composed Components
date: Last Modified
permalink: /components/composed/index.html
toc: true
eleventyNavigation:
  key: composed
  title: Composed
  parent: components
  order: 4
---

<!-- <i class="ico btm">thermostat_carbon</i> -->

Composed components are user defined, reusable instances composed of other components sometimes referred to as Symbols in other tools. Changes made to these components will update everywhere it is used within a project. To create one, simply multi-select within a [board](/basics/boards/) and click <svg class="ico" ><use xlink:href="#svg-symbol" /></svg> in the top bar or use the right click menu.

@[video](/static/video/composed.webm)

When created, a composed component appears in the `Custom` section of the **Components** panel where it can be dragged to the design surface to create new instances. In the layers tree these components can be identified by the <span style="color:#4998ff"> <i class="ico btm">thermostat_carbon</i> icon</span>.

![](/static/img/components/composed-custom.png)

## Overrides

Composed components expose overrides for some of their children's properties. Each override is grouped by child with a switch to toggle visibility.

<!-- @[video](/static/video/customize-composed.webm) -->

<div class="two-col">

<img src="{{ '/static/img/components/overrides.png' | url}}" >

| Child                                    | Exposed properties       |
| ---------------------------------------- | ------------------------ |
| [Button](/components/material/#button)   | Label text               |
| [Icon](/components/primitives/#icon)     | Icon & color             |
| [Image](/components/primitives/#image)   | Image source             |
| [Portal](/components/primitives/#portal) | Portal source            |
| [Text](/components/primitives/#text)     | Rich or Plain Text value |

</div>

## Editing

To edit a composed component, **double-click** any instance on the design surface, components panel or use the right click menu. Editing is done in isolation which only shows component and new boards cannot be added in this mode.

![](/static/img/components/composed-isolation.png)

If a checkerboard background is visible, this means a component's background is transparent. The component will inherit styles, such as size and background color, from when it was created. The **initial size** property defines the dimensions of a component when added to a board, after adding users can make adjustments to each instance.

When finished, click the `Finish editing` button in the top bar to return to the project and all changes will propagate to all instances.

## Actions

Composed components support a special [action](/actions/) property called `From` which provides a way to select a child as the trigger. This is the preferred way to add an action to a composed component rather than adding an action from within the instance itself to avoid issues when [publishing](#publishing).

![](/static/img/actions/composed-action.png)

## Tips & Tricks

- Avoid nesting composed components as it may cause a prototype to run slower. (we're working on a fix)
- Avoid deeply nested portals, or components that use portals such as tabs, within a composed component as it may cause a prototype to run slower.
- Use empty [Portals](/components/primitives/#portal) inside components so each instance can be assigned individually.

## Publishing

Composed components can be used across multiple projects and shared with others by publishing to the [marketplace](/components/marketplace/). To publish a component, **double-click** any instance to enter [edit](#editing) mode then click the publish button in the top bar.

@[video](/static/video/publish.webm)

Deselect the composed component board to see the published details in the properties panel on the right. Making edits to a component after publishing will not be reflected in the marketplace until a new version is published.

## Detaching

To convert a component back into a group of elements, right click on the component and select **detach.**

![](/static/img/components/detached.png)
