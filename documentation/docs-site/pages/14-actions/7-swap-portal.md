---
title: 'Swap Portal Action'
date: Last Modified
permalink: /actions/swap-portal/index.html
eleventyNavigation:
  order: 7
  parent: actions
  key: actions-swap-portal
  title: 'Swap Portal'
---

[Portals](/components/primitives/#portal) are component primitives that display the contents of one board inside another. The **swap portal** action is used to easily swap which board content a portal is currently displaying. This is useful for adding navigation to your prototype. Technically, this could be done using a [record state](/actions/state-changes) action but would require more work.

![](/static/img/actions/swap-hero.png)

<div class="two-col">

<img src="{{ '/static/img/actions/swap-portal.png' | url}}" >

| Property | Description                                                                     |           Required |
| -------- | ------------------------------------------------------------------------------- | -----------------: |
| Trigger  | Event that initiates the action                                                 |                    |
| Portal   | A [portal](/components/primitives/#portal) **within the current board** to swap | :white_check_mark: |
| Target   | The [board](/basics/boards) content that the portal should swap to              | :white_check_mark: |
| Delay    | How long to wait before showing                                                 |                    |

</div>
