---
title: Components
date: Last Modified
permalink: /components-guide/index.html
eleventyNavigation:
  key: components
  title: Components
  order: 9
---

WebPrototypingTool utilizes components backed by web technology to accelerate prototyping and shorten the feedback loop with engineering. Instead of working with static graphics, prototypes built with WebPrototypingTool are dynamic, responsive and accessible from the beginning. To get started, click the <i class="ico btm">add</i> icon or use the [shortcut](/basics/shortcuts/) key `C` to toggle open the panel, then **drag** the component to a [board](/basics/boards/) to add it.

![](/static/img/components/comp-panel.png)

## Types

There are four distinct types of components available:

| Type                                                                       | Description                                                           |        Marketplace |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------- | -----------------: |
| [Primitives](/components/primitives/)                                      | Basic building blocks and simple components                           |                    |
| [Material](/components/material/)                                           | Common Material components                                  |                    |
| [Composed Components](/components/composed/)                               | User defined component compositions, sometimes referred to as Symbols | :white_check_mark: |
| [Code Components](/components/code-components/)                            | User uploaded component written in code                               | :white_check_mark: |

User defined components can be used across projects and shared via the [Marketplace](/components/marketplace).

## Properties

At the top of a component's properties are tabs for specialized tasks -- Default properties, [Actions](/actions/), [Accessibility](/accessibility/), and [CSS + Attribute overrides](/beyond-the-basics/component-overrides/).

![](/static/img/components/comp-tabs.png)

Every component has properties that allow for configuring size, position, styles and other inputs. Below is a sample of the most common properties and their description.

<div class="two-col">

<img src="{{ '/static/img/components/standard-props.png' | url}}" >

| Property       | Description                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------------- |
| Width & Height | Size of the container for this component                                                                       |
| Position       | Relative or Absolute position. See [layout](/guide/layout/) for more details                                   |
| Radius         | Border radius, also known as corner radius, defines how the corners are rounded                                |
| Opacity        | Component transparency                                                                                         |
| Tooltip        | When added, shows a Material tooltip on mouse over                                                             |
| Border         | Border size, color and style                                                                                   |
| Shadow         | Shadows can be added to some components                                                                        |
| Cursor         | Different types of cursor to show on mouse over                                                                |
| Z Index        | Override the layer order based on the [CSS property](https://developer.mozilla.org/en-US/docs/Web/CSS/z-index) |
| Hidden         | Hide this component ( <i class="ico btm">visibility</i> can also be done from the layers tree )                |

</div>

## Overrides

Under the hood, WebPrototypingTool uses [CSS](https://developer.mozilla.org/en-US/docs/Web/CSS) and element [attributes](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes) to define how components are displayed. Anyone looking for more flexibility can override these values or peek under the hood to see what is applied. [Learn more](/beyond-the-basics/component-overrides/)

![](/static/img/components/component-overrides.png)
