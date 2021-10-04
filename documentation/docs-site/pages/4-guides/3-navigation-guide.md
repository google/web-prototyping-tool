---
title: 'Navigation Component Guide'
date: Last Modified
permalink: /guide/nav-component-guide/index.html
eleventyNavigation:
  order: 3
  parent: guide
  key: navigation-guide
  title: Navigation Component Guide
---

## Overview

The <i class="ico btm">menu</i> **Navigation** component is a versatile tool that handles navigation events for you.

This guide will walk you through the configuration options for the **Navigation** component, as well as provide several example projects for you to try.

## Configuration

The [Navigation](/components/material/#navigation) component has a few basic configuration options, and each **Navigation Item** can be configured for a wide variety of usecases, including [Project Navigation](#project-navigation), [Portal Changing](#linking-to-a-portal), and [URL Navigation](#url-navigation)

<!-- TODO: Screenshot showing the props panel and possibly nav item config modal -->

@[video](/static/img/nav-guide/nav-guide-configuration.webm)

### Project Navigation

By default, the navigation component will navigate the current board to another based on the "**Destination**" configuration option per item.

<!-- TODO: Screenshot assigning one nav item for board nav and preview that -->

![](/static/img/nav-guide/nav-guide-project-navigation.png)


### Linking to a Portal

A [Portal](/components/primitives#portal) can be linked as the component's "**Target**", which makes the component behave similar to [Tabs](#tabs). Each navigation item will change which board the portal is pointing to.

<!-- TODO: Insert screenshot/movie showcasing linking to a portal -->

![](/static/img/nav-guide/nav-guide-linked-portal.png)

_**Tip:** If you'd like a navigation item to navigate the board instead, check the "**Top**" configuration option_

::: callout
**Destination Options:** The current board will be removed from your "**Destination**" options if a portal is linked and the "**Top**" option is not selected. This is to stop infinite recursion if a portal references the board it's already on.
:::


### URL Navigation

In addition to navigating within your project, navigation items can navigate to a URL. Each URL-based nav item also has the configuration option to open that URL in a new window. If that is selected, a <i class="ico btm">open_in_new</i> icon will show on that nav item on hover.

<!-- TODO: Add in movie showcasing URL navigation and open in new tab -->

![](/static/img/nav-guide/nav-guide-url-navigation.png)

