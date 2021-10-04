---
title: Actions
date: Last Modified
permalink: /actions/index.html
toc: true
eleventyNavigation:
  key: actions
  title: Actions
  order: 14
---

[mat-button]: /components/material/#button
[mat-chips]: /components/material/#chips
[mat-select]: /components/material/#select
[mat-radio]: /components/material/#radio-buttons
[mat-input]: /components/material/#input
[mat-slider]: /components/material/#slider
[mat-date]: /components/material/#date-picker
[mat-stepper]: /components/material/#stepper
[mat-checkbox]: /components/material/#checkbox
[mat-switch]: /components/material/#switch
[prima-input]: /components/primitives/#input
[prima-portal]: /components/primitives/#portal
[record-state]: /actions/state-changes/

Adding interactivity to your prototype is easy with Actions in WebPrototypingTool. These simple, yet powerful behaviors help you express functionality and animation without writing any code.

<video src="{{ '/static/video/intro-to-actions.mp4' | url }}" controls preload="auto" poster="{{'/static/img/actions/intro-to-actions.png' | url }}"></video>

## Getting Started

To start using actions, select an **element** or **board** and click the lightning bolt <i class="ico btm">bolt</i> tab in the top right of the properties panel.
Actions can also be added from the right click context menu or floating overlay when selecting an element.

@[video](/static/img/actions/start-actions.webm)

Below is a list of available actions, click their link to learn more:

| Action                                                  | Description                                                                   |           Advanced |
| :------------------------------------------------------ | :---------------------------------------------------------------------------- | -----------------: |
| [Navigate to Board](/actions/navigation/)               | Navigate between boards                                                       |                    |
| [Navigate to URL](/actions/navigation/#navigate-to-url) | Open a url in a new tab or current window                                     |                    |
| [Record State][record-state]                            | Record changes you make to an element and play them back (supports animation) |                    |
| [Reset State](/actions/state-changes/#reset-state)      | Reset the current state of an element, board or entire prototype              |                    |
| [Present Modal](/actions/modal/)                        | Show a modal with the contents of a board                                     |                    |
| [Exit Modal](/actions/modal/#exit-modal)                | An action to exit a modal                                                     |                    |
| [Open Drawer](/actions/drawer/)                         | Show a drawer with the contents of a board                                    |                    |
| [Close Drawer](/actions/drawer/#close-drawer)           | An action to close a drawer                                                   |                    |
| [Custom Overlay](/actions/overlays)                     | Create custom tooltips or dropdowns                                           |                    |
| [Snackbar](/actions/snackbar/)                          | Show a snackbar notification                                                  |                    |
| [Scroll to](/actions/scroll-to)                         | Scroll to a specific position within a board or element group                 |                    |
| [Swap Portal](/actions/swap-portal)                     | Swap the contents of a [portal][prima-portal]                                 |                    |
| [Run JS Code](/actions/runjs/)                          | Execute custom JavaScript                                                     | :white_check_mark: |
| [Post Message](/actions/post-message)                   | Send messages out of the iframe that embeds a WebPrototypingTool project                | :white_check_mark: |

## Anatomy of an Action

The following properties are common to all actions. Some actions extend them to provide additional customization and control.

<div class="two-col">

<img src="{{ '/static/img/actions/basic-action.png' | url}}" >

| Event              | Description                                    |
| ------------------ | ---------------------------------------------- |
| Trigger            | Various events that perform this action        |
| Target             | Target element or board this action applies to |
| Condition / Equals | specify a condition to perform this action     |
| Delay              | Time to wait before performing this action     |

</div>

[mouse-down]: https://developer.mozilla.org/en-US/docs/Web/API/Element/mousedown_event

### Types of Triggers

| Event         | Description                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------------- |
| Click         | Element is clicked                                                                             |
| double-click  | Element is double-clicked                                                                      |
| Mouse Enter   | Mouse over the element                                                                         |
| Mouse Leave   | Mouse out of the element                                                                       |
| Mouse Down    | Mouse down inside the element ([different][mouse-down] from click)                             |
| Mouse Up      | Mouse up inside the element                                                                    |
| Board Appears | This action is called when the target board appears                                            |
| Hover         | Combines mouse enter and leave into a single event ([Only Record State actions][record-state]) |

**Component specific triggers**

| Event                     | Components                                                                                                            |
| :------------------------ | :-------------------------------------------------------------------------------------------------------------------- |
| Focus / Blur              | [Material Input][mat-input] & [Primitive Input][prima-input]                                                          |
| Checked                   | [Material Checkbox][mat-checkbox] & [Switch][mat-switch]                                                              |
| Value change              | [Material Slider][mat-slider], [Input][mat-input], [Date][mat-date] & [Primitive Input][prima-input]                  |
| Select                    | [Material Select][mat-select], [Radio Buttons][mat-radio], [Chips][mat-chips]                                         |
| Menu item click           | [Material Button][mat-button]                                                                                         |
| Step index change         | [Material Stepper][mat-stepper]                                                                                       |


::: callout

**Note:** [Code Components](/components/code-components/) may also support custom event triggers, if the author [exposes](/components/code-components/#output-events) them. Additionally, [Composed Components](/components/composed/#actions) can trigger an action from within using a special `from` property on the instance.

:::

### Event Conditions

Some components, such as [Material Inputs][mat-input], have event triggers that support specifying additional conditions for fulfilling an action.

![](/static/img/actions/conditions.png)

| Condition                | Description                                                                                           |       Numbers only |
| :----------------------- | ----------------------------------------------------------------------------------------------------- | -----------------: |
| None                     | Any value change (default)                                                                            |                    |
| Equals                   | A specific value is needed before this action will run                                                |                    |
| Not Equal to             | Must **not** equal a specific value                                                                   |                    |
| Includes                 | Determines if there is a partial match. For example, **"the"** is included in the word "Pan**the**on" |                    |
| Does Not Include         | Determines if a value does not exist inside a string                                                  |                    |
| Greater than             | Number is greater than a specific value                                                               | :white_check_mark: |
| Greater than or equal to | Number is greater than or equal to a specific value                                                   | :white_check_mark: |
| Less than                | Number is less than a specific value                                                                  | :white_check_mark: |
| Less than or equal to    | Number is less than or equal to a specific value                                                      | :white_check_mark: |

## Copying & Pasting

Actions applied to one element can be duplicated and applied to another by using the copy and paste buttons available within the actions panel.

@[video](/static/img/actions/copy-paste-action.webm)

Additionally, when an element or group of elements is duplicated, if any of their actions target an element within the duplicated group, they will be re-targeted to the new elements.

@[video](/static/img/actions/duplicate.webm)

<!-- ## Best Practices -->

## Roadmap

- Transitions between boards
- Adding states to elements
