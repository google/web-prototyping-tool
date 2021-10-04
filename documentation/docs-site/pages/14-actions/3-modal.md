---
title: 'Modal Actions'
date: Last Modified
permalink: /actions/modal/index.html
toc: true
eleventyNavigation:
  order: 3
  parent: actions
  key: actions-modal
  title: 'Modal'
---

A modal, also known as a dialog or popup, refers to a common pattern for displaying content. WebPrototypingTool's modal action takes care of behaviors with a variety of customization options.

## Present Modal

To present a modal, simply choose a target board to show as the contents. This is based on the same principles as the [portal](/components/primitives/#portal) component. This also means that any [board navigation](/actions/navigation/#navigate-to-board) inside this modal will be contextual unless otherwise specified.

![](/static/img/actions/present-modal-hero.png)

<div class="two-col">

<img src="{{ '/static/img/actions/present-modal.png' | url}}" >

| Property  | Description                                                                  |           Required |
| --------- | ---------------------------------------------------------------------------- | -----------------: |
| Trigger   | Event that initiates the action                                              |                    |
| Target    | Board content to display                                                     | :white_check_mark: |
| Delay     | How long to wait before showing                                              |                    |
| Size      | Dimensions of the modal which defaults to match the size of the target board |                    |
| Backdrop  | Background color overlay                                                     |                    |
| Elevation | Available drop shadow for the modal                                          |                    |
| Radius    | Border radius of the modal                                                   |                    |

</div>

## Exit Modal

WebPrototypingTool provides a simple, specialized action for exiting a modal which will perform a close animation.

![](/static/img/actions/close-modal.png)

::: callout
**Note:** In [preview](/basics/preview/) mode, user interactions with components such as checkboxes, dropdowns, etc. are persisted inside a modal even after close. To reset the state of a board, attach the [reset state](/actions/state-changes/#reset-state) action.
:::
