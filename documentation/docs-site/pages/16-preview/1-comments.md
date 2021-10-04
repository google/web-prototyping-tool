---
title: 'Commenting'
date: Last Modified
permalink: /basics/comments/index.html
toc: true
eleventyNavigation:
  order: 1
  parent: preview
  key: commenting
  title: 'Commenting'
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
    line-height: 0;
    vertical-align: middle;
    padding: 3px 8px;
  }

</style>

In addition to creating prototypes and testing them, users can collaborate in [preview](/basics/preview) mode by commenting on your prototypes. The comments panel can be used for discussion about the prototype pages as well as alerting other users about your project.

To view the comments for a board in your project, navigate to preview page for a [board](/basics/boards#preview) and open the comments panel, found in the [top bar](/basics/preview#top-bar).

<!-- ![](/static/img/preview/comments.png) -->

@[video](/static/img/preview/comments.webm)

_**Tips:**_

- The comments panel can also be opened by pressing the `C` key while in [preview mode](/basics/preview)
- The project owner will receive emails for every comment created

## Creating a Comment

To start a new thread, just type in the "Add comment" field and click "Comment" or press `Command + Enter` (macOS). Comments may consist of any form of text, and links will even be clickable inside the comment card.

@[video](/static/img/preview/new-comment.webm)

### Tagging a User

In addition to URLs, anyone at Google can be notified of your comment by tagging them. This can be initiated by typing the `+` character followed by the username. Once you start typing out the username, a list of matching users will show and one can be selected to attach them to the comment. Once the comment is sent, the user will receive an email alerting them that they have been tagged in a comment on the project.

![](/static/img/preview/tag-user.png)

<!-- Possibly use video instead, but two videos next to each other might be a lot -->
<!-- @[video](/static/img/preview/tag-user.webm) -->

### Attaching to an Element

To further focus in feedback on your designs, a specific component can be attached to a comment thread, highlighting the component on the board. To do this, just click the "Selection" icon and select an element on the board. Once selected, type out your message and send. The thread created will have a number signifying which element it is connected to. This number also appears on the board in the [prototype window](/basics/preview#prototype-window).

_**Tip:** Hover over the thread to show which rectangle it is connected to on the board_

@[video](/static/img/preview/attach-to-element.webm)

## Threads

Underneath the top "new comment" card is the list of open comment threads for this particular board. Threads are ordered by when they were created and will stay in the list until resolved or deleted.

Just like the "new comment" card, threads have a text field, labeled "Reply". Type your message into that field and send, just like starting a new thread. As a result, the owner of the project as well as anyone involved with that comment thread will receive an email letting them know there was a new comment.

![](/static/img/preview/threads.png)

## Comment Counts

There are several places throughout WebPrototypingTool that shows You can see the number of comments per board in three places:

- Next to the board name for each board in [editor](/basics/editor) mode
- Next to the board name for each board in the [board list](/basics/preview#board-%2F-component-list) in [preview](/basics/preview) mode
- Total number of comments as an icon on the project card from the [dashboard](/basics/dashboard)

## Resolving vs Deleting

Comment threads can be resolved or deleted. Deleting removes the comment entirely and cannot be undone, as opposed to resolving a comment thread which hides the comment from view but does not remove it from the project.

Resolved comments can be shown by checking the "Show resolved" switch at the top of the comments panel. This will add those comment threads back into the panel with a <strong class="preview-btn">Re-open</strong> button on each resolved thread.

@[video](/static/img/preview/resolve-vs-delete.webm)
