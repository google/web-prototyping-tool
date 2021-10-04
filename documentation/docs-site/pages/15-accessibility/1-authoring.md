---
title: Authoring Accessibility
date: Last Modified
permalink: /accessibility/authoring-accessibility/index.html
toc: true
eleventyNavigation:
  key: authoring-accessibility
  title: Authoring
  parent: accessibility
  order: 1
---

Since WebPrototypingTool utilizes real components, you can set accessibility properties directly on elements within your prototype. These can be configured for any individual element on the design board using the properties panel in edit mode. This panel allows you to assign ARIA attributes, preview the code output, and attach notes to elements which appear in [preview](/basics/preview/).

To get started, select an element or board in your project and click the <i class="ico" style="vertical-align: text-bottom">accessibility</i> icon in the top right to open the accessibility panel.

@[video](/static/video/accessibility/opening-edit-panel.webm)

<div class="two-col">

  <img src="{{ '/static/img/accessibility/authoring/panel-overview.png' | url}}">

| Property              | Description                                                                                          |
| --------------------- | ---------------------------------------------------------------------------------------------------- |
| Label                 | Accessibility label, maps to `aria-label` attribute                                                  |
| Role                  | Semantic role, maps to `role` attribute                                                              |
| Role attributes       | Section that is present when a role comes with attributes by default (example from image: "Heading") |
| Additional attributes | Section for managing any remaining attributes that can be added to the element                       |
| Output                | Quick preview of ARIA code output                                                                    |
| Notes                 | Rich text editor for adding freeform notes                                                           |

</div>

## Label

The _Label_ field is mapped to the `aria-label` [attribute](https://www.w3.org/TR/wai-aria/#aria-label) in HTML code and accepts a simple text string to be read by assistive technologies. `aria-label` is commonly used when the element does not have descriptive text content visible on the screen, is not otherwise labelled by other associated elements, or does not have an appropriate native element description for the situation.

::: callout
**Note**: If you define `aria-label` on an element, assistive technologies will verbalize this text instead of the element’s native output. Leaving this field blank is the same as not assigning `aria-label` at all, so assistive technologies will still be able to refer to the native description.
:::

![](/static/img/accessibility/authoring/label-field.png)

## Role

The _Role_ field, commonly referred to as “semantic role”, represents the `role` [attribute](https://www.w3.org/TR/wai-aria/#usage_intro) in HTML. It describes the semantic nature of the element, and is often the most important tool for communicating element accessibility to assistive technologies.

```ts
<div role="form">...</div>
```

The dropdown allows you to select any role as defined by current WCAG specs. Future versions of this panel will include more guidance for choosing appropriate roles.

::: callout
If you do not want to assign a role, leave the dropdown value as “No role”, which means the role attribute will not be added to the final code. This is not the same as the “None” option (`role=”none”`), which is a [specific role](https://www.w3.org/TR/wai-aria/#none) to remove any native semantics that may already be on an element.
:::

<!-- ![](/static/img/accessibility/authoring/role-field.png) -->

## Role implicit ARIA

Many roles, such as the alert role in the example below, have [implicit ARIA attributes](https://www.w3.org/TR/wai-aria/#implictValueForRole). According to WCAG, this means that certain roles should have certain attributes automatically set by the user agent, so that developers do not need to explicitly add them in code. We surface these in the panel so you have insight into what attributes already come with a role.

::: callout
These implicit attributes are what WCAG _requires_ for user agents to implement, however it is not a guarantee that all user agents will comply. Keep this in mind when [testing](/accessibility/testing-validation/) on multiple platforms.
:::

<div class="two-col">
  <img src="{{'/static/img/accessibility/authoring/role-defaults.png' | url}}" />
  <p>When you select a role that has implicit ARIA, a new panel will appear below with these attributes displayed. They are pre-filled with the default values for the role, but you may overwrite them if needed.</p>
</div>

::: callout-green
We are currently working on an attribute suggestion system that works similarly to implicit role attributes, which would pre-populate optional attributes that are generally considered best practice for the selected role or element.
:::

## Additional ARIA attributes

While label and role are the most common ARIA to set on an element, you may wish to assign additional ARIA for more complex elements. The accessibility panel allows you to assign any ARIA attribute that is supported for the chosen role or element and also not already represented elsewhere in the panel.

@[video](/static/video/accessibility/adding-additional-attr.webm)

When you select a role that has implicit ARIA, a new panel will appear below with these attributes displayed. They are pre-filled with the default values for the role, but you may overwrite them if needed.

::: callout
**Note**: Only supported attributes are available in the dropdown, depending on the role chosen ([see documentation](https://www.w3.org/TR/wai-aria/#supportedState)). This helps you avoid creating accessibility bugs by adding incorrect attributes.
:::

## Relational attributes

Some ARIA attributes are relational and refer to another element for information. This means that the relational attribute’s value is the ID of another HTML element.

@[video](/static/video/accessibility/adding-relational-attr.webm)

After adding a relational attribute in the additional attributes section, you will need to set the custom ID you entered on the element you want it related to.

::: callout
**Note**: This ID must be unique throughout your entire project.
:::

::: callout-green
In a future update we will have a custom control to make this process possible to do entirely within the accessibility panel.
:::

## Code output

The code output section provides a glimpse of what the resulting HTML code will look like for all ARIA assigned in the panel.

Only attributes that will actually make it to code will appear in this section. Empty attributes will not be listed. If the role chosen has default attributes displayed and their values have not been changed, they also will not be listed. We are currently working on a way to visualize this in a more intuitive way to avoid any confusion.

![](/static/img/accessibility/authoring/code-output.png)

::: callout
**Note**: This code output now exists in the preview accessibility inspector so we will likely remove it from the edit panel in an upcoming update.
:::

## Notes

The notes section provides a simple text editor for adding additional context to the element. This may be a useful substitute for accessibility features not yet implemented in the tool.

These notes do not affect the accessibility of the element directly. They are for you and stakeholder’s reference, and also appear in the [preview accessibility inspector](/accessibility/handoff-collaboration/#element-tree).

@[video](/static/video/accessibility/adding-notes.webm)
