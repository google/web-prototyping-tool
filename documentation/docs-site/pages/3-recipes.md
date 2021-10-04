---
title: Tips & Tricks
date: Last Modified
permalink: /tips-n-tricks/index.html
eleventyNavigation:
  key: recipes
  title: Tips & Tricks
  order: 3
---

Not sure how to do something?
This section is a quick reference for common questions when building prototypes.

### Can I import my own components into the tool?

Check out [Code Components](/components/code-components/)

### How do I add a tooltip?

Select the component and expand the **Tooltip** section. Adding a **label** and **position** will make the tooltip appear on hover in preview.

### How do I get components from one project into another?

[Composed](/components/composed/) and [Code](/components/code-components/) components can be published to the [Marketplace](/components/marketplace/) then imported into any project.

### Can I apply my own CSS to components?

This is possible using [CSS Overrides](/beyond-the-basics/component-overrides/) but some components have children that may be inaccessible.

### How can I make a board or element scrollable?

[Boards](/basics/boards/#scrolling) and [Elements](/guide/layout/#overflow-%26-scrolling) both support scrolling using the overflow property. An [Action](/actions/scroll-to/) can be used to scroll the container based on a user behavior.

### How do I drag & drop like other design tools

Placing components is based on how browsers handle position relative to other elements. Changing a component's **position** from `Relative` to `Absolute` will allow you to freely place a component anywhere within a board. [Learn more](/basics/editor/#absolute) We recommend using relative position for most scenarios but there is also a [setting](/beyond-the-basics/settings/#prefer-absolute-position) to make `Absolute` the default when adding new components.

### How do I create layouts?

Check out the [layout guide](/guide/layout/).

### How do I create navigation between boards?

Check out [Navigation Actions](/actions/navigation/)

### How can I add animation to my prototype?

Check out the [Record State Action](/actions/state-changes/)

### Can I reset a prototype from within my prototype?

Check out the [Reset State Action](/actions/state-changes/#reset-state)

### How do I create a checkbox that has an indeterminate state when other checkboxes are checked?

No need to add a special action, just add **children** to the [Material Checkbox](/components/material/#checkbox) component you want to use as the parent.

### Can I import a Figma prototype?

The [Embed](/components/primitives/#embed) component can be used to embed a Figma prototype or you can [export layers](/assets/#sketch-%26-figma) as `SVG` and use them as vector assets.

### Can I embed my prototype into another website?

Create an iframe [embed tag](/basics/sharing-embed/#embedding). If you're familiar with JavaScript you can even [communicate](/actions/post-message/) with the website you're embedding the prototype in.

### How can I import data?

You can import datasets by opening the [Data panel](/data/) on the left side of the screen when viewing a project. From there, you can added pre-made JSON files, or create your own with our JSON editor by selecting `Direct input…` from the menu.

### Can I export code from my project?

You can export the **HTML** or **CSS** of any selectable element by right-clicking that element (including boards) and selecting either option under `Export code...`
