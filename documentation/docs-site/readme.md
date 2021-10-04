# WebPrototypingTool Docs

Docs are based on the [Eleventy](https://www.11ty.dev/docs/) static site generator.

## Commands

Run locally at [http://localhost:8080/](http://localhost:8080/)

```
npm run start-docs
```

Build docs only production

```
npm run build-docs
```

Build docs and marketing site for production

```
npm run build:all
```

Deploy all

```
npm run deploy
```

## Pages

Name your pages and folders (collection of pages) starting with a number for organization purposes such as `2-recipes.md`. The first page in a folder should be called `0-index.md`

## Metadata

At the top of each page we define the metadata which tells [Eleventy](https://www.11ty.dev/docs/) how to render this page.

```
---
title: Code Components
date: Last Modified
permalink: /components/code-components/index.html
toc: true
eleventyNavigation:
  key: code
  title: Code Components
  parent: components
  order: 4
---

```

| Name                      | Description                                            |
| ------------------------- | ------------------------------------------------------ |
| title                     | Text content                                           |
| date                      | `Last Modified` Shows the last time the doc was edited |
| permalink                 | Path to page (/docs/ is added automatically)           |
| goLink                    | Adds a go link under the title                         |
| toc                       | Enable the table of contents on a specific page        |
| eleventyNavigation        | Allows this page to show up in navigation              |
| eleventyNavigation.key    | Unique id of this page, used for nesting               |
| eleventyNavigation.title  | Title in the nav                                       |
| eleventyNavigation.parent | Parent key for nesting                                 |
| eleventyNavigation.order  | Order within a folder for this page                    |

The page order via `eleventyNavigation.order` should match the file name with the exception of `0-index.md` which should match the oder of the folder its created inside. For example:

- **Folder:** `2-components`
- **Index File:** `0-index.md`
  - **eleventyNavigation.order:** `2`

## Static Assets

Place static assets in `/docs/static/img/`

## URLs

Use absolute paths when linking to other pages. When built for production `/docs/` will be pre-pended to the url automatically:

```md
[starter projects](/components/code-components/starter-projects)
```

All section headers defined with `# Headers` automatically get an id which can be referenced in the following way:

```md
[sample projects](#samples)
```

or a header on a different page:

```md
[samples](/components/code-components/starter-projects/#samples)
```

## Custom Markdown Tags

### Callouts

Used to display an alert banner on a page in either green or yellow

```
::: callout
This is a yellow callout
:::

::: callout-green
This is a green callout
:::
```

### Video

To add an auto playing video to the page use the following format.

```md
@[video](/static/img/components/code/code-comp.webm)
```

Converts to...

```md
<video src="/static/img/components/code/code-comp.webm" loop="" autoplay="" muted="">
```

I recommend keeping video files under 2mb and using `webm` format.

Automator script for converting a `.mov` file to a `.webm`:

```bash
export PATH=/usr/local/bin:$PATH

folder=$(dirname $@)
out=$(basename $@ .mov)

ffmpeg -v warning -i "$@" -c:v libvpx-vp9 -minrate 300k -b:v 600k -maxrate 2500k  "$folder/$out.webm"
```

### Images

```md
![](/static/img/some-image.png)
```

Markdown supports adding custom html to a page. However, if you do this you'll need to make some adjustments for images and video coming from this site. Otherwise it wont load when built for production.

```md
<!-- Don't do this -->
<img src="/static/img/some-image.png">
<!-- Do this instead -->
<img src="{{'/static/img/some-image.png' | url}}">
```

The url pipe will add the `/doc/` path prefix when built for production, this is handled automatically if you use standard markdown images

### Embedded WebPrototypingTool pages

Embeding an iframe to show a WebPrototypingTool project or video can be done using the following tag:

```md
@[embed](https://google.com)
```

By default the embeded content is fixed to a `16/9` aspect ratio. to modify that ratio append the `[ratio]` tag then the desired value

```md
@[embed](https://google.com[ratio]16/8)
```

this is equivalent to the following:

```html
<div style="--aspect-ratio:16/9;">
  <iframe src="https://google.com" allowfullscreen></iframe>
</div>
```
