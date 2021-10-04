---
title: Layers
date: Last Modified
permalink: /basics/layers/index.html
toc: true
eleventyNavigation:
  order: 10
  key: basics-layers
  title: Layers
---

The layers panel provides a way to visualize and manage the hierarchy of components within boards. To get started, click the <i class="ico btm">layers</i> or use the [shortcut](/basics/shortcuts/) key `L` to toggle the panel open or closed. To locate a specific layer, use the <i class="ico btm">filter_list</i> filter at the top of the panel.

![](/static/img/basics/layers.png)

## Expand & Collapse

Folders <i class="ico btm">folder_open</i> represent [elements](/components/primitives/#element) with nested child components. Click the arrows on the left to toggle expansion of layer groups. Holding `Shift` and clicking the arrow will expand all children within a group. To collapse all layers, use the <i class="ico btm">unfold_less</i> button in the upper right of the panel.

@[video](/static/img/basics/layers-expand.webm)

## Re-order

By default, the <i class="ico btm">home_filled</i> [home board](/basics/boards/#home-board) is always shown at the top of the list, the remaining boards are sorted alphabetically.

Layers can be re-ordered or dragged to the [design surface](/basics/editor/#design-surface) and vice versa. When dragging within the layers panel, a short pause over a collapsed group will expand it to show nested content.

@[video](/static/img/basics/layers-reorder.webm)

**Tip:** The last layer in a group can be dragged to the left <i class="ico btm">west</i> to move it up to become a sibling of its parent, grandparent, great-grandparent etc.

## Multi-select

To multi-select individual layers hold the `Command` key on macOS or `Ctrl` on other platforms. To select a list of layers, click the top layer then `Shift` click the bottom (also works in reverse).

@[video](/static/img/basics/multi-select.webm)

## Renaming

**Double-click** a layer to rename its label.

@[video](/static/img/basics/layers-rename.webm)

Alternatively, layers can be renamed from the top of the properties panel on click or use the [shortcut](/basics/shortcuts) `Command + R` to automatically focus on the input.

## Visibility

Click the <i class="ico btm">visibility</i> button, which appears on hover, to toggle visibility for a layer. Visibility control is also available at the bottom of properties panel for components under the `Advanced` section and from the right click context menu. When combined with [actions](/actions/), visibility becomes a powerful tool to hide and reveal content within prototypes.

@[video](/static/img/basics/layers-vis.webm)

::: callout
**Note:** Hiding a layer in WebPrototypingTool is equivalent to using the css property `display: none`
:::

## Actions

Layers with [actions](/actions/) applied show a <i class="ico btm">bolt</i> icon. Click the icon to swap to the properties panel showing actions attached to the selected layer.

@[video](/static/img/basics/layers-actions.webm)

## Tips

The layers panel will open if collapsed when dragging a component to the left edge.

@[video](/static/img/basics/layers-show.webm)

The right click context menu is also available from the layers panel.

![](/static/img/basics/layers-context.png)
