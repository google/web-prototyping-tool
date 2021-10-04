---
title: Assets
date: Last Modified
permalink: /assets/index.html
toc: true
eleventyNavigation:
  key: assets
  title: Assets
  order: 12
---

WebPrototypingTool makes it incredibly easy to import, manage, and incorporate imagery into prototypes. Imported assets are associated with and stored inside project. To get started, click the <i class="ico btm">photo</i> button in the left side bar or use the [shortcut](/basics/shortcuts/) key `G` to toggle the panel open or closed.

![](/static/img/assets/assets-hero.png)

## Upload files

WebPrototypingTool supports the commonly used image formats: **jpeg**, **png**, **svg** and **gif** (even animated ones!). SVG files are recommended for graphics that need to work at different sizes without losing quality. To add an image, click the <i class="ico btm">file_upload</i> upload button or drag the files anywhere within the editor window.

@[video](/static/img/assets/assets-upload.webm)

## Clipboard

The OS (operating system) clipboard can also be used to paste screenshots or images from other tools. On macOS, clipboard screen capture can be invoked with `Command + Shift + 4`.

@[video](/static/img/assets/assets-clipboard.webm)

_In the above video, an image is copied from a website and pasted into WebPrototypingTool then screen capture is invoked to captures part of the UI as an image._

## Asset Gallery

WebPrototypingTool provides a gallery of vector brand assets, logos and illustrations to accelerate prototype building. Click the <i class="ico btm">category</i> button at the top of the assets panel to launch the gallery. Some assets even have multiple color and style variants, hover over the bottom color swatches to preview and select.

@[video](/static/img/assets/assets-gallery.webm)

Multiple assets and variants can be selected at a time, when ready click the **Add selected** button in the bottom right corner. Additionally, check out the 5,000+ Material icons available for the [icon component](/components/primitives/#icon).

## Sketch & Figma

Copying layers as `SVG` from Sketch or Figma and pasting into WebPrototypingTool is an easy way to add assets.

![](/static/img/assets/assets-sketch-figma.png)

## Working with Assets

Dragging an image from the assets panel into a board will automatically create an [image component](/components/primitives/#image). The aspect ratio of the image is locked based on the original dimensions by default. Click the <i class="ico btm">locked</i> button within the size properties will allow for free resize.

@[video](/static/img/assets/asset-size.webm)

The [component](/components/primitives/#image) will fill the contents with the image based on the aspect ratio when the **Fit** property is set to `Cover`. Use the **Vertical** and **Horizontal** controls to adjust the image position.

<!-- TODO: Working with assets could be fleshed out further -->
