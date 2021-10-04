# Radio Group Component

## Examples

RadioComponent Example
(Note: Due to the nature of radios, you should not be using this outside of a radio group, look at using checkbox or toggle instead)

```html
<cd-radio
  name="name"
  value="value"
  size="small"
  selected
  disabled
  (selectedChange)="onSelectedChange($event)"
>
  Label Name
</cd-radio>
```

To use a radio group, you can either pass in data

```html
<cd-radio-group
  label="Data generated radios"
  name="radio-test-1"
  size="small"
  [radioData]="radioData"
  (selectedValueChange)="change1($event)"
></cd-radio-group>
```

or yield in radios manually.

> _NOTE: Including the radio templates manually will prevent you from dynamically adding more after the view has rendered. If you wish to dynamically add radio buttons, use the `radioData` Input_

```html
<cd-radio-group label="Manually created radios" name="radio-test-2" size="large" disabled>
  <cd-radio value="german">Guten Tag</cd-radio>
  <cd-radio value="spanish">Hola</cd-radio>
</cd-radio-group>
```

Or both!

```html
<cd-radio-group
  label="Both data generated and manual radios"
  name="radio-test-3"
  [radioData]="radioData"
  (selectedValueChange)="change3($event)"
>
  <cd-radio value="german">Guten Tag</cd-radio>
  <cd-radio value="spanish">Hola</cd-radio>
</cd-radio-group>
```

> _Note: For a11y reasons, the HTML output is using [w3c suggested native elements](https://www.w3.org/WAI/tutorials/forms/grouping/#radio-buttons)._

## Property API

| Property                       | Type                   | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `label` _`(optional)`_         | `string`               | Overall group title. <br /> If you do not provide the label (which is a visible label), you should at least provide an aria-label to the group. <br /> `<cd-radio-group aria-label="foo">`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `radioData` _`(optional)`_     | `IRadioData`           | Object to define radios to be generated by the group. <br /> If you do not provide radioData then you are probably using ng-content yielded radios. Otherwise the group will be empty. <br /> You can define: value (required), label, selected, disabled                                                                                                                                                                                                                                                                                                                                                                                                                                                    |  |
| `selectedValue` _`(optional)`_ | `string`               | Value of which radio is selected <br /> This is optional as an input, as a group does not have to have an initial selected option. <br /> You can also manually select which radio is selected through radioData or ng-content radios... <br /> HOWEVER, if you set this selectedValue input on the group, it will trump any individual selected. This is because radio groups can only have one selected at a time! <br /> Even if not initially provided as an input, selectedValue is still used internally to track the current value.                                                                                                                                                                   |
| `name` _`(optional)`_          | `string`               | Group name for all radios to share. Generated if not provided <br /> On component init: any individual radio name overrides are ignored, and updated with either your provided group name or a unique generated name. This is because all names in a group MUST be the same at all times. <br /> On change: All radios in the group are changed at once, any original individual overrides are still ignored. <br /> You cannot individually change names for radioData based radios but you can technically still manually override names on component yielded (ng-content) radios. But this is highly discouraged as you will break the group!                                                             |
| `size` _`(optional)`_          | `enum ComponentSize`   | String enum value to describe the size of all radios. <br /> On component init: any individual radio name overrides are ignored, all radios are sized the same as the group setting (since the group default is medium, they will all be medium) <br /> On change: all radios in the group are changed at once, any original individual overrides are ignored. <br /> You cannot change size for radioData based radios but you can technically still manually override sizes on component yielded (ng-content) radios after the fact. The size input was only really intended for usage of radio group, and having uneven sizes is not a great UX pattern, so do this only if there is a compelling reason. |
| `disabled` _`(optional)`_      | `boolean`              | Whether all radios in the group are disabled at once. <br /> When true, disables all radios no matter their individual overrides. <br /> When false, returns all radios to enabled state, except that it respects any individual disabled overrides on radioData. However ng-content radios' original disabled values will still get overriden to true. <br /> (TODO: should we come up with a solution to preserve ng-content radio presets?)                                                                                                                                                                                                                                                               |
| `selectedValueChange`          | `EventEmitter<string>` | Emitted when any radio is selected, emits value of selected radio.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

---

# Radio Component

Under the hood, RadioGroupComponent is using a basic RadioComponent. Radio should be used inside RadioGroupComponent whenever possible.
The label is yielded into the ng-content. HTML is usable!

```html
<cd-radio value="english">Hello</cd-radio>
```

## Property API

| Property                  | Type                   | Description                                                                                                                                                                                                                                |
| ------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `name` _`(optional)`_     | `string`               | Name belonging to form group. <br /> Do not provide this directly if you are using radio inside a radio group. RadioGroupComponent sets all of the names so they are the same. You should really always be using a radio group for radios. |
| `value` _`(required)`_    | `string`               | Value of the radio input                                                                                                                                                                                                                   |
| `selected` _`(optional)`_ | `boolean`              | Whether the radio is currently selected                                                                                                                                                                                                    |
| `disabled` _`(optional)`_ | `boolean`              | Whether the radio is currently disabled                                                                                                                                                                                                    |
| `size` _`(optional)`_     | `enum ComponentSize`   | String enum value to describe the size of the radio. <br /> ('small' 'medium' 'large' - default is medium)                                                                                                                                 |
| `selectedChange`          | `EventEmitter<string>` | Emitted when radio is selected, emits value of this radio.                                                                                                                                                                                 |

| Internal property | Type                | Description                                                                                            |
| ----------------- | ------------------- | ------------------------------------------------------------------------------------------------------ |
| `cdRef`           | `ChangeDetectorRef` | Public reference to radio's internal change detector, in order to trigger change detection externally. |