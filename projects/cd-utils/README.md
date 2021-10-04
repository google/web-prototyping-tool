# cd-utils

Generic reusable utilities, these are pure functions with no dependencies.

## cd-utils/array

Utilities for array manipulation.

```ts
import * as arrUtils from 'cd-utils/array';
```

## cd-utils/cache

A class for creating a cache of strings

```ts
import * as cacheUtils from 'cd-utils/cache';
```

## cd-utils/clipboard

Read and write to the clipboard

```ts
import * as clipboardUtils from 'cd-utils/clipboard';
```

## cd-utils/color

Color parsing and manipulation used by the color picker and design system

```ts
import * as colorUtils from 'cd-utils/color';
```

## cd-utils/content-editable

Util for calling [execCommand](https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand) used by the rich text editing

```ts
import { executeCommand } from 'cd-utils/content-editable';
```

## cd-utils/css

Helper functions for manipulating css

```ts
import * as cssUtils from 'cd-utils/css';
```

## cd-utils/guid

Generate and manage unique identifiers

```ts
import * as guidUtils from 'cd-utils/guid';
```

## cd-utils/dom

Generic dom manipulation utils

```ts
import * as domUtils from 'cd-utils/dom';
```

## cd-utils/drag

Utils to handle DragEvent which is used when dragging and dropping assets / data. ( Unrelated to our synthetic drag and drop service in the app )

```ts
import * as dragUtils from 'cd-utils/dom';
```

## cd-utils/files

Blob and file manipulation

```ts
import * as fileUtils from 'cd-utils/files';
```

## cd-utils/geometry

Utilities for distance, points, rectangles etc

```ts
import * as geoUtils from 'cd-utils/geometry';
```

## cd-utils/keycodes

Used to parse keyboard event codes.

`TODO: @` consolidate with `cd-metadata`

```ts
import * as keyUtils from 'cd-utils/keycodes';
```

## cd-utils/map

JavaScript Map() utils

```ts
import * as mapUtils from 'cd-utils/map';
```

## cd-utils/numeric

Number manipulation utils

```ts
import * as numUtils from 'cd-utils/numeric';
```

## cd-utils/object

Object utils for merging and equality

```ts
import * as objUtils from 'cd-utils/object';
```

Select text range or clear

## cd-utils/selection

```ts
import * as selectionUtils from 'cd-utils/selection';
```

## cd-utils/set

JavaScript Set() utils

```ts
import * as setUtils from 'cd-utils/set';
```

## cd-utils/string

String transformation

```ts
import * as stringUtils from 'cd-utils/string';
```

## cd-utils/stylesheet

Used by the renderer to add and remove stylesheets + fonts.

```ts
import * as sheetUtils from 'cd-utils/stylesheet';
```

## cd-utils/svg

Generate SVG Path information

```ts
import * as svgUtils from 'cd-utils/svg';
```

## cd-utils/url

```ts
import { openLinkInNewTab, prefixUrlWithHTTPS } from 'cd-utils/url';
```
