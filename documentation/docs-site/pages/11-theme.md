---
title: Theme
date: Last Modified
permalink: /theme/index.html
toc: true
eleventyNavigation:
  key: theme
  title: Theme
  order: 11
---

The theme panel provides a central location to manage color, typography, icons and variables for a prototype. Changes made to this panel will propagate throughout a project as they're bound within [Material](/components/material/) components.

To get started, click the <i class="ico btm">styles</i> button in the left side bar or use the [shortcut](/basics/shortcuts/) key `T` to toggle the panel open or closed.

![](/static/img/theme/theme-hero.png)

WebPrototypingTool provides multiple themes by default, including those for Material based on their design specs. The themes that come standard can be further customized, edited, and extended to meet the needs of a particular project.

@[video](/static/img/theme/change-theme.webm)

The theme panel is made up of four sections: [Color](#color), [Typography](#typography), [Variables](#variables) and [Icons](#icons). Values defined within a theme are bound to [CSS Custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties) under the hood.

## Color

Colors can be added, modified or deleted but removing the preset values such as `Primary`, `Secondary`, etc. may break the bindings with the Material components. To add a new color, click the <i class="ico btm">add</i> **Add** button at the bottom of the list.

@[video](/static/img/theme/theme-color.webm)

**Using color**

[Boards](/basics/boards/), [elements](/components/primitives/#element) and [icons](/components/primitives/#icon) support binding to theme colors. Select the input field for a color in the properties panel to show a dropdown of available theme colors. When a color is bound to a theme value it will appear as a chip in the properties panel. To remove the binding, simply click the <i class="ico btm">close</i> button within the chip.

@[video](/static/img/theme/theme-use-color.webm)

[Material](/components/material) components have special bindings with theme values and currently do not support direct overrides. Use the color dropdown to set a theme-bound accent color: `None`, `Primary`, `Secondary` or `Warn`.

![](/static/img/theme/theme-color-material.png)


## Typography

Use typography values to present your text content clearly and consistently. The default type scale is based on the Material spec for each theme and contains values for font, size, color and spacing. These are values are automatically bound to values within Material components or use the [Text component](/components/primitives/#text) for more control.

@[video](/static/img/theme/theme-type.webm)

Any font available on [Google Fonts](https://fonts.google.com/) can be added to a project. To add a new font or type scale, click the <i class="ico btm">add</i> **Add** button.

## Icons

WebPrototypingTool includes over 5,000 built-in icons for Material. Use the icon section within the theme to specify the default [Material](https://material.io/resources/icons/?style=baseline) icon set.

@[video](/static/img/theme/theme-icons.webm)

**Using icons**

The [Icon component](/components/primitives/#icon) provides an easy way to use icons within a project. Many [Material](/components/material/) components also have properties for adding icons. Click the chip to bring up the icon picker to select an icon.

@[video](/static/img/theme/theme-use-icons.webm)

## Variables

The variables section provides a way to define reusable values for **Size**, **Layout** and **Opacity**. However, these values are currently only available for use within [CSS overrides](/beyond-the-basics/component-overrides/).

@[video](/static/img/theme/theme-variables.webm)

## Roadmap

- Ability to use variable bindings with default properties
- Define and use shadow depth variables
- Material design system database + tokens
