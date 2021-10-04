---
title: Preview
date: Last Modified
permalink: /basics/preview/index.html
toc: true
eleventyNavigation:
  order: 16
  key: preview
  title: Preview
---

Preview mode enables component behaviors and brings your prototype to life. This is a perfect place for validating designs and testing with users. To access this mode, click the preview button from the top bar of the [editor](/basics/editor#top-bar) or use the [keyboard shortcut](/basics/shortcuts) `Command + Enter` (macOS) when a [board/component](/basics/boards#preview) is selected.

The preview page can be shared with others collaborators for commenting, inspection and handoff.

@[video](/static/img/preview/preview.webm)

## Top Bar

At the top of preview mode there are a series of controls for adjusting how a prototype is displayed as well as quick access to commenting and accessibility reports.

![](/static/img/preview/top-bar.png)

_**Tips**_

- The comments panel button will have a purple dot to signify that there are comments in the project
- Most options from the top bar for the [prototyping window](#prototype-window) persist in the URL and are stored even if you go to [editor](/basics/editor) mode and back to preview mode

<div class="two-col">

<img src="{{ '/static/img/preview/clone-project.png' | url}}" >

<div>

### Clone Project

If you are not the owner of the project, a clone button will be added next to the **Project name** in the [top bar](#top-bar). This can be used to make a copy of the project so you can make changes.

</div>

</div>

<!-- ### Clone Project -->

<!-- If you are not the owner of the project, a clone button will be added next to the **Project name** in the [top bar](#top-bar). This can be used to make a copy of the project so you can make changes. -->

<!-- TODO: Screenshot showing the top bars comparing owner vs non-owner -->

<!-- ![](/static/img/preview/clone-project.png) -->

### Device Size

Changing the **Device Size** will adjust how large the board is to one of several standard sizes available including laptop and mobile sizes. By default, the **Device Size** is set to `Set to Board size`, which reflects the size of the board in [Editor Mode](/basics/editor). In addition, the `Fill Screen` size will fill the space underneath the [top bar](#top-bar), leaving room for the [board list](#board-%2F-component-list) on the left.

@[video](/static/img/preview/device-size.webm)

_**Tip:** With the `Fill Screen` option, opening any panel (Board list, Comments, Accessibility Panel) shrink in your prototype to still have the padding around it_

### Zoom

Similar to most visual tools, preview mode allows you to zoom in on your prototype. Aside from the usual percentage-based options, `Zoom to Fit` is included to fit your prototype within the confines of your browser window while maintaining the aspect ratio of your board.

@[video](/static/img/preview/zoom.webm)

### Fullscreen

Preview mode's **Fullscreen** feature will increase the size of your boards to fill the entire browser window. After a short time, the [top bar](#top-bar) will disappear and it will look as if the web page you're on **is** your board. Hovering over where the top bar would usually be will bring back the bar so you can toggle it off.

@[video](/static/img/preview/fullscreen.webm)

_**Tip:** Pressing `F` while in Preview mode will also toggle Fullscreen_

## Prototype window

At the center of preview mode is your prototype, starting from whichever board was previewed. This window is interactive and can change based on options controlled from the top bar.

![](/static/img/preview/prototype-window-2.png)

## Board / Component List

Along the left side of preview mode is a list of boards and components from your project. By default this is hidden from view, and can be shown by pressing the <i class="ico" style="vertical-align: text-bottom">list_alt</i> icon.

<div class="two-col">

@[video](/static/img/preview/board-list.webm)

| Section    | Description                                           |
| ---------- | ----------------------------------------------------- |
| Boards     | Boards in your project                                |
| Portals    | Boards in your project that are being used in portals |
| Components | Composed and Code Components in your project          |

</div>

_**Tip:** The number of [comments](/basics/comments) per board/component is listed next each option in the list, if any are present_

## Right Panel

The right portion of preview is a flex space where you'll find panels for specific tasks. These panels can be opened from the [top bar](#top-bar) and can be dismissed in the same way. The panels we currently support are: [Accessibility](/accessibility/testing-validation) and [Comments](/basics/comments#comments-panel)

@[video](/static/img/preview/right-panel.webm)

_**Tip:** Copying the URL while a panel is open will keep that state in the URL; when anyone goes to the URL, the panel will be open. To see more URL options for preview mode, see the [Preview URL](/beyond-the-basics/preview-url) page._
