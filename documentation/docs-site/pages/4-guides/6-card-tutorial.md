---
title: 'Tutorial: Card'
date: Last Modified
permalink: /guide/tutorial/card/index.html
eleventyNavigation:
  order: 6
  parent: guide
  key: card-tutorial
  title: 'Tutorial: Card'
---

In this tutorial we'll be creating a simple Card component using the basic building blocks provided within WebPrototypingTool. You'll learn the basics around [layout](/guide/layout/), [assets](/assets/) and [composed components](/components/composed/).

![](/static/img/card-tutorial/hero.png)

To get started, click **New Project** and select the **Blank - Google Material** template.

![](/static/img/basic-tutorial/basic-tutorial-start.png)

## Define the container

@[video](/static/img/card-tutorial/card-01.webm)

1. Drag an [element primitive](/components/primitives/#element) to the board, this will act as the container for the to-do list.
1. Resize the element by dragging the corner so it fills the space.
1. Change the **Radius** property to `8px` to round the corners.
1. Add a **Border** to all sides and change the color to the `border` [theme](/theme/) value.
1. Change the **Background** color to `surface` [theme](/theme/) value.


## Creating the card's layout

@[video](/static/img/card-tutorial/card-02.webm)

1. Start by dragging two [elements](/components/primitives/#element) into the container we just created.
1. Select the container and change the `Content Layout` to <svg class="ico btm" ><use xlink:href="#svg-grid" /></svg> **Grid**.
1. Adjust the Grid so there are **two rows** and **one column**.
1. Set the first to `A` **Auto** which will fit to the height of the top element.
1. The second row should be set to <svg class="ico btm" ><use xlink:href="#svg-fr-vert" /></svg> **Fractional Units** which will fill the space below the header.
1. Select the header (top element) and set the **width** to `100%` (tip: double click the right edge)
1. Select the footer (bottom element) and set the **width** and **height** to `100%`
1. Change the **Background** color of the footer to `surface` [theme](/theme/) value.


## Add an image to the header

@[video](/static/img/card-tutorial/card-03.webm)

1. <i class="ico btm">download</i> <a href="{{'/static/img/card-tutorial/north-cascades.jpg' | url}}" download>Click here</a> download a sample image to use.
1. Drag the downloaded image into your project.
1. Drag the uploaded image from the [assets](/assets/) panel as a child of the header.
1. Set the **width** and **height** to `100%`.


## Add text to the footer

@[video](/static/img/card-tutorial/card-04.webm)

1. Add a text primitive to the footer for the title
1. Remove the **padding** from the title
1. Switch the **text content** to `plain text`
1. Update the text to read `Card title`
1. Change the **font style** to `Headline 6`
1. Add a text primitive below the title for the description
1. Remove the **padding**
1. Update the text to read `Secondary descriptive text`
1. Change the **font style** to `Body 2`


## Convert to a Component

@[video](/static/img/card-tutorial/card-05.webm)

To convert the card into a [Composed component](/components/composed/) select the group and click the <svg class="ico btm" ><use xlink:href="#svg-symbol" /></svg> button in the top bar or use the right click context menu to select `Create Component`. Composed components will allow you to reuse this group and easily swap out the image and text content.

