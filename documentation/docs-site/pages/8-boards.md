---
title: 'Boards'
date: Last Modified
permalink: /basics/boards/index.html
toc: true
eleventyNavigation:
  order: 8
  key: basics-board
  title: Boards
---

<!-- Additional styling for some buttons below -->
<style>
  .preview-btn{
    font-weight: 400 !important;
    border-radius: 4px;
    font-size: 0.82em;
    box-sizing: border-box;
    cursor: pointer;
    background: #7c4dff;
    color: #fff !important;
    display: inline-grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: 4px;
    line-height: 0;
    vertical-align: middle;
    padding: 3px 8px 3px 4px;
  }

</style>

A board, often referred to as an "artboard" in other tools, represents a destination within a prototype. Unlike other tools, components may only be placed within boards and are not permitted elsewhere on the [design surface](/basics/editor/#design-surface). Boards in WebPrototypingTool are essentially web pages and components may have CSS properties that depend on a board for position and size. i.e `width:100%` or `position:absolute`.

Since WebPrototypingTool supports real components, [interactions](/actions/), and [data binding](/data/), for best results we recommend using one board per page within a prototype instead of a page per state.

@[video](/static/video/add-board.webm)

To add a board, click the <i class="ico btm">slides_add_on</i> button in the top bar or use the right click menu. If another board is selected, a board will be created to match the dimensions. Alternatively, a board can be drawn by pressing the shortcut key `A`. When the cursor changes to <i class="ico btm">add</i> simply draw the exact location and size of the board.

## Home board

The board with a filled home <i class="ico btm">home_filled</i> icon indicates the starting point for a prototype when [previewing](/basics/preview/). To assign a different board, select it and click the <i class="ico btm">home</i> in the properties panel to toggle it to the filled <i class="ico btm">home_filled</i> state or use the right click menu.

![](/static/img/board/home-board.png)

## Properties

Board properties are similar to those of [components](/components-guide/#component-properties) and supports [Actions](/actions/), [Accessibility](/accessibility/), and [CSS + Attribute overrides](/beyond-the-basics/component-overrides/).

![](/static/img/board/board-props-header.png)

<div class="two-col">

<img src="{{ '/static/img/board/board-props.png' | url}}" >

| Property                 | Description                                                                       |
| ------------------------ | --------------------------------------------------------------------------------- |
| [Frame](#frame-size)     | Size of the container for this component                                          |
| Padding                  | Adds padding inside the board                                                     |
| Overflow                 | Clip content or show [scrollbars](#scrolling)                                     |
| Direction                | Scroll vertical, horizontal or both                                               |
| Background               | Background color, the default value is bound to (surface) in the [theme](/theme/) |
| Image                    | Background image                                                                  |
| Cover                    | Tile, cover or contain the background image                                       |
| [Layout](/guide/layout/) | Default, Vertical / Horizontal Stack, or Grid                                     |

</div>

## Frame size

Resizing a board can be done from the properties panel or design surface by dragging the edges of a board. Common device size presets are available in the `Frame` dropdown to speed up this process.

![](/static/img/board/board-frame.png)

**Resize Tips**

- To automatically resize the board to fit its contents click the <i class="ico btm">fit_screen</i> button in the top bar or overlay menu.
- Hold `Shift` while resizing to maintain the aspect ratio

## Scrolling

Vertical scrolling is the default **overflow** property for new boards. Any content that is below the bottom edge of the board will be scrollable using a mousewheel or trackpad. Hover over offscreen elements in the layers tree to see the bounds of the current board and their position. 

@[video](/static/video/board-scroll.webm)

## Actions

An [action](/actions/) can be attached to **any component** within a board that will trigger when the user navigates to that board.

![](/static/img/board/board-appears.png)

## Preview

By default clicking the <strong class="preview-btn"><i class="ico">play_arrow</i>Preview</strong> button will enter [preview mode](/basics/preview/) for the <i class="ico btm">home_filled</i> home board. To preview a specific board, select it and use the right click menu or the [keyboard shortcut](/basics/shortcuts/) `Command + Enter` (macOS)

![](/static/img/board/preview-board.png)
