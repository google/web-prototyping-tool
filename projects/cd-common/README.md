# Common Components

### Generating a new component

```
ng g c my-component --export
```

To import the component module `CdCommonModule` use the following:

```ts
import { CdCommonModule } from 'cd-common';
```

### cd-common/models

```ts
import * as models from 'cd-common/models';
```

Components rendered in the renderer, not to be confused with components that make up the UI of the main app: `cdCommonModule`

See documentation [here](projects/cd-common/models/README.md)

This library includes each component's:

- Templates
- Properties Models
- Properties Configuration - _Populates the properties panel_

### cd-common/consts

```ts
import * as consts from 'cd-common/consts';
```

Constants used in both the renderer and app

### cd-common/directives

```ts
import { CdDirectiveModule } from 'cd-common/directives';
```

Directives used in both the renderer and app

**Responsible for:**

- Attaching styles to elements in the Renderer
- Injecting innerHTML
- Showing / hiding elements

### cd-common/pipes

```ts
import { CdCommonPipeModule } from 'cd-common/pipes';
```

Pipes used in both the renderer and app.

**Responsible for:**

- Binding design system colors via `IValue`
- Formatting firebase timestamps
- Convert a font object into a shorthand css font value
- Filtering strings

### cd-common/services

```ts
import * as services from 'cd-common/services';
```

Services used in both the renderer and app.

**Responsible for:**

- Communicating between the renderer and app
- Communicating between preview and external iframe parent

### cd-common/utils

```ts
import * as utils from 'cd-common/utils';
```

Utils used in both the renderer and main app.

**Responsible for:**

- Transforming the design system into CSS Vars in the renderer
- Transforming component properties into CSS
