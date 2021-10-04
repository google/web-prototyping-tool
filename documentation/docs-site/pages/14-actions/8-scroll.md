---
title: 'Scroll to Action'
date: Last Modified
permalink: /actions/scroll-to/index.html
eleventyNavigation:
  order: 8
  parent: actions
  key: actions-scroll-to
  title: 'Scroll to'
---

An action for scrolling to content within a [board](/basics/boards/) or [group of elements](/guide/layout/).

![](/static/img/actions/scroll-hero.png)

::: callout
**Note:** This action specifically depends on the **overflow** property of [element groups](/guide/layout/) and [boards](/basics/boards/) which defines how contents should scroll or be clipped.
:::

<div class="two-col">

<img src="{{ '/static/img/actions/scroll-to.png' | url}}" >

<div>

| Property | Description                                                                               |           Required |
| -------- | ----------------------------------------------------------------------------------------- | -----------------: |
| Trigger  | Event that initiates the action                                                           |                    |
| To       | Location to scroll: **Top**, **Bottom**, **Left**, **Right** or to a specific **Element** |                    |
| Target   | Select the element group or board you wish to scroll                                      | :white_check_mark: |
| Delay    | How long to wait before showing                                                           |                    |
| Animated | Should the scroll be animated?                                                            |                    |

Selecting `To: Element` changes the behavior slightly such that instead of scrolling a target container, you're scrolling to a specific element within a container.

Additionally, an `Alignment` property appears for specifying where the vertical or horizontal end state of the scroll should be.

| Alignment | Description                      |
| --------- | -------------------------------- |
| Start     | Top or Left of the container     |
| Center    | Middle of the container          |
| End       | Bottom or Right of the container |
| Nearest   | Closest edge                     |

</div>

</div>
