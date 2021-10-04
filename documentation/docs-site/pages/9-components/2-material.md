---
title: Material Components
date: Last Modified
permalink: /components/material/index.html
toc: true
eleventyNavigation:
  key: material
  title: Material
  parent: components
  order: 2
---

Built into WebPrototypingTool are a set of common components for Material. These are the real engineering artifacts so you get all of the **behaviors**, **animation** and **accessibility** out of the box. Additionally, each component's styles are bound to the design system via the [theme panel](/theme/).

![](/static/img/components/mat-components.png)

## Components {data-toc-exclude}

The Material components are currently based on the [Angular Material library](https://material.angular.io/).

![](/static/img/components/mat-theme.png)

<!--  -->

### Button

The <svg class="ico" ><use xlink:href="#svg-mat-button" /></svg> **Button** component supports many variants and can be customized with icons and other details.

![](/static/img/components/mat-button.png)

When **menu** items are present, clicking the button will automatically display a menu. Selecting the `Split` menu type will separate the menu open click and the primary button click.
[Actions](/actions/) can be added to respond when a user interacts using the `Menu item click` trigger for individual menu items. When a button is in Split mode, the `Click` action triggers the primary button.

![](/static/img/components/button-menu.png)

<!--  -->

### Input

The <svg class="ico" ><use xlink:href="#svg-mat-input" /></svg> **Material Input** component, sometimes referred to as a "text field", is a common form control with built-in focus state, behaviors and customization. When paired with [data](/data) and [actions](/actions/) this control becomes a powerful way to respond to user interaction. For a more barebones version, check out the [primitive input](/components/primitives/#input).

![](/static/img/components/mat-input.png)

Selecting the **Chips** option will convert the input's value to chips. Each chip value should be separated by a comma. Currently, autocomplete isn't supported but something we're looking into.
![](/static/img/components/mat-input-chips.png)

<div class="two-col">

When interacting with the chips input in preview mode, new chips can be added by entering text and pressing `Enter`, `Comma`, or bluring the input. Chips can be removed via `Backspace`, or clicking the (x) icon.

</div>

The **textarea** type allows the text within the input to wrap to multiple lines. The `Row Count` values determine the minimum amount of rows the textarea should have (height) and maximum number of rows to show before the textarea should start scrolling.

![](/static/img/components/mat-textarea.png)

<!--  -->

### Select

The <svg class="ico" ><use xlink:href="#svg-mat-select" /></svg> **Select** is another common form control, sometimes referred to as a dropdown or spinner, that provides a list of choices for a user. Attach an [action](/actions/) to trigger a behavior based on user selection.

![](/static/img/components/mat-select.png)

<!--  -->

### Date Picker

The <i class="ico btm">date_range</i> **Material Date Picker** provides a way for users to input a date based on a specific format. There is also the ability to configure the [primitive input](/components/primitives/#input) to show a date.

![](/static/img/components/mat-datepicker.png)

<!--  -->

### Checkbox

The <i class="ico btm">checkbox</i> **Checkbox** component allows the user to toggle between checked, unchecked and indeterminate.

![](/static/img/components/mat-checkbox.png)

Checkboxes can be nested using the `children` property to automatically setup parent / child relationships. This means that when a user interacts it will update the state of the parent and children without the need for an action. 
![](/static/img/components/nested-checkboxes.png)

<!--  -->

### Switch

The <i class="ico btm">toggle_on</i> **Switch** component can be used to toggle between two different states.

![](/static/img/components/mat-switch.png)

<!--  -->

### Radio Button

The <i class="ico btm">radio_button_checked</i> **Radio Button** component is another form control similar to [select](#select). Attach an [action](/actions/) to trigger a behavior based on user selection.

![](/static/img/components/mat-radio.png)

<!--  -->

### Slider

The <svg class="ico" ><use xlink:href="#svg-mat-slider" /></svg> **Slider** component provides a numeric range for uses to interact with. This can be [data-bound](/data/) to an [input](#input) to show the value.

![](/static/img/components/mat-slider.png)

<!--  -->

### Button Group

The <svg class="ico" ><use xlink:href="#svg-mat-btn-group" /></svg> **Button Group** component is a collection of buttons that support single or multi-select.

![](/static/img/components/mat-button-group.png)

<!--  -->

### Spinner

The <i class="ico btm">progress_activity</i> **Spinner** is a circular progress indicator used to express an unspecified wait time or display the length of a process. Animation can be started by selecting `Indeterminate` from the properties panel.

![](/static/img/components/mat-spinner.png)

<!--  -->

### Progress Bar

The <svg class="ico" ><use xlink:href="#svg-mat-progress" /></svg> **Progress Bar** is another progress indicator with similar behavior to that of [Spinner](#spinner). Animation can be started by changing the `Mode` property to indeterminate, buffer or query.

![](/static/img/components/mat-progress.png)

<!--  -->

### Chip List

The <svg class="ico" ><use xlink:href="#svg-mat-chiplist" /></svg> **Chip List** shows a list of defined values. Attach an [action](/actions/) to trigger a behavior based on user selection.

![](/static/img/components/mat-chiplist.png)

<!--  -->

### Tabs

The <svg class="ico" ><use xlink:href="#svg-mat-tabs" /></svg> **Tabs** component can display the contents of other boards as tabs. This behavior is similar to that of a [portal](/components/primitives/#portal) with the caveat that navigation occurs at the top most board only.

![](/static/img/components/mat-tabs.png)

### Stepper

The <svg class="ico" ><use xlink:href="#svg-mat-stepper" /></svg> **Stepper** is another component based on [portals](/components/primitives/#portal) that can display the contents of a board at each step.

![](/static/img/components/mat-stepper.png)

### Expansion Panel

The <i class="ico btm">keyboard_arrow_up</i> **Expansion panel** is another component based on [portals](/components/primitives/#portal) that can display the contents of boards for each panel.

![](/static/img/components/mat-exp.png)

### Google FAB

The <i class="ico btm">add_circle_outline</i> **Google FAB** is a Google-specific version of the FAB (Floating Action Button).

![](/static/img/components/google-fab.png)

---

### Navigation

The <i class="ico btm">menu</i> **Navigation** component is a versatile tool that handles navigation events for you. Each navigation item can be configured to navigate within your project or to a URL. Learn more in the [Navigation Component Guide](/guide/nav-component-guide/).

![](/static/img/components/navigation.png)

---

### Modal

A modal, also known as a dialog or popup, refers to a common pattern for displaying content. Modal is not a component available in the panel but can be added and customized using the [modal action](/actions/modal/).

![](/static/img/components/modal-example.png)

### Drawer

A drawer, also known as a side panel, refers to a common pattern for displaying navigation, menus or controls on the edges of the screen. Like the modal, drawers are available using the [drawer action](/actions/drawer).

![](/static/img/components/drawer-example.png)

### Snackbar

A snackbar, also referred to as a toast, is a component pattern used to display notifications. Notifications can be dispatched from any component, see the [snackbar action](/actions/snackbar/) for details.

![](/static/img/components/snackbar-example.png)

