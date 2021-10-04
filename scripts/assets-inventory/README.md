# Assets Gallery Script

This script is used to generate the data and manifest for WebPrototypingTool's Asset Gallery.

_NOTE: This tool used to be called Assets Importer. Terms are used interchangeably throughout the codebase_

run:

```
npm run build

node lib generate --config <path-to-config>
```

_NOTE:_ Running this command without the config option will only generate the product icons whose assets are stored in Drive.

## Catalogs

If generating from a catalog (a folder of images and a `config.json` file), ensure that your catalog looks like this:

1. One top level folder, the name of which is not considered in generating your assets
2. Any number of images, or sub-folders with images in them. These can by any image type
3. A `config.json` file in the root of the folder

## `Config.json`

Config files should be a json file containing one array of objects of the following shape:

```json
[
  {
    "category": "system-icon",
    "name": "Activity",
    "variants": {
      "flat": "activity/activity.svg"
    }
  },
  ...
]
```

### Categories

Can be one of type `AssetCategory`:

```ts
enum AssetCategory {
  ProductIcon = 'product-icon',
  SystemIcon = 'system-icon',
  Illustration = 'illustration',
}
```

### Name

A human readable name for your asset. This is used as the display name in the UI

### Variants

An `IStringMap<string>` of variants. The key of each variant is used for tooltips in the UI, and also styling purposes. Keys can be any string, but using one of `AssetVariant` will render unique styling of variant checkboxes in the UI. The `flat` variant, if included, will always be the preview for the asset in the UI until a different variant is selected.

```ts
enum AssetVariant {
  Color = 'color',
  Multicolor = 'multicolor',
  Flat = 'flat',
  Shaded = 'shaded',
  Blue = 'blue',
}
```

The value of a variant should be the entire path of your asset from the root of the folder.

E.g.: A top level folder called `my-assets` with the following structure:

`my-assets > cool-asset > cool-asset-flat.svg`

would become:

```json
{
  "category": "system-icon", // or product-icon or illustration
  "name": "Cool Asset",
  "variants": {
    "flat": "cool-asset/cool-asset-flat.svg"
  }
}
```
