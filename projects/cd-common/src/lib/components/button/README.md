# Button

> Jump to [Toggle Button](#toggle-button)

CD Button provides directives, host bindings, and styles for buttons and toggle buttons in WebPrototypingTool.

## Basic Usage

```html
<button
  cd-button
  [size]="props.size"
  [disabled]="props.disabled"
  [iconSize]="props.iconSize"
  [iconName]="props.icon"
  [text]="props.title"
></button>
```

### Property API

| Property                  | Type                 | Description                                                                                   |
| ------------------------- | -------------------- | --------------------------------------------------------------------------------------------- |
| `size`                    | `enum ComponentSize` | String enum value to describe the size of a button.                                           |
| `text`                    | `string`             | Used as the button label.                                                                     |
| `iconName` _`(optional)`_ | `string`             | Name of icon for icon buttons. Icon names can be found at https://material.io/resources/icons |
| `iconSize` _`(optional)`_ | `enum ComponentSize` | String enum value to describe the size of an icon.                                            |
| `disabled` _`(optional)`_ | `boolean`            | The value of the disabled attribute on the `<button>` element.                                |

### Button Style Options

| Style                        | Attribute              | Description                                                                 |
| ---------------------------- | ---------------------- | --------------------------------------------------------------------------- |
| Button                       | `cd-button`            | Standard button. Filled with WebPrototypingTool's primary color.                      |
| Outlined Button              | `cd-outlined-button`   | An outlined button with no fill or elevation.                               |
| Dashed Button                | `cd-dashed-button`     | An dashed-outlined button with no fill or elevation.                        |
| Unelevated Button            | `cd-unelevated-button` | A filled button with no elevation.                                          |
| Shaped Button                | `cd-shaped-button`     | A button with semi-circle rounded edges. Shares the same contour as a chip. |
| Inverted Button              | `cd-inverted-button`   | A button no background, but primary color text.                             |
| Floating Action Button (FAB) | `cd-inverted-button`   | A circular button with an icon.                                             |

---

---

## Toggle Button

```html
<button
  cd-button
  cdToggleButton
  unselectedIconName="favorite_border"
  selectedIconName="favorite"
  [size]="props.size"
  [disabled]="props.disabled"
  [iconSize]="props.iconSize"
  [(selected)]="props.selected"
  (click)="props.selected = !props.selected"
></button>
```

### Directive

| Directive        | Description                             |
| ---------------- | --------------------------------------- |
| `cdToggleButton` | Turns CD Button into a CD Toggle Button |

### Two-way data binding

Toggle buttons require a two-way variable binding in the component and template. E.g.:

```typescript
/** Component Code */

@Component({
  selector: 'my-component',
  templateUrl: './my-component.component.html',
  styleUrls: ['./my-component.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyComponent implements OnInit {
  private _selected = false;

  get selected(): boolean {
    return this._selected;
  }

  set selected(selected: boolean) {
    this._selected = selected;
  }
}
```

```html
<!-- Template Code -->

<button
  cd-button
  cdToggleButton
  [size]="size"
  [(selected)]="selected"
  (click)="selected = !selected"
></button>
```

### Toggle Types

To acheive toggle buttons, use these additional attributes on your `<button cd-button>` element.

> _NOTE: The `cdToggleButton` directive and the uni-directionally bound `selected` variable must exist in the template for these to work._

#### Toggle between two font icons

| Attribute            | Type   | Description                                                                               |
| -------------------- | ------ | ----------------------------------------------------------------------------------------- |
| `selectedIconName`   | string | The name of an icon as it exists on [Material Icons](https://material.io/resources/icons) |
| `unselectedIconName` | string | The name of an icon as it exists on [Material Icons](https://material.io/resources/icons) |

#### Toggle between two svg icons

| Attribute            | Type   | Description                                         |
| -------------------- | ------ | --------------------------------------------------- |
| `selectedIconName`   | string | The url of an svg file. E.g.: `/assets/youtube.svg` |
| `unselectedIconName` | string | The url of an svg file. E.g.: `/assets/logo.svg`    |

#### Toggle state for a single font icon

| Attribute  | Type   | Description                                                                               |
| ---------- | ------ | ----------------------------------------------------------------------------------------- |
| `iconName` | string | The name of an icon as it exists on [Material Icons](https://material.io/resources/icons) |

#### Toggle state for a single SVG icon

| Attribute  | Type   | Description                                      |
| ---------- | ------ | ------------------------------------------------ |
| `iconName` | string | The url of an svg file. E.g.: `/assets/logo.svg` |

#### Toggle for a button without an icon

| Attribute | Type | Description |
| --------- | ---- | ----------- |
| N/A       |      |             |

#### Toggle for multiple buttons

| Attribute | Type                    | Description                                                  |
| --------- | ----------------------- | ------------------------------------------------------------ |
| `states`  | (See following example) | Used to manage the presentation of a group of toggle buttons |

```typescript
const states = [
  {
    id: 'cd-button',
    classAttr: 'cd-button',
    iconName: 'add',
    text: 'Submit',
  },
  ...
]
```
