---
title: 'Snackbar Action'
date: Last Modified
permalink: /actions/snackbar/index.html
eleventyNavigation:
  order: 6
  parent: actions
  key: actions-snackbar
  title: 'Snackbar'
---

A snackbar, also referred to as a toast, is a component pattern used to display notifications. A snackbar is displayed above board content and is anchored to the screen edges. WebPrototypingTool’s snackbar action provides these behaviors with a variety of customization options.

![](/static/img/actions/snackbar-hero.png)

<div class="two-col">

<img src="{{ '/static/img/actions/snackbar.png' | url}}" >

| Property | Description                                                                      |
| -------- | -------------------------------------------------------------------------------- |
| Trigger  | Event that initiates the action                                                  |
| Message  | Snackbar text contents                                                           |
| Position | Anchor points for where the snackbar is displayed                                |
| Action   | Label for a button to the right of the message. If empty no button is displayed. |
| Icon     | Show an icon to the left of the **message**                                      |
| Dismiss  | Shows a close button                                                             |
| Duration | How long to show this message                                                    |
| Delay    | How long to wait before showing                                                  |

</div>

::: callout
**Note:** Currently the snackbar **action button** cannot trigger a different action. Please reach out to the team if this is something you would like us to prioritize.
:::
