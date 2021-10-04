---
title: 'Navigation Actions'
date: Last Modified
permalink: /actions/navigation/index.html
toc: true
eleventyNavigation:
  order: 1
  parent: actions
  key: actions-nav
  title: 'Navigation'
---

Navigation actions allow you to easily define the flow between [boards](/basics/boards/) and other [websites](#navigate-to-url).

## Navigate to board

A key difference from other prototyping tools is that WebPrototypingTool handles board navigation in context. For example, when navigating within a [portal](/components/primitives/#portal), [modal](/actions/modal/) or [drawer](/actions/drawer/), routing occurs within the container instead of globally. However, you can specify **"top level"** navigation by checking the option for `Top` in the action's config:

![](/static/img/actions/navigate.png)

_When board navigation actions are defined, lines on the design surface show the relationships and directionality._

::: callout
**Note:** In [preview](/basics/preview/) mode, user interactions with components such as checkboxes, dropdowns, etc. are persisted even after navigation. To reset the state of a board, attach a [reset state](/actions/state-changes/#reset-state) action.
:::

Let's look at some examples starting with basic navigation between [boards](/basics/boards/):

@[embed]()

**Demo:** Navigation within a portal

@[embed]()

**Demo:** Navigation within a modal

@[embed]()

## Navigate to url

WebPrototypingTool also supports navigating to other websites with the option to open in a new tab or the current window (default).

![](/static/img/actions/navigate-to-url.png)
