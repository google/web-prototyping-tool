---
title: Preview URL
date: Last Modified
permalink: /beyond-the-basics/preview-url/index.html
eleventyNavigation:
  key: preview-url
  parent: preview
  title: Preview URL
  order: 3
---

## Preview URL

Any prototype made in WebPrototypingTool can be [shared](/basics/sharing-embed) with another user. This is done by sending the URL for your project to another user. Below is an explanation of how the preview URL is structured:


### Preview Params

| View                | Query param                              | Notes                                                   |
| ------------------- | ---------------------------------------- | ------------------------------------------------------- |
| Current board       | `?id=[boardID]`                          | Defaults to home board if not provided                  |
| Rotate board        | `&rotate=1`                              |                                                         |
| Device type         | `&device=[device]`                       | See [device](#device) table below                       |
| Zoom level          | `&zoom=[level]`                          | See [zoom](#zoom) table below                           |
| Fullscreen          | `&fullscreen=1`                          |                                                         |
| Left Panel          | `&showLeftPanel=1`                       | Board navigation on the left                            |
| Comments panel      | `&comments=1`                            |                                                         |
| Color modes         | `&accessibilityMode=[mode]`              | See [color mode](#color-mode) table below               |
| Accessibility panel | `&accessibility=1`                       |                                                         |
| Heading greenlines  | `&accessibility=1&headings=1`            | Accessibility panel must be open for greenlines to show |
| Landmark greenlines | `&accessibility=1&landmarks=1`           | Accessibility panel must be open for greenlines to show |
| Flow greenlines     | `&accessibility=1&flow=1`                | Accessibility panel must be open for greenlines to show |
| Element info        | `&accessibility=1&elementId=[elementID]` | Accessibility panel must be open to see info            |

### Param Values

#### Device {data-toc-exclude}

Device is value of `&device=[device]`:
| Device | Code |
| -------------- | ----- |
| Fill screen | fit-to-screen |
| HDPI Laptop | laptop-hdpi |
| MDPI Laptop | laptop-mdpi |
| iPad Pro 11" | ipad-pro |
| iPad 9.7" | ipad |
| Pixel 3 XL | pixel-3-xl |
| Pixel 3 | pixel-3 |
| Pixel 2 | pixel-2 |
| iPhone X Max | iphone-x-max |
| iPhone X | iphone-x |
| iPhone 6/7/8 Plus | iphone-8-plus |
| iPhone 6/7/8 | iphone-8 |

#### Zoom {data-toc-exclude}

Zoom is value of `&zoom=[level]`:
| Zoom | Level |
| -------------- | ----- |
| Scale to Fit | scale-to-fit |
| 25% | 25 |
| 50% | 50 |
| 125% | 125 |
| 150% | 150 |
| 200% | 200 |
| any percent | [number] |

#### Color Mode {data-toc-exclude}

Color mode is value of `&accessibilityMode=[mode]`:
| Color condition | Mode |
| -------------- | ----- |
| Grayscale | 1 |
| Protanopiam | 2 |
| Deuteranomaly | 3 |

#### Embed Badge {data-toc-exclude}

Embed mode (`&embedMode=1`) has an additional option for showing the WebPrototypingTool badge.
Badge position is value of `&showBadge=[position]`:
| Badge Position | Query param value |
| -------------- | ----- |
| Top right | `tr` |
| Bottom right | `br` |
| Bottom left | `bl` |
| Top left | `tl` |
