---
title: 'Sharing & embed'
date: Last Modified
permalink: /basics/sharing-embed/index.html
toc: true
eleventyNavigation:
  order: 17
  key: sharing-embed
  title: Sharing & Embed
---

WebPrototypingTool makes it easy to [share](#sharing) and [embed](#embedding) your prototype in various view configurations with your collaborators.

@[video](/static/video/embed/click-share.webm)

## Sharing

While working on your prototype, you may wish to share your progress or final work with stakeholders and other collaborators.

WebPrototypingTool projects are already accessible to all Googlers and [TVCs](/getting-started/tvc-access/) who have been granted access. Sharing a project is simply a matter of sharing its URL.

![](/static/img/embed/share-url.png)

For preview mode, the URL uses [query params](/beyond-the-basics/preview-url/) to keep track of the current view configuration that your project is in. One way to share your project is to copy the URL from the browser address bar. Whatever view options you have selected will be in the URL.

We also have a **share dialog** to make it easier to pick and choose what you are sharing and quickly copy the link. There are a few differences between edit and preview mode.

To get started, in either [edit](/basics/editor) or [preview](/basics/preview) mode, open the share dialog via the <i class="ico" style="vertical-align: text-bottom">group</i>**Share** button in the top right of the application.

<img src="{{'/static/img/embed/share-dialog-preview-mode.png' | url}}" />

In edit mode, the share dialog will open with "Open in preview" as unchecked. This means the link in the input will send the user straight to edit mode. Toggling this will update the link to open the project in preview mode, and reveal more options.

| Feature           | Description                                                                                                                                                          |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Project url       | The url to share, reflects the current options chosen in the dialog.                                                                                                 |
| Copy to clipboard | Click the <i class="ico" style="vertical-align: text-bottom">content_copy</i> copy icon within the url input to copy the url to your clipboard.                      |
| View permissions  | Who has permission to view your project if this url is shared.                                                                                                       |
| Open in preview   | Whether to link to preview mode. Checked by default when opened in preview mode.                                                                                     |
| Full screen       | (Preview option only) Whether to display the project preview in full screen mode.                                                                                    |
| Comments          | (Preview option only) Whether the [comments panel](/basics/comments/) should be open. Cannot also be open with accessibility panel open.                             |
| Accessibility     | (Preview option only) Whether the [accessibility panel](/accessibility/handoff-collaboration/#sharing) should be open. Cannot also be open with comments panel open. |
| Owner             | Project owner                                                                                                                                                        |
| Done              | Close share dialog                                                                                                                                                   |

## Embedding

You can also embed your prototype externally. Use the embed dialog to grab the iframe code for your prototype with additional options for the embed. Click the <i class="ico" style="vertical-align: text-bottom">group</i>**Share** button to open the share dialog, then select the "Embed" tab.

@[video](/static/video/embed/open-embed.webm)

![](/static/img/embed/embed-dialog.png)

| Option                                                                   | Description                                                                                                   |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Embed preview                                                            | An iframe preview that shows you exactly how your project will look when embedded with current configurations |
| Embed code                                                               | Iframe code to embed. Click to copy to your clipboard.                                                        |
| Starting board                                                           | Which board to embed                                                                                          |
| Badge position                                                           | Where to position the WebPrototypingTool badge ([see docs](/basics/preview/#embed-badge))                               |
| Show badge                                                               | Whether to show the WebPrototypingTool badge on top of your project                                                     |
| Link only                                                                | Updates the code snippet to show the project link without the iframe wrapper                                  |
| Greenlines                                                               | Embed greenlines ([see docs](/accessibility/handoff-collaboration/#embed))                                    |
| <i class="ico" style="vertical-align: text-bottom">content_copy</i> Copy | Copy embed code to your clipboard                                                                             |
| Done                                                                     | Close embed dialog                                                                                            |
