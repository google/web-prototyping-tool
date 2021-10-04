---
title: Accessibility
date: Last Modified
permalink: /accessibility/index.html
eleventyNavigation:
  key: accessibility
  title: Accessibility
  order: 15
---

WebPrototypingTool has several features that allow you to author accessibility for your prototype. In other design tools, typically these features work by layering accessibility “instructions” (greenlines, annotations) on top of a flat design, which get interpreted into code by engineers later in the development process.

In WebPrototypingTool, however, the final output is real HTML code, so the accessibility properties you set are not just visual instructions. They are translated behind the scenes to integrate into the HTML output so that you can accurately experience and test the accessibility of your project completely within the design and prototyping phase.

![](/static/img/accessibility/overview.png)

```ts
<div role="button" aria-label="open menu" aria-expanded="true" aria-controls="flyout-menu">
  <i class="material-icons">accessibility_new</i>
</div>
```

- [Authoring Accessibility](/accessibility/authoring-accessibility/) - learn how to use edit mode to author accessible elements in your prototype.
- [Greenlines](/accessibility/greenlines/) - learn about greenlines in WebPrototypingTool and how to manipulate them.
- [Handoff & Collaboration](/accessibility/handoff-collaboration/) - learn how to use preview mode to assist with eng handoff and stakeholder collaboration.
- [Testing & Validation](/accessibility/testing-validation/) - learn how to test the accessibility of your prototype via keyboard, assistive technologies, and analysis tools.
