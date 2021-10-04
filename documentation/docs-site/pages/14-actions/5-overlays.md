---
title: 'Custom Overlay Actions'
date: Last Modified
permalink: /actions/overlays/index.html
toc: true
eleventyNavigation:
  order: 5
  parent: actions
  key: actions-overlays
  title: 'Overlays'
---

Use this [action](/actions/) to display content on top of other elements within your prototype. This is perfect for creating custom tooltips, notifications and dropdowns as it can be attached and aligned to any component.

## Show Overlay

To show an overlay, simply choose a target [board](/basics/boards/) to show as the contents. This is based on the same principles as the [portal](/components/primitives/#portal) component. This also means that any [board navigation](/actions/navigation/#navigate-to-board) inside this overlay will be contextual unless otherwise specified.

@[video](/static/img/actions/overlays.webm)

The component attached to this [action](/actions/) acts as the anchor unless another is specified. By default, the dimensions of the overlay match that of the target board however, you can also specify a custom size.

<div class="two-col">

<img src="{{ '/static/img/actions/show-overlay.png' | url}}" >

| Property   | Description                                                                                                                     |           Required |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------- | -----------------: |
| Trigger    | Event that initiates the action.                                                                                                |                    |
| Target     | Board content to display.                                                                                                       | :white_check_mark: |
| Size       | Dimensions of the modal which defaults to match the size of the target board.                                                   |                    |
| Elevation  | Available drop shadow for the overlay.                                                                                          |                    |
| Anchor     | Specifies which component to attach this overlay. The default is this action's component.                                       |                    |
| Position   | The placement and alignment of this overlay as it relates to the anchor component.                                              |                    |
| Spacing    | Distance from the anchor component.                                                                                             |                    |
| Radius     | Border radius of the overlay.                                                                                                   |                    |
| Delay      | How long to wait before showing.                                                                                                |                    |
| Auto close | This option will close the overlay when clicking outside of the content area. Only available when `Trigger` is equal to `Click` |                    |

</div>

::: callout
**Note:** Unlike [Modals](/actions/modal/) and [Drawers](/actions/drawer/), multiple overlays can be shown at the same time. In addition, overlays can be presented inside modals and drawers as well as from other overlays.
:::

## Position & Alignment

An overlay's position and alignment are relative to the component which calls this action. Changing the `anchor` property will allow you to show this overlay relative to a different component within a board.

@[video](/static/img/actions/overlay-position.webm)

When an action's `anchor` is set to a board, the behavior of `position` changes relative to the inside of the container instead of outside.

## Close Overlay

WebPrototypingTool provides a simple, specialized action for exiting an overlay. If this "close overlay" action is called within an overlay it will close it. When outside an overlay, this action will close all overlays starting with the last shown.

![](/static/img/actions/close-overlay.png)

## Recipes

### Transparent backgrounds {data-toc-exclude}

Changing the `target` board's background color alpha to `zero` will show the overlay with a transparent background.

![](/static/img/actions/transparent-overlay.png)

### Custom Tooltip Sample {data-toc-exclude}

In the following example, [elements](/components/primitives/#element) are used to construct a tooltip inside a board with an arrow pointing to the button that called it.

::: callout
**Note:** An action isn't needed for a basic tooltip. You'll find an option within properties for the selected component.
:::
