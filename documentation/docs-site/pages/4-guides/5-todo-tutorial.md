---
title: 'Tutorial: To-do List'
date: Last Modified
permalink: /guide/tutorial/todo-list/index.html
eleventyNavigation:
  order: 5
  parent: guide
  key: todo-tutorial
  title: 'Tutorial: To-do List'
---

In this tutorial we'll be creating a to-do list prototype and covering the basics around [layout](/guide/layout/), [components](/components-guide/) and [interactions](/actions/).

@[video](/static/img/basic-tutorial/todo-list.webm)

## Start

To get started, click **New Project** and select the **Blank - Google Material** template.

![](/static/img/basic-tutorial/basic-tutorial-start.png)

## Define the container

@[video](/static/img/basic-tutorial/todo-01.webm)

1. Drag an [element primitive](/components/primitives/#element) to the board, this will act as the container for the to-do list.
1. Resize the element by dragging the corner so it fills the space.
1. Change the **Radius** property to `18px` to round the corners.
1. To center the element, select the [board](/basics/boards/) and change the `Content Layout` to <svg class="ico btm" ><use xlink:href="#svg-row" /></svg> **Rows** and the `Alignment` to the **center point**.
1. Add a **shadow** to the element and set the **blur (B)** value to `11`
1. Set the **background** to white by selecting the `surface` theme color


## Content layout

Next we'll create a layout for the title and list content.

@[video](/static/img/basic-tutorial/todo-02.webm)

1. Start by dragging two [elements](/components/primitives/#element) into the container we just created.
1. Select the container and change the `Content Layout` to <svg class="ico btm" ><use xlink:href="#svg-grid" /></svg> **Grid**.
1. Adjust the Grid so there are **two rows** and **one column**.
1. Set the first to `A` **Auto** which will fit to the height of the top element.
1. The second row should be set to <svg class="ico btm" ><use xlink:href="#svg-fr-vert" /></svg> **Fractional Units** which will fill the space below the header.
1. Select the top element and set the **width** to `100%` and add a **bottom border**
1. Select the bottom element and set the **width** and **height** to `100%`


## Add a title

@[video](/static/img/basic-tutorial/todo-03.webm)

1. Drag a [text primitive](/components/primitives/#text) into the top header element
2. Change the text **style** to `Headline 2`
3. Switch the text **content type** to `Plain Text`
4. Change the **text** value to `Todo list`
5. Select the header element and change the **padding** to `16`
6. Next set the height to `auto`
7. Set the two sibling layout elements **backgrounds** to white by selecting the `surface` theme color


## List item layout

@[video](/static/img/basic-tutorial/todo-04.webm)

1. Create a new board to make it easier to create the list item layout.
1. Add a [Material Checkbox](/components/material/#checkbox), [Primitive Input](/components/primitives/#input) and a [Material Button](/components/material/#button)
1. Select these components and group them.
1. Set the group's **width** to `100%`
1. Select the group and change the `Content Layout` to <svg class="ico btm" ><use xlink:href="#svg-grid" /></svg> **Grid**.
1. Adjust the Grid so there is **one row** and **three columns**.
1. Set the **first** and **last** column to `A` **Auto**
1. The middle column should be set to <svg class="ico btm" ><use xlink:href="#svg-fr-vert" /></svg> **Fractional Units**
1. Set the input's **width** to `100%` so it fills the container
1. Clear the checkbox's label value
1. Select the group and set the **alignment** to `Middle left` to vertically center the content
1. Set the group's **column gap** to `14`


## List item details

@[video](/static/img/basic-tutorial/todo-05.webm)

1. Select the [Material Button](/components/material/#button) and change the **variant** to `icon`
1. Change the button's **icon** to <i class="ico btm">delete_outline</i> `delete`.
1. Select the [Primitive Input](/components/primitives/#input) and change the placeholder to `Add task...`
1. Select the group and set **overflow** to show (This ensures the button's ripple animation is not cut off)


## Add interactions

@[video](/static/img/basic-tutorial/todo-06.webm)

1. Select the button and click the [actions](/actions/) tab
1. Click [Record State](/actions/state-changes/) to start capturing changes
1. Select the group and click the <i class="ico btm">unfold_more</i> button beside **padding** to show edges
1. Remove the **padding** for `top` and `bottom`
1. Set the group **height** to `0px`
1. Set the group's **overflow** to `hide`
1. Stop recording
1. Select the recorded values for **height** and **padding** and set the duration to `222ms`
1. Next, select the checkbox, switch to the actions tab and start [recording state](/actions/state-changes/)
1. Select the input and tick the checkbox for **disabled**
1. Stop recording
1. Set this recorded state to `Toggle` so clicking the checkbox will apply and remove the state


## Finishing up

All that is left to do is drag that list item group into the container we created earlier. Duplicating the list item will retain recorded actions within the group. Creating a [composed component](/components/composed/) from the list item will make it easier to update as changes propagate to every instance.

@[video](/static/img/basic-tutorial/todo-07.webm)

