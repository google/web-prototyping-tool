# WebPrototypingTool Application Frontend

## App Debug Tooling

- Advanced settings panel
- Feature flags
- Debug Graph
- Debug Message communication

## App Assets

- The image asset directory is served from [/src/assets/](assets/)
- SVG is the recommended format for all icons and assets.
- png|svg|gif have a 1hr cache defined in the [/app.yaml](../app.yaml)
- Use [svgo](https://github.com/svg/svgo) to optimize SVGs before adding them to the repo
- A Sketch file [/assets.setch](../assets.setch) is included in the root of the repo which is the source of all icons in the product

### Firebase

For firebase offline support we need to enable persistence but currently synchronously writes to a local database which slows down app performance. We're waiting for this issue to be resolved [https://github.com/firebase/firebase-js-sdk/issues/983](https://github.com/firebase/firebase-js-sdk/issues/983)

## App Styles

- Light Theme [/src/styles/themes/default.scss](styles/themes/default.scss)
- Dark Theme [/src/styles/themes/dark.scss](styles/themes/dark.scss)
- CSS Mixins located in [/sass-utils/](sass-utils/)

## App Routes

### Dashboard

`/src/app/routes/dashboard`

### Project

This is the editor experience

`/src/app/routes/project`

### Preview

`/src/app/routes/project/preview`

### Admin

`/src/app/routes/project/news-editor`

## App Systems

### App Store

- [AppStore](app/store) - Global app store used for routing
- [ProjectStore](app/routes/project/store) - Store per project

### App Keyboard Shortcuts

All keyboard shortcuts are defined in the configuration located here: [src/app/routes/project/configs/project.config.ts](app/routes/project/configs/project.config.ts). Each config is an [IConfig](../projects/cd-interfaces/src/index.ts#L139) which maps to actions defined in the project store and is also used to populate context menus.

### App Design Surface

The design surface is made up of 3 UI Layers and a few communication services

- **Canvas** - AKA the viewport for boards which also manages panning and zooming
  - [Component](app/routes/project/components/canvas/canvas.component.ts) ( canvas.component.ts )
  - [Service](app/routes/project/services/canvas/canvas.service.ts) ( canvas.service.ts )
- **Glass Layer** - SVG layer above the canvas for drawing design surface details like hover, selection, etc.
  - This component is made up of multiple "panes"
  - [Component](app/routes/project/components/glass-layer/glass-layer.component.ts)
  - [InteractionService](app/routes/project/services/interaction/interaction.service.ts) - Manages communication between glass and layers tree
- **Outlet Frames** - The wrapper for each board iframe
  - [Component](app/routes/project/components/outlet-frame/outlet-frame.component.ts)

### App Services

- [DndService](app/routes/project/services/dnd/dnd.service.ts) Manages Drag & drop
- [RendererService](app/services/renderer/renderer.service.ts) Manages communication between the renderer and main app
- [InteractionService](app/routes/project/services/interaction/interaction.service.ts) - Manages selection, hover, etc
- [SelectionContextService](app/routes/project/services/selection-context/selection.context.service.ts) - Context for currently selected element used by glass, top bar and layers tree
- [PropertiesService](app/routes/project/services/properties/properties.service.ts) Service for properties CRUD opertations
- [DatabaseService](app/database/database.service.ts) Firebase communication
- [AssetsService](app/routes/project/services/assets/assets.service.ts) Manages asset uploading
- [ClipboardService](app/routes/project/services/clipboard/clipboard.service.ts) Manages the clipboard

### App Properties

Properites are generated dynamically based on configurations defined in `cd-common/models`.
See configuration [docs](../projects/cd-common/models/README.md)

- [Dynamic Properties Component](app/routes/project/components/properties/dynamic-properties/dynamic-properties.component.ts)
- [PropertiesService](app/routes/project/services/properties/properties.service.ts)
- [AdvancedProperties](../projects/cd-common/src/lib/components/properties/advanced-props/advanced-props.component.ts) - CSS Key / Value editor

### App Image Upload

- [AssetsService](app/routes/project/services/assets/assets.service.ts) Manages asset uploading

### App Layers tree

- [LayersTreeComponent](app/routes/project/components/layers-tree/layers-tree.component.ts)
- [LayersTreeService](app/routes/project/services/layers-tree/layers-tree.service.ts)

