# cd-metadata

Data based on [atom/autocomplete-css](https://github.com/atom/autocomplete-css), [ChromeDevTools/devtools-frontend](https://github.com/ChromeDevTools/devtools-frontend/blob/master/front_end/sdk/CSSMetadata.js) and [adobe/brackets](https://github.com/adobe/brackets/blob/master/src/extensions/default/CSSCodeHints/CSSProperties.json)

### cd-metadata/css

```ts
import * as metaCSS from 'cd-metadata/css';
```

**Responsible for:** Autocomplete css attributes in the advanced properties panel

#### CSS Properties list

```js
import { cssProperties } from 'cd-metadata/css';
/*
  ...
  "animation-name",
  "animation-play-state",
  "animation-timing-function",
  "animation",
  "backface-visibility",
  "background-attachment",
  "background-blend-mode",
  "background-clip",
  "background-color",
  ...
*/
```

#### CSS Properties Map

Lookup table for css property values

```js
import { cssPropertyMap } from 'cd-metadata/css';
/*
  ...
  "align-content": ["center", "flex-end", "flex-start","space-around", "space-between", "stretch"],
  "align-items": ["baseline", "center", "flex-end", "flex-start", "stretch"],
  "align-self": ["auto", "baseline", "center", "flex-end", "flex-start", "stretch"],
  ...
*/
```

#### CSS Color properties list

List of css properties (keys) related to color

```js
import { cssColorProps } from 'cd-metadata/css';
// e.g "background-color"
```

#### CSS Distance properties list

List of css properties (keys) related to distance

```js
import { cssDistanceProps } from 'cd-metadata/css';
```

#### CSS Pseudo selectors list

List of css pseudo selectors(keys)

```js
import { cssPseudoSelectors } from 'cd-metadata/css';
// e.g  "::after"
```

### cd-metadata/html

```ts
import * as metaHTML from 'cd-metadata/html';
```

**Responsible for:** Autocompletion of HTML Tags & Attributes

#### HTML Tags list

```js
import { htmlTags } from 'cd-metadata/html';
/*
  ...
  "blockquote",
  "body",
  "br",
  "button",
  "canvas",
  "code",
  "div",
  "em",
  "form",
  "footer",
  "h1",
  "h2",
  ...
*/
```

#### HTML Tag Attributes map

Lookup table for available attributes on html tags.

```js
import { htmlTagAttributesMap } from 'cd-metadata/html';
/*
  ...
  "br": [],
  "button": [
    "autofocus",
    "disabled",
    "form",
    "formaction",
    "formenctype",
    "formmethod",
    "formnovalidate",
    "formtarget",
    "name",
    "type",
    "value"
  ],
  "canvas": ["height", "width"],
  ...
*/
```

#### HTML Attributes map

Lookup table for values on html attributes

```js
import { htmlAttributeMap } from 'cd-metadata/html';
/*
  ...
  "preload": ["auto", "metadata", "none"],
  "input/type": [
    "button",
    "checkbox",
    "color",
    "date",
    "datetime",
    "datetime-local",
    "email",
    "file",
    "hidden",
    "image",
    "month",
    "number",
    "password",
    "radio",
  ...
*/
```

### cd-metadata/file

```ts
import * as metaFile from 'cd-metadata/file';
```

**Responsible for:** Defines a list of accepted mimetypes

### cd-metadata/fonts

```ts
import * as metaFonts from 'cd-metadata/fonts';
```

**Responsible for:** Defining the list of font weights, variants and cross browser system fonts.

### cd-metadata/units

```ts
import * as metaUnits from 'cd-metadata/units';
```

**Responsible for:** Providing a constant for available units throughout the project, mainly the style attributes of the properties model. (px, %, em, etc)
