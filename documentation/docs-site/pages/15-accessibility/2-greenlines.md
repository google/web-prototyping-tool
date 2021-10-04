---
title: Greenlines
date: Last Modified
permalink: /accessibility/greenlines/index.html
toc: true
eleventyNavigation:
  key: greenlines
  title: Greenlines
  parent: accessibility
  order: 2
---

Greenlines can be useful for a visual review of flow and structure, [eng handoff](/accessibility/handoff-collaboration/), or [externally embedded specs](/accessibility/handoff-collaboration/#embed). Greenlines in WebPrototypingTool are a bit different from traditional design tools in that they are automatically generated from accessibility properties on the elements. Unlike with most other design tools, you do not need to manually draw boxes with labels. WebPrototypingTool’s greenlines are simply a reflection of the resulting accessibility of the underlying design + code you have already [authored in the edit panel](/accessibility/authoring-accessibility/).

Turn on greenlines in preview by checking the corresponding options in the greenlines section in the inspection panel.

![](/static/img/accessibility/greenlines/all-greenlines.png)

## Landmarks

@[video](/static/video/accessibility/toggling-landmarks.webm)

[Landmarks](https://www.w3.org/TR/wai-aria/#landmark) are structural greenlines. In order to generate these greenlines, WebPrototypingTool looks for elements that have landmark roles assigned to them. Manipulating these greenlines is as simple as [authoring the desired landmark role](/accessibility/authoring-accessibility/#role) on the element.

| Role                                                           | Description                                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Banner](https://www.w3.org/TR/wai-aria/#banner)               | A region that contains mostly site-oriented content, rather than page-specific content. Default role for the `<heading>` tag.                                                                                                                                                               |
| [Complementary](https://www.w3.org/TR/wai-aria/#complementary) | A supporting section of the document, designed to be complementary to the main content at a similar level in the DOM hierarchy, but remains meaningful when separated from the main content. Default role for the `<aside>` tag.                                                            |
| [Contentinfo](https://www.w3.org/TR/wai-aria/#contentinfo)     | A large perceivable region that contains information about the parent document. Default role for the `<footer>` tag.                                                                                                                                                                        |
| [Form](https://www.w3.org/TR/wai-aria/#form)                   | A landmark region that contains a collection of items and objects that, as a whole, combine to create a form. Default role for the `<form>` tag.                                                                                                                                            |
| [Main](https://www.w3.org/TR/wai-aria/#main)                   | The main content of a document. Default role for the `<main>` tag.                                                                                                                                                                                                                          |
| [Navigation](https://www.w3.org/TR/wai-aria/#navigation)       | A collection of navigational elements (usually links) for navigating the document or related documents. Default role for the `<nav>` tag.                                                                                                                                                   |
| [Region](https://www.w3.org/TR/wai-aria/#region)               | A perceivable section containing content that is relevant to a specific, author-specified purpose and sufficiently important that users will likely want to be able to navigate to the section easily and to have it listed in a summary of the page. Default role for the `<section>` tag. |
| [Search](https://www.w3.org/TR/wai-aria/#search)               | A landmark region that contains a collection of items and objects that, as a whole, combine to create a search facility. (No default tag.)                                                                                                                                                  |

## Headings

[Headings](https://www.w3.org/TR/wai-aria/#heading) are also structural greenlines. In order to generate these greenlines, WebPrototypingTool looks for elements that have heading roles assigned to them. Manipulating these greenlines is as simple as [setting a heading role](/accessibility/authoring-accessibility/#role) on the element and choosing a level.

@[video](/static/video/accessibility/toggling-headings.webm)

To assign a heading, navigate to the edit mode accessibility panel and select the “Heading” role for the element. This role comes with _Level_ (`aria-level`) and value of 2 as an implicit attribute ([learn more](https://www.w3.org/TR/wai-aria/#aria-level)). The below example is the equivalent of creating an `<h2>` element.

## Flow

Flow greenlines are more complex and represent the _natural tab flow_ of the underlying HTML (aka tab key press). They are dynamic and will update as you interact with the preview board. They also reveal internal flow of third party components on the board, even if you can't edit them directly in WebPrototypingTool.

You cannot directly manipulate these greenlines. They are based on whether the underlying HTML element is focusable, which is determined by its element tag, tabindex, disabled state, and [more](https://html.spec.whatwg.org/multipage/interaction.html#focusable-area).

If you want to generate a flow greenline on an element that has none, make sure to use an element from the asset panel that is already focusable, such as a button or input element. (We have plans to help identify currently focusable elements in a future update).

@[video](/static/video/accessibility/toggling-flow-tabindex.webm)

::: callout-green
**Tip**: We are in the process of adding focus controls to the edit panel. Until then, you can also make an element focusable by manipulating [tabindex](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex) in the advanced properties panel. `tabindex=”0”` will add an element to the main tab flow.
:::

Order for the most part is determined by DOM order, which you can see in the [layers tree](/basics/layers) in edit mode, and the [accessibility inspector tree](/accessibility/handoff-collaboration/#element-tree) in preview mode. Changing flow order will require rearranging your layout so that the elements are in the desired order (or an advanced usage of [tabindex](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex), which should be used as a last resort).

![](/static/img/accessibility/greenlines/DOM-order-trees.png)

## Focus Groups

Focus group greenlines are currently combined into our flow greenlines view. They are generated when elements are using certain parent + child roles that [according to WCAG](https://www.w3.org/TR/wai-aria/#managingfocus), are required to behave as arrow navigable focus groups.

![](/static/img/accessibility/greenlines/tab-group.png)

You can create these greenlines by combining these parent and child list-type roles when [authoring accessibility settings](/accessibility/authoring-accessibility/#role).

| Parent role(s) | Child role(s)                             |
| -------------- | ----------------------------------------- |
| grid           | row                                       |
| listbox        | option                                    |
| menu, menubar  | menuitem, menuitemcheckbox, menuitemradio |
| radiogroup     | radio                                     |
| tablist        | tab                                       |
| tree           | treeitem                                  |
| treegrid       | row                                       |

::: callout
**Note**: For now, these elements will not physically behave as focus groups in the prototype until a future update.
:::

![](/static/img/accessibility/greenlines/parent-child-list-roles.png)
