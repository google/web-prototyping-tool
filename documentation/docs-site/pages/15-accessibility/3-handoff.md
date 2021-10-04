---
title: Handoff & Collaboration
date: Last Modified
permalink: /accessibility/handoff-collaboration/index.html
toc: true
eleventyNavigation:
  key: handoff-collaboration
  title: Handoff & Collaboration
  parent: accessibility
  order: 3
---

## Sharing

WebPrototypingTool preview mode is commonly used as a final deliverable. Stakeholders can use the tools within preview mode to inspect the design in ways a flat image cannot provide.

WebPrototypingTool’s share dialog has an option to include the accessibility panel in the shareable url.

![](/static/img/accessibility/handoff/share-dialog.png)

You can also share your project with greenlines turned on by default. The greenline modes are mapped to certain query params. The easiest thing to do is to set preview mode in the configuration you want to share, then copy the current url from your browser.

| View                | Query param                    |
| ------------------- | ------------------------------ |
| Accessibility panel | `&accessibility=1`             |
| Heading greenlines  | `&accessibility=1&headings=1`  |
| Landmark greenlines | `&accessibility=1&landmarks=1` |
| Flow greenlines     | `&accessibility=1&flow=1`      |

## Element inspection

Stakeholders can use the accessibility inspector panel to review accessibility information for each element on the design board.

@[video](/static/video/accessibility/toggling-inspector.webm)

### Element tree

In addition to using [greenlines](/accessibility/greenlines/) as a handoff artifact for easily identifying flow, landmarks, and headings, the accessibility panel has a couple of ways to inspect more detailed information for individual elements.

When nothing on the board is selected, the element tree allows you to see all elements on the current board in DOM order. The green accessibility icon indicates that ARIA or notes have been set on the element in [edit mode](/accessibility/authoring-accessibility/).

![](/static/img/accessibility/handoff/element-tree.png)

Click on an element in the tree or on directly the board to reveal the element’s accessibility details.

![](/static/img/accessibility/handoff/element-tree-details.png)

### Annotations

Annotations provide a quicker alternative way of viewing element accessibility information. When the toggle in the upper right corner of the panel is turned on, hovering over any element on the board will reveal it’s annotation. Clicking on the element will also open more information in the element tree.

The annotation also reveals if the element has a corresponding greenline, whether or not greenlines are currently turned on.

![](/static/img/accessibility/handoff/annotations.png)

## Embed

You can embed greenline views externally. Open the embed modal by clicking the Share button in the top right and navigating to the embed tab.

![](/static/img/accessibility/handoff/embed-dialog.png)

Options for viewing greenlines are to the right of the embed preview. This adds the necessary params to the embed url to display greenlines.

## Collaboration

When reviewing the design, you may have questions, suggestions, or other notes about the accessibility of certain elements. For now you can use the current [commenting feature](/basics/comments/) to add comments to specific board elements.

This requires toggling out of accessibility mode. We are currently exploring ways to integrate comments into accessibility testing more seamlessly.
