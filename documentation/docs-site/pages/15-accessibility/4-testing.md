---
title: Testing & Validation
date: Last Modified
permalink: /accessibility/testing-validation/index.html
toc: true
eleventyNavigation:
  key: testing-validation
  title: Testing & Validation
  parent: accessibility
  order: 4
---

Since WebPrototypingTool produces real code, it gives you the ability to physically test your design very closely to how it would end up in production. This allows you to validate the accessibility patterns you have authored before sending them off to stakeholders. QA testers can also easily test your designs in this phase as well without waiting on eng to develop the design in production or staging.

## Color blindness

Use the Color blindness dropdown in the accessibility inspector to simulate different [color blind types](https://www.colourblindawareness.org/colour-blindness/types-of-colour-blindness/).

- **Grayscale** - (monochromacy) no red, green, or blue tones present
- **Protanopiam** - reduces red tones
- **Deuteranomaly** - reduced green tones

@[video](/static/video/accessibility/color-blind-mode.webm)

## Keyboard flow

A common accessibility test is to try out the basic keyboard flow of the design. This means navigating via tab or arrow key, interacting via enter or space, etc. to see if all interactive elements are reachable. This is not the same as [screenreader testing](/accessibility/testing-validation/#screenreaders) but is a good first step.

WebPrototypingTool’s [tab flow greenlines](/accessibility/greenlines/#flow) can assist with this step. Each tabbable element should be highlighted with a green box in order of flow, and purple boxes for arrow navigable elements. As each element is focused, a purple focus highlight also appears to help you spot your place in the flow.

@[video](/static/video/accessibility/keyboard-flow.webm)

::: callout-green
Suggestion: You should also try tabbing through your design with the greenlines turned off (meaning no focus helper). If you find yourself visually losing where the focus is, those elements should be updated to have more visible focus states.
:::

**Focus testing tip**

We are currently designing a new isolated view mode to make this kind of testing much easier, but for now you will have to test within the existing preview mode. If you want to “reset” focus to the beginning of the board, click somewhere in the empty area to the left of the board. The next time you hit tab, focus should land on the first element in the board.

![](/static/img/accessibility/testing/focus-click-markedup.png)

## Screenreaders

You can run any screenreader in WebPrototypingTool preview mode since it is a web app with live code. Until we make a more isolated view to make this easier, for now you will have to navigate your screenreader to the board within preview mode. The example below is using VoiceOver.

::: callout
**Note**: The board itself is an iframe, so your screenreader might require you to enter the iframe first to navigate within.
:::

@[video](/static/video/accessibility/screenreader-demo.webm)

## Auditing

Any accessibility audit tool that works on live HTML can theoretically work in WebPrototypingTool preview, such as [ANDI](https://www.ssa.gov/accessibility/andi/help/howtouse.html) or the [AXE browser extension](https://chrome.google.com/webstore/detail/axe-web-accessibility-tes/lhdoppojpmngadmnindnejefpokejbdd?hl=en-US).

::: callout
**Note**: The WebPrototypingTool tool UI will also get analyzed along with your preview boards. When we release an isolated preview mode, this should no longer be a problem.
:::
