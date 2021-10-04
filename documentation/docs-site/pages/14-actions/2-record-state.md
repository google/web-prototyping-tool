---
title: 'State Change Actions'
date: Last Modified
permalink: /actions/state-changes/index.html
toc: true
eleventyNavigation:
  order: 2
  parent: actions
  key: actions-state
  title: 'State change'
---

<!-- Additional styling for some buttons below -->
<style>
  .stop-btn, .rec-btn{
    font-weight: 400 !important;
    padding: 4px 8px;
    border-radius:4px;
    font-size: 0.9em;
    box-sizing:border-box;
    cursor:pointer;
  }

  .stop-btn{
    background:#f42d88;
    color:#fff !important;
  }

  .rec-btn{
    border:1px solid #ccc;
  }
</style>
<!-- end extra styles -->

WebPrototypingTool makes building dynamic prototypes easy with powerful actions for changing state across an entire project. This opens up endless possibilities for creating interactivity without the need for multiple boards or writing code.

## Record State

Adding this action will **automatically start recording** and show a panel to capture all changes made. Simply demonstrate by selecting and modifying properties on any element, component or board.

@[video](/static/img/actions/record-state.webm)

While recording, components cannot be added, removed, or moved -- **only properties can be modified**. When finished click the <strong class="stop-btn">Stop</strong> button in the upper right.

<div class="two-col">

<img src="{{ '/static/img/actions/record-action-props.png' | url}}" >

| Property                                                         | Description                                                                                 |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Trigger                                                          | Event that initiates the action                                                             |
| Delay                                                            | How long to wait before showing                                                             |
| Toggle                                                           | Board whose content to display (not available for the **hover** trigger)                    |
| <i class="ico">timer</i> <i class="ico">format_list_bulleted</i> | Toggle between timeline and property list view                                              |
| <strong class="rec-btn">Record</strong>                          | Re-enter **record mode** to make adjustments or add more changes                            |
| List of changes                                                  | After recording, all changes will show up at the bottom, each change is grouped by element. |
|                                                                  | Hovering over elements in the list will show buttons to delete or edit.                     |

</div>

## Modifying State

Every component in WebPrototypingTool has two types of attributes, **styles** and **inputs**. Styles refer to visual characteristics such as size and color while an input typically refers to the content. Most input properties can be modified after (or while) recording by simply clicking the item in the list.

@[video](/static/img/actions/modify-state.webm)

::: callout
**Note:** While recording, any modification that is equal to the state of a component before recording started will get removed from the list of changes (since it didn't change). However, selecting and modifying a recorded change will be **persisted** even if it is changed back to the original state from the properties panel.
:::

## Animation & Timing

For recorded changes, **easing**, **duration** and **delay** to can be applied to styles. However, for inputs only **delay** is available at this time.

![](/static/img/actions/record-timing.png)

For a visual representation of duration and delay, click the <i class="ico">timer</i> to toggle into the **timeline** view.

![](/static/img/actions/timing-details.png)

::: callout
State changes in WebPrototypingTool are additive, such that new changes get applied on top of old ones. This also means animations can seamlessly transition when multiple actions occur on the same element.
:::

### Hover & Toggle

There are some scenarios where one might need to remove changes that have been applied. For example, showing an overlay or switching between two states. Normally, one would need to create two distinct actions for adding and removing but there are two behaviors to make this easy.

![](/static/img/actions/hover-toggle.png)

The first is `Hover` which is available from the event trigger dropdown. This combines mouse enter and leave into a single event. The second is `Toggle` which appears as a checkbox for all other event triggers. Using toggle means that subsequent events, such as click, will cycle between adding and removing.


### Caveats

- Only one element property change can be applied per recording.
- Only modified values are recorded, therefore a property might need to be modified prior to recording to achieve the desired result.
- Under the hood, elements styles are backed by CSS so some attributes may not accept easing and duration such as `display` or `overflow`
- Changes made to an element's css via the **code tab** will not support animation.

## Reset State

In [preview](/basics/preview/) mode, user interactions are maintained globally. This means if a user updates an input, makes a radio button selection or performs a [record state](#record-state) action, the changes are persisted even after navigating to a different page. WebPrototypingTool provides an easy way to revert changes made to an element, group, [board](/basics/boards/) or the entire prototype:

<div class="two-col">

<img src="{{ '/static/img/actions/reset-state-props.png' | url}}" >

| Property | Description                                           |       For: Element |
| -------- | ----------------------------------------------------- | -----------------: |
| Trigger  | Event that initiates the action                       |                    |
| For      | **All** , **Current Board** or specific **Element**   |                    |
| Delay    | How long to wait before showing                       |
| Target   | Element or group of elements to reset                 | :white_check_mark: |
| Children | Should reset children inside a target element (group) | :white_check_mark: |

</div>

::: callout
**Note:** Selecting `For: All` will reset the **entire prototype** and close any [drawer](/actions/drawer/) or [modal](/actions/modal/) that may be open.
:::
