---
title: Creating Layouts
date: Last Modified
permalink: /guide/layout/index.html
toc: true
eleventyNavigation:
  order: 1
  parent: guide
  key: guide-layout
  title: Creating Layouts
---

The primary way to define layouts within WebPrototypingTool is by grouping components together. A group is simply an [element](/components/primitives/#element) with nested children. Elements are based on HTML [DIVs](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/div), and by default, placement is based on [relative position](https://developer.mozilla.org/en-US/docs/Web/CSS/position). In this guide we'll learn techniques for building responsive layouts.

@[video](/static/img/layout/layout-hero.webm)

## Groups

The easiest way to create a group is to select a set of components and click the **group** button in the top bar. Alternatively, groups can be created using the keyboard shortcut `Command + G` on [macOS](/basics/shortcuts/) or from the right click context menu. Groups created using this method, produce an empty [element](/components/primitives/#element) as the container and the selected components become children.

@[video](/static/img/layout/layout-group.webm)

Adding a component as a child of an [element](/components/primitives/#element) is another way to create a group. This can be accomplished simply by [dragging](/basics/editor/#drag-%26-drop) from the [components panel](/components-guide/) or from the design surface to the container element.

@[video](/static/img/layout/layout-nested.webm)

When an element has children, it will display a <i class="ico btm">folder_open</i> folder icon in the layers tree.

## Overflow & Scrolling

By default, groups are set to clip children outside of the bounds of the group. To change this behavior, select the group and edit the **overflow** property in the right panel.

@[video](/static/img/layout/layout-overflow.webm)

You might want to set **overflow** to `Show` if one of the children has shadow, such as a [Button](/components/material/#button), that extends outside of the group to prevent it from getting clipped.

The **overflow** property can be used to make the group's content scrollable, similar to [boards](/basics/boards/). An [action](/actions/scroll-to/) can even be triggered to scroll this container based on user interaction.

## Container Size

Creating a group from a selection of components will set the default **width** and **height** to `auto`. This means that the dimensions of the group are defined by its children.

@[video](/static/img/layout/layout-size.webm)

Resizing the bounds of the group will switch the **width** or **height** to a fixed pixel value. Clicking the "cross" in the properties panel will toggle between `auto`, `pixels` or `percent`. Using **percent** means that the size is based a percentage of the parent's dimensions.

## Padding

The **padding** property can be used to add space between the edges of a group and its children. Click the arrow <i class="ico btm">unfold_more</i> beside the padding to set specific edge values for top, bottom, left and right.

@[video](/static/img/layout/layout-padding.webm)

## Stacks

When creating a group, a horizontal or vertical stack can be applied to the children using dropdown located in the top bar.

![](/static/img/layout/layout-stack.png)

Layouts applied to group elements are defined by the **Content Layout** property. Changing this value to <svg class="ico btm" ><use xlink:href="#svg-col" /></svg> Columns (horizontal) or <svg class="ico btm" ><use xlink:href="#svg-row" /></svg> Rows (vertical) will apply a stack to the container.

@[video](/static/img/layout/layout-stacks.webm)

- The **gap** property adds space between children.
- The **alignment** property defines how children are aligned within the group.
- Use the **distribute** property defines if the children are stacked or spread out to fill the group.

Alignment can be overwritten per child element by selecting the child and changing the **align self** property. This property only appears when a component's parent group has **content layout** applied.

![](/static/img/layout/layout-self.png)

## Grid Layout

Stacks are great for distributing content but a **grid** provides additional flexibility and control. Both layout types are based on [CSS grid](https://developer.mozilla.org/en-US/docs/Web/CSS/grid) layout.

@[video](/static/img/layout/layout-grid.webm)

Add or remove **columns** and **rows** using the <i class="ico btm">add</i> add and <i class="ico btm">delete_outline</i> delete buttons.

![](/static/img/layout/layout-grid-colrow.png)

| Icon                                                            | Type             | Description                                                   |
| :-------------------------------------------------------------- | :--------------- | ------------------------------------------------------------- |
| <svg class="ico btm" ><use xlink:href="#svg-fr-vert" /></svg>   | Fractional Units | Divides the space left after what’s taken by the other values |
| <svg class="ico btm" ><use xlink:href="#svg-grid-auto" /></svg> | Auto             | Defined by the child component in this space                  |
| <svg class="ico btm" ><use xlink:href="#svg-grid-per" /></svg>  | Percent          | A percentage of the size of the group                         |
| <svg class="ico btm" ><use xlink:href="#svg-grid-px" /></svg>   | Pixels           | A fixed pixel value                                           |

A grid requires that the number of children doesn't exceed the total columns and rows. When this occurs a button will appear in the top bar to automatically fix the layout.

![](/static/img/layout/layout-grid-broke.png)

## Sample

Let's apply what we've learned about grid to create a responsive header for a the console.

@[video](/static/img/layout/grid-layout-bar.webm)

1. Start by creating a container and set the **Content Layout** to `grid`
1. Adjust the Grid so there are **seven columns** and **one row**.
1. Set all **columns** to `auto` except the third which should be set to <svg class="ico btm" ><use xlink:href="#svg-fr-horz" /></svg> fractional units
1. Add child components
1. Add **column gap** of `8px`
1. Set the group **alignment** to `Middle left`
1. Select the Search component and set the **Align Self** value to `Middle center`
1. Add `16px` padding to the left and right edges of the grid group

