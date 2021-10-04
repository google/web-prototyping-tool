---
title: CSS & Attribute Overrides
date: Last Modified
permalink: /beyond-the-basics/component-overrides/index.html
toc: true
eleventyNavigation:
  key: component-overrides
  title: CSS & Attribute overrides
  order: 18
---

::: callout
**Caution:** We recommend using the the default properties panel to style components to avoid conflicts, and use this code tab **only** if you need added flexibility.
:::

[chrome-dev]: https://developers.google.com/web/tools/chrome-devtools/css

Under the hood, WebPrototypingTool uses [CSS](https://developer.mozilla.org/en-US/docs/Web/CSS) and element [attributes](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes) to define how [components](/components-guide/) are displayed. Anyone looking for more flexibility can override these values or peek under the hood to see what is applied. To get started, select a board or component and click the <i class="ico btm">code</i> **Code** tab in the upper right of the properties panel.

@[video](/static/img/overrides/overrides-hero.webm)

## CSS Overrides

Adding CSS has been modeled after the [Chrome Developer Tools][chrome-dev] experience and provides autocomplete for styles and their properties with the added ability to bind to WebPrototypingTool's [theme](/theme/) values.

![](/static/img/overrides/overrides-css.png)

CSS overrides also work with [Recorded State Actions](/actions/state-changes/) but changes can only be applied in bulk and not individually edited.

## Pseudo classes

Common [pseudo classes](https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-classes) are also available by default or click the **"Add pseudo class"** button to construct your own. If a pseudo class already exists or is invalid, it will not be saved.

![](/static/img/overrides/pseudo.png)

::: callout
**Tip:** Pseudo classes can be combined i.e `:hover:before` or `:focus:after`
:::

## Paste CSS

CSS attributes can be pasted from [Chrome Developer Tools][chrome-dev], Sketch or Figma by clicking <i class="ico btm">add</i> **Add** button and pasting with the keyboard shortcut `Command + V` (macOS) within the input field.

@[video](/static/img/overrides/overrides-paste.webm)

## Override indicator

A purple circle <span style="background:#7C4CFF; border-radius:50%; width:10px; height:10px; display:inline-block;"></span> above the <i class="ico btm">code</i> **Code** tab indicates when overrides have been applied to the selected component.

![](/static/img/overrides/overrides-applied.png)

## CSS Output

The bottom of the code panel displays the resulting CSS styles from the properties panel and overrides merged together. This can be used to see what is currently applied and used for engineering handoff purposes.

![](/static/img/overrides/overrides-output.png)

## Attributes

Attaching [attributes](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes) can be used to augment the behavior of elements such as specifying tab focus or editable content.

![](/static/img/overrides/overrides-attributes.png)
