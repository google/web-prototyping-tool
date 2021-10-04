# WebPrototypingTool Style Guide

Above all else, write code the team can easily follow and comprehend so anyone can jump in and contribute.
When possible keep it simple, concise, avoid unnecessary abstraction and anticipate change. Keep improving.

## CSS Style Guide

- Avoid deeply nested styles
- Avoid inline styles in the template
- Prefer [Grid layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout) over flex, and others
- Utilize CSS Variables located in [/src/styles/themes/default.scss](src/styles/themes/default.scss)
- We use [stylelint](https://github.com/stylelint/stylelint) But only enforced using the vscode extension
- Utilize our CSS Mixins located in [/sass-utils/](../sass-utils/)

## Angular Style Guide

- See official [style guide](https://angular.io/guide/styleguide)
- Make sure to unsubscribe from subscriptions in components on `ngOnDestory`
- Always use `ChangeDetectionStrategy.OnPush` for components
- Use trackbyfn with ngFor to improve performance

### Avoid Complex getters

Templates should never call functions or complex getters to assign data:

```html
<!-- Bad: These will get called on change detection -->
<div [style.color]="setLabelColor()" [style.backgroundColor]="setBackgroundColor()"></div>

<!-- Good: Reference variables instead  -->
<div [style.color]="labelColor" [style.backgroundColor]="backgroundColor"></div>

<!-- Good: For complex transformation use a pipe -->
<div [style.backgroundColor]="color | IValueLookup: designSystem.colors"></div>
```

### Avoid `ngClass` in templates

```html
<!-- Bad: Harder to read, more expensive -->
<div [ngClass]="{ 'focused': labelIsFocused }"></div>

<!-- Good -->
<div [class.focused]="labelIsFocused"></div>
```

### RXJS Subscriptions

Don't subscribe to events inside the constructor (unless you're using a service) wait until `ngOnInit`

```ts
// Bad
constructor(){
  this.subscription.subscribe(fromEvent('window', 'resize', ()=> {/* do a thing */}))
}

// Good
ngOnInit(){
  this.subscription.subscribe(fromEvent('window', 'resize', ()=> {/* do a thing */}))
}

```

### Extending abstract classes w/ Components

If you have a component that extends an abstract class you **must** pass parameters to in the constructor or you may get build errors.
Generally recommend not extending components in this way.

```ts
class Foo{
  constructor(public _someService:SomeService){}
}

@Component({...})
export class Bar extends Foo{
  constructor(public _someService:SomeService){
    super(_someService); // Must be included or might break prod build / storybook
  }
}
```

### Inputs: Booleans

```ts
import { coerceBooleanProperty } from '@angular/cdk/coercion';
  @Component({...})
  export class Foo{
    private _hidden = true;

    @Input()
     set hidden(hide: boolean) {
       this._hidden = coerceBooleanProperty(hide);
     }
  }
```

```html
<foo hidden></foo>
<!-- Equivalent to but with less template -->
<foo hidden="true"></foo>
```

### Inputs: Two-way binding

If you're passing data to a component a preferred method is the following naming convention:

Input `value` output `valueChange` which tells angular to allow for two-way binding ...

```ts
  @Component({...})
  export class Bar{
    @Input() value?:boolean;
    @Output() valueChange = new EventEmitter<boolean>()
  }
```

```html
<bar [(value)]="someValue"></bar>
```

`someValue` will update when bar component changes and bar component will change when `someValue` changes.
The only potential downside occurs with objects where Angular only does shallow change detection so you'll need to handle this manually.

### Void Outputs

```ts
  @Component({...})
  export class Bar{
    // This is fine, when there are no side effects
    @Output() close = new EventEmitter<void>();
  }

  @Component({...})
  export class Bar{
    // Badish: What am I deleting?
    // Explicitly passing an object or id may be better
    @Output() delete = new EventEmitter<void>()
  }
```

## TypeScript Style Guide

See Google's Typescript styleguide

- Utilize immutable data types when possible (ReadonlyMap, ReadonlyArray, ReadonlySet)
- Use pure functions and avoid mutation
- Prefer arrow syntax for module-level functions
- Build interfaces for passing data around
- TODO comments are written as: `TODO: (username)`
- Avoid magic strings and numbers
- Prefix private variables with an underscore `private _foo = ‘foo’`
- Prefix private methods with an underscore as well `private _methodName() {}`
- Use `public` modifier for public variables and constructor parameters.
- Always place local consts at the top of the file (local)
  - Caps + SnakeCase format e.g `BUTTON_CLASS_ATTRIBUTES`

Class ordering preference:

- private variables
- public variables
- Inputs
- Outputs
- constructor

Avoid Nested functions, split into consts and use immutable data

```ts
// Hard to parse and maintain
const tonalPalette = tonalPaletteToHex(
  generateTonalPalette(RgbColor.fromHex(themeColor.value).withAlpha(1))
);

// Good
const color = RgbColor.fromHex(themeColor.value).withAlpha(1);
const tonalPalette = generateTonalPalette(color);
const variants = tonalPaletteToHex(tonalPalette);
```

Limit the number of imports to improve readability

```ts
// Badish
import { foo, bar, baz, bash, co, design, render } from ‘cd-interfaces’;

// Better
import * as cd from ‘cd-interfaces’
```

## Git style guide

Commit Format

```
<type>(<scope>): <subject> (<b/xxxxxx>)
```

Example:

```
fix(selection): Fit to bounds off when x || y are zero for the left bounds (b/117433911)
```

Types:

- `Feat (feature) <subject>`
- `Fix (bug fix) <subject> b/131416284`
- `Docs (documentation) <subject>`
- `Style (formatting, missing semi colons, …) <subject>`
- `Refactor () <subject>`
- `Test (when adding missing tests) <subject>`
- `Chore (maintain) <subject>`

## Storybook Style Guide

[Storybook](https://github.com/storybookjs/storybook) is a tool we used build components independently.

- Place stories in \_demo folder inside a component
- Create external .html template files to gain syntax highlighting
- Be careful upgrading your project to a new version, new versions of angular may break, specifically seen issues with loading CSS or assets, theme.

## NodeJS Style Guide

[Best Practices](https://github.com/goldbergyoni/nodebestpractices)

`[TODO]: @`
