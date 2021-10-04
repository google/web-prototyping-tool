---
title: Primitives
date: Last Modified
permalink: /components/primitives/index.html
toc: true
eleventyNavigation:
  key: primitives
  title: Primitives
  parent: components
  order: 1
---

Primitives are basic building blocks for creating layouts and displaying content. Entire prototypes can be built just using these simple components but we recommend using them along side [Material](/components/material/) for best results.

![](/static/img/components/primitives.png)

## Element

The <i class="ico btm">dialogs</i> **Element** primitive is **_the_** foundational building block that provides a way to create [groups](/guide/layout/), [compose layouts](/guide/layout/), or even draw shapes. This element is based on an HTML [DIV](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/div), a versatile, generic container that can be styled and arranged in infinite ways.

![](/static/img/components/element.png)

**Tips**

[ripple]: https://material-components.github.io/material-components-web-catalog/#/component/ripple

- Press `Command + g` on [macOS](/basics/shortcuts/) to create a [group element](/guide/layout/#groups) from any selected components.
- The **Radius** property applies rounding to an element's corners.
- The **Ripple** property adds a [Material Ripple][ripple] animation to an element or group.
- The **Overflow** property makes an element's contents [scrollable](/guide/layout/#scrolling) or clipped.
- The **Content** properties define a [layout](/guide/layout/), such as a grid, for nested content.

## Text

The <i class="ico btm">format_shapes</i> **Text** primitive is used to display titles, headers and body content. In `Rich Text` mode, content can be customized with links, bullets and [data binding](/data/). The available font styles used by this component are defined in the [Theme Panel](/theme/).

![](/static/img/components/text.png)

**Tips**

- **double-click** this primitive on the design surface to focus and start editing text content.
- Switching to **Plain Text Mode** is better for labels and titles as it will automatically apply truncation on resize.
- In **Rich Text Mode**, this <i class="ico btm">text_rotation_none</i> can be used to generate sample `"Lorem ipsum"` text.

## Image

The <i class="ico btm">drive_image</i> **Image** primitive supports various image formats (svg, png, jpg and animated gif) added to the [Assets Panel](/assets/). This component supports clipping, blend modes and filters.

![](/static/img/components/image.png)

**Tips**

- The **Fit** property controls how an image is clipped or resized based on the [object-fit](https://developer.mozilla.org/en-US/docs/Web/CSS/object-fit) CSS property.
- For best results use **SVG** files or 2x resolution assets, but be careful of large files which may slow down loading.

## Icon

The <i class="ico btm">local_florist</i> **Icon** primitive provides easy access to the entire library (6,838) of [Material](https://material.io/resources/icons/?style=baseline) icons. Material Icon variants (outlined, rounded, etc) can be specified in the [Theme Panel](/theme/).

![](/static/img/components/icon.png)

## Portal

The <svg class="ico" width="20" height="20" ><use xlink:href="#svg-portal" /></svg> **Portal** primitive provides a way to project the contents of one board inside another. This is also the basis for how [Modals](/actions/modal/), [Drawers](/actions/drawer/) and [Material Tabs](/components/material/#tabs), [Steppers](/components/material/#stepper) and [Expansion panels](/components/material/#expansion-panel) work.


![](/static/img/components/portal.png)

**Tips**

- A group can be converted into a portal by clicking the <svg class="ico" width="20" height="20" ><use xlink:href="#svg-portal" /></svg> in the overlay menu
- In the editor, **double-click** a Portal to bring the target board into view.
- Board [Navigation](<(/actions/navigation/)>) within a portal occurs in context rather than globally.
- To reset a Board used by Portals, refer to the [Reset State action](/actions/state-changes/#reset-state).
- Use the [Swap Portal action](/actions/swap-portal/) for a quick way to swap out boards.

## Embed

The <i class="ico btm">web_asset</i> **Embed** primitive supports displaying content from websites outside of WebPrototypingTool with presets for **Youtube**, **Figma**, **Google Maps**, **Docs**, **Sheets** and **Slides**. Note that not all websites allow embedding and some URLs may only be visible internally.

![](/static/img/components/embed.png)

## Input

The <svg class="ico"><use xlink:href="#svg-input" /></svg> **Input** primitive is based on the HTML [input](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input) and [textarea](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/textarea) elements. This is a more barebones component compared to the [Material Input](/components/material/#input) to allow for more flexibility and customization. Primitive inputs can be configured as a color picker, slider, password, date and more.

![](/static/img/components/input.png)

**Tip:** Inputs can listen to and conditionally respond to changes using the `Value Change` [Action trigger](/actions/#types-of-triggers)

## Media

The <i class="ico btm">play_circle_filled</i> **Media** primitive supports video and audio playback. Currently the asset panel does not support media content so a remote URL must be specified. To activate media on a user interaction check out the [RunJS Action](/actions/runjs/).

![](/static/img/components/media.png)

**Tip:** Available RunJS actions include `target.play()`, `target.pause()` and for seeking use `target.currentTime = some_value`.
