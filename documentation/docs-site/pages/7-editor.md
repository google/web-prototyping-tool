---
title: The Editor
date: Last Modified
permalink: /basics/editor/index.html
toc: true
eleventyNavigation:
  order: 7
  key: basics-editor
  title: The Editor
---

The editor is where prototype magic happens. :tada: Each area of the interface is optimized for specific tasks to build and manage a project.

@[video](/static/img/basics/sections.webm)

### Activity Panels

Starting from the left, there are a series of panels used for managing project content. Toggle each panel's visibility by clicking its corresponding icon along the left side.

![](/static/img/basics/panels.png)

<div class="hide-table-top">

|                                                                                                    |                                                                                                                    |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| <i class="ico btm">add</i> **Components:** Create, manage and use [components](/components-guide/) | <i class="ico btm">insert_chart_outlined</i> **Data:** Add, edit and manage [data](/data/) sources                 |
| <i class="ico btm">layers</i> **Layers:** Visualize [layer](/basics/layers) hierarchy              | <i class="ico btm">help_outline</i> **About:** Find helpful links and latest updates to the app                    |
| <i class="ico btm">styles</i> **Theme:** Manage colors, fonts, icons and [more](/theme/)           | <i class="ico btm">settings</i> **Settings:** Toggle "dark mode" and other [options](/beyond-the-basics/settings/) |
| <i class="ico btm">photo</i> **Assets:** Upload [images](/assets/) or browse the catalog           |

</div>

<!-- TODO: Finish this section  -->

### Top Bar

The top bar displays actions based the current context and state of the editor such as component or board selection. Additionally there are persistent placement for [preview](/basics/preview/) and [sharing](/basics/sharing-embed/).

@[video](/static/img/basics/topbar3.webm)

### Context Menus

Selecting a component will show a floating menu with some common contextual actions depending on the current component or board. Right clicking will also show a menu with various editor behaviors.

![](/static/img/basics/context-menus.png)

_**Tip:** The floating menu can be disabled in the [settings](/beyond-the-basics/settings/) panel._

<!-- TODO -->

### Design Surface

The design surface is an infinite canvas where design occurs. [Boards](/basics/boards/) represent destinations within a prototype. Unlike other tools, components may only be placed within boards and are not permitted elsewhere.

![](/static/img/basics/design-surface.png)

### Panning

Swipe over the design surface with a trackpad or hold `spacebar + click` and drag with a mouse to pan in any direction. Alternatively, use the mouse wheel to scroll vertically and `Option + Shift + Wheel` (macOS) to scroll horizontally.

@[video](/static/img/basics/pan.webm)

The [keyboard](/basics/shortcuts/) directional arrows can also be used to pan when nothing is selected.

### Zoom

Pinch and zoom using a trackpad gesture, hold `Command + Wheel` (macOS) to zoom in and out or use the following [keyboard shortcuts](/basics/shortcuts/).

@[video](/static/img/basics/zoom.webm)

| Description             | Shortcut |
| ----------------------- | -------- |
| Zoom In                 | +        |
| Zoom Out                | -        |
| Reset Zoom              | 0        |
| Zoom to show all boards | 1        |
| Zoom to selected board  | 2        |

### Selection

#### Boards

Click and hold drag outside a [board](/basics/boards) to perform a marquee selection which will select multiple [boards](/basics/boards/) at once. Alternatively, one can hold `Shift` and click the labels of boards for the same result. After selection, click and hold inside any board to drag all of them.

@[video](/static/img/basics/marquee.webm)

_If a single board is selected, click and drag the board's label to move._

#### Nested layers

Layers may be nested within [groups](/components/primitives/#element) to form [layouts](/guide/layout/). By default, nested layers are not immediately selectable but **double-clicking** will select children under the cursor to better visualize hierarchy.

@[video](/static/img/basics/doubleclick.webm)

Alternatively, holding `Command` _(on macOS or ctrl on other platforms)_ and moving the cursor over a board provides a way to select any layer.

@[video](/static/img/basics/cmd-hover.webm)

::: callout
**Tip** Pressing `Esc` when a layer is selected will select its parent.
:::

#### Multi-select

To multi-select layers, hold `Shift` and clicking components on the design surface. When multiple components of the same type are selected, changes in the properties panel will be applied to all.

@[video](/static/img/basics/multi-select.webm)

### Drag & Drop

The primary way to place and re-order components is with drag and drop. There are two types of drag and drop available, **relative** and **absolute**, which are based on how content is [positioned on the web](https://developer.mozilla.org/en-US/docs/Web/CSS/position). To specify which method, use the `Position` property on any component. Lean more about defining layout [here](/guide/layout/).

![](/static/img/basics/position.png)

#### Relative

Relative is the **default** mode where content flows based on its relationship to the [board](/basics/boards) and other components. This is different from traditional design tools but the behavior matches how content works on the web. Learn more in the [layout](/guide/layout/) section about using relative position.

@[video](/static/img/basics/relative-dnd.webm)

**Tips**

- While dragging, the parent container will highlight to provide context.
- Dragging to the edges of a component to position before or after.
- Press `Esc` while dragging to cancel drag and revert changes.
- While dragging, move the cursor slowly for more precision or fast to skip over nested content.
- To prevent unintended nesting, WebPrototypingTool uses pattern matching to detect siblings.

#### Absolute

With Absolute position, placement is based on its coordinates within a board or container. The behavior is similar to how traditional design tools work but content can be pinned to specific edges from the properties panel. Learn more in the [layout](/guide/layout/) section about using absolute position.

@[video](/static/img/basics/absolute-dnd.webm)

**Tips**

- The arrow keys can be used to move the coordinates of absolute positioned layers.
- Absolute can be set as the default position mode from the [settings](/beyond-the-basics/settings/#prefer-absolute-position) panel.

### Re-ordering

The selected layer can be re-ordered within a group or board using the arrow keys or holding `shift` after [relative](#relative) position drag has started. For best results use the [layers](/basics/layers) panel to define layer order. [Absolute](#absolute) positioned layers can be re-ordered using `Command + ]` or `[` (macOS) which affects the [z-index](https://developer.mozilla.org/en-US/docs/Web/CSS/z-index).

@[video](/static/img/basics/reorder.webm)

### Resizing

Click and drag the edges of the selected [component](/components-guide/) or [board](/basics/boards/) to resize them. Component width and height can be defined by pixels, percentage or automatic. When using percentage, the size will be a percentage of the total width of its parent [element](/components/primitives/#element) group or [board](/basics/boards/). Auto can vary depending on the current layout.

@[video](/static/img/basics/resizing.webm)

::: callout
**Tip** Double-clicking the edge of the selected component is a shortcut to expand the width or height to 100%.
:::

## Properties

The properties panel provides information and controls for the current context such as [components](/components-guide/), [boards](/basics/boards/) and the current project. For project properties, deselect all by clicking anywhere on the design surface outside of a board.

![](/static/img/basics/props.png)
