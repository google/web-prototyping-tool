---
title: 'Drawer Actions'
date: Last Modified
permalink: /actions/drawer/index.html
toc: true
eleventyNavigation:
  order: 4
  parent: actions
  key: actions-drawer
  title: 'Drawer'
---

A drawer, refers to a common pattern for displaying navigation, subtasks, menus or controls on the edges of the screen. WebPrototypingTool's drawer action takes care of behaviors with a variety of options for customization to fit your prototype.

## Open Drawer

To display a drawer, simply choose a target board to show as the contents. This is based on the same principles as the [portal](/components/primitives/#portal) component. This also means that any [board navigation](/actions/navigation/#navigate-to-board) inside this drawer will be contextual unless otherwise specified.

![](/static/img/actions/drawer-hero.png)

<div class="two-col">

<img src="{{ '/static/img/actions/open-drawer.png' | url}}" >

| Property | Description                      |           Required |
| -------- | -------------------------------- | -----------------: |
| Trigger  | Event that initiates the action  |                    |
| Target   | Board whose content to display   | :white_check_mark: |
| Delay    | How long to wait before showing  |                    |
| Position | Right or left side of the screen |                    |
| Backdrop | Background color overlay         |                    |
| Width    | How wide is this drawer          |                    |

</div>

## Close Drawer

WebPrototypingTool provides a simple, specialized action for closing a drawer which will perform a close animation.

![](/static/img/actions/close-drawer.png)

::: callout
**Note:** In [preview](/basics/preview/) mode, user interactions with components such as checkboxes, dropdowns, etc. are persisted inside a drawer even after close. To reset the state of a board, attach the [reset state](/actions/state-changes/#reset-state) action.
:::


_**Note:** By default, WebPrototypingTool will automatically focus on the first focusable element when a drawer opens._
