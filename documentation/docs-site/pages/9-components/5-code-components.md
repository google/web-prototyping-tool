---
title: Code Components
date: Last Modified
permalink: /components/code-components/index.html
toc: true
eleventyNavigation:
  key: code
  title: Code Components
  parent: components
  order: 5
---

Interactive data visualizations, advanced interactions, 3D graphics and more can be leveraged by importing your own **custom code components** into WebPrototypingTool. This implementation is based on the [Web Components API](https://developer.mozilla.org/en-US/docs/Web/Web_Components) and [starter projects](/components/code-components/starter-projects) are available for common front-end libraries such as Angular, LitElement, React, Vue, etc...

@[video](/static/img/components/code/code-comp.webm)

## Walkthrough

::: callout-green
Before you begin, you’ll need to have already built the JavaScript bundle for your custom element. If you haven't already done this, download one of our [starter projects](/components/code-components/starter-projects) or [samples](/components/code-components/starter-projects/#samples)
:::

Open the components panel and click on the **Upload component** button in the top right corner.

![](/static/img/components/code/upload-component.png)

Next, you’ll be presented with a dialog to enter your component name, tag name and uploading the JavaScript bundle.

@[video](/static/img/components/code/code-import.webm)

The **tag name** needs to be defined in your JavaScript bundle via the [CustomElementRegistry.define()](https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry/define) function. Some frameworks (such as [LitElement](/components/code-components/starter-projects#litelement)) will do this automatically for you.

Once the component has finished uploading, you’ll be presented with a preview of it in the Code Component Editor.

![](/static/img/components/code/overview.png)

::: callout
If your component doesn't render, verify the **tag name** and check the chrome dev tools console for errors. Your tag name must start with a letter and contain a hyphen. Only lowercase letters, numbers, hyphens, periods, and underscores allowed.
:::

From the Code Component Editor, you’ll be able to change details about your component, upload an updated JavaScript bundle, specify inputs, and publish your component to the marketplace to share with other users or use in another project.

## Adding inputs

Next, we can specify inputs to make our component configurable in WebPrototypingTool. Open the **inputs tab** in the top right and click **“Add input”** or the :heavy_plus_sign: at the top.

![](/static/img/components/code/add-input.png)

Inputs represent configurable attributes or properties that you’ve created for your custom element.

If you created your custom element using [Angular](/components/code-components/starter-projects#angular), these would be properties on your component class that you’ve annotated with the `@Input()` decorator. If you’re using [LitElement](/components/code-components/starter-projects#litelement), these would be properties annotated with either the `@property()` or `@attribute()` decorators.

![](/static/img/components/code/comp-inputs.png)

| Name    | Description                                                                          |
| ------- | ------------------------------------------------------------------------------------ |
| Label   | The form label to display in the properties panel for this input                     |
| Input   | The actual name of your component input i.e **"title"** in `<my-comp title="value">` |
| Type    | **Property**, **Attribute** or **CSS Variable** (see below)                          |
| Control | The form control to use to manipulate the input from the properties panel            |
| Default | The default value to use for this input                                              |

**Type**

- **Attribute:** Should only be used for values like strings, numbers and boolean values. These are passed to the components as strings so you’ll need to convert them depending on which framework you use.
- **Property:** On the other hand, are perfectly suited to also hold values that are objects or arrays.
- **CSS Variable:** Equivalent to `<my-comp style="--foo:#ff0">`

| Form Controls | Description                                    |
| ------------- | ---------------------------------------------- |
| Text          | Text content                                   |
| Textarea      | Could be used for larger strings or json input |
| Number        | Number values                                  |
| Number Range  | Shows a range slider                           |
| Checkbox      | Used for boolean values                        |
| Color         | Shows a color picker                           |

Once we’ve added an input, a test panel will appear that will allow you to modify and preview various input values. Also, the layout of the test panel mirrors what the properties panel will look like when using the component on an artboard.

![](/static/img/components/code/test-input.png)

## Output events

Defining a code component **event** allows you to hook into WebPrototypingTool [Actions](/actions/) and [data binding](/data/) behavior. These events are based on the web api for [CustomEvents](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent) that are dispatched from your component. If you're using Angular, these are automatically generated for you from any **@Output()** properties on your component.

![](/static/img/components/code/define-custom-event.png)

| Property      | Description                                                                                                                                                                |
| ------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Name          | The name of your event where `foo` would be `CustomEvent("foo", eventDetail)`                                                                                              |
| Type          | The type of data that your event outputs. Currently only primitive values are supported. If your event payload consists of an object, you can just specify ‘None’ for now. |
| Input Binding | An output event is dispatched from a component to signify that the value of one of the component inputs has changed. (Select one of the defined inputs)                    |

Input binding is useful for two-way scenarios where you need to stay in sync with the internal state of your component. This is useful for preserving the state of your component even when it is hidden / shown or the user navigates away and back from a board containing your component. You may have an input property for value and an output event for **valueChange**. In an [Angular](https://angular.io/guide/two-way-binding#how-two-way-binding-works) component, this would look something like:

```ts
export class MyTextInputComponent {
  @Input() value?: string;
  @Output() valueChange = new EventEmitter<string>();
}
```

If you’re not using Angular, from inside your component reference the [rootNode](https://developer.mozilla.org/en-US/docs/Web/API/Node/getRootNode) and dispatch an event:

```ts
const detail = 'foo'; // Payload
const event = new CustomEvent('change', { bubbles: true, composed: true, detail });
someElement.getRootNode().dispatchEvent(event);
```

## Calling public methods

Publicly exposed methods on your component can be called using the [Run JS Code action](/actions/runjs/).

```ts
target.play();
```

If you're using [Angular](/components/code-components/starter-projects#angular), you'll need to expose the method inside the constructor:
_Depending on what you're doing inside that method, you may also need to call [change detection](https://angular.io/api/core/ChangeDetectorRef#use-markforcheck-with-checkonce-strategy)_

```ts
constructor(private readonly _elementRef: ElementRef<HTMLElement>) {
  (_elementRef.nativeElement as any).somePublicMethod = this.somePublicMethod;
}

somePublicMethod = (someStringArg:string) => {
  console.log('public method called', someStringArg);
}
```

## Design system variables

To use design system variables defined in the [Theme panel](/theme/) within your component you can utilize [CSS Custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties). WebPrototypingTool provides standardized tokens out of the box with a **--co-** prefix:

```css
--co-primary: #1a73e8;
```

You can export these CSS vars from any project by clicking **Export CSS vars** from the overflow menu of the Theme panel. This will download a CSS file that you can use to reference all the CSS vars generated by WebPrototypingTool.

![](/static/img/components/code/export-vars.png)

To utilize these CSS vars in your component (and therefore make your component theme-able) you can set the values CSS properties in your component styles to reference them by using the **var()** function.

```css
/*
* Bind component title color to WebPrototypingTool text dark.
* #000 is the fallback value
*/

.my-component-title {
  color: var(--co-text-dark, #000);
}
```

## Prototype State API

The underlying data model of a prototype can be accessed from inside your component using the [State API](/beyond-the-basics/state-api/) which is attached to the global scope and prefixed by the keyword `api`. [Click here](/beyond-the-basics/state-api/) for the full list of exposed methods...

```ts
  // Current project state
  api.getProjectState();

  // All datasets within the project
  api.getProjectData();

  // Get the object model for a given component by id
  api.getComponentStateForId(id:string);

  // Set the value of an input on a component
  api.setInputForComponent(id: string, inputName: string, value: any);

  // Listen for changes to project state
  api.addProjectStateListener((state) => {
    console.log(state);
  });
  // and more...
```

## Configuration details

Specifies how your component will be displayed and used within WebPrototypingTool and the [marketplace](/components/marketplace/).

<div class="two-col">

<img src="{{ '/static/img/components/code/code-comp-details.png' | url}}" >

[web-comp-slot]: https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_templates_and_slots#adding_flexibility_with_slots

| Property     | Description                                                                                                                                        |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Name         | Human readable label for the layers panel                                                                                                          |
| Tag Name     | The dom tag used by this component `<my-comp>`                                                                                                     |
| Icon         | Icon to show in the layers tree                                                                                                                    |
| Initial Size | Default size when creating a new instance of your component                                                                                        |
| Resizable    | Allow resizing instances of your component in the editor.                                                                                          |
| Children     | Whether or not your component can accept child elements. To render children, it will need to utilize a [slot][web-comp-slot] element inside of it. |
| Fonts        | Attach [Google Fonts](https://fonts.google.com/) to your component. By default WebPrototypingTool includes Google Sans and Roboto                            |
| Description  | Add a description for your component's usage, specify data formats required, provide links for further documentation, etc.                         |
| Repository   | Provide a link to a repository where the code for your component is hosted. This will allow other users to learn from your code or make updates.   |
| Bundle       | Details about the js bundle with options to download or upload a new file                                                                          |
| Publish      | Make your component available in the [marketplace](/components/marketplace/)                                                                       |

</div>

## Publishing

Click the **Publish** button in the top bar or from the details panel to make your component available in the [marketplace](/components/marketplace/).

![](/static/img/components/code/comp-publish.png)

When published a new section appears on the **details** tab
![](/static/img/components/code/comp-publish-details.png)

## Usage

Now that the component has been uploaded and its inputs have been defined, we can use it on an artboard within our project. A tile for the component will be located in the bottom of the components panel. We can drag that card onto an artboard to create an instance.

@[video](/static/img/components/code/use-component.webm)

In the properties panel on the right, you’ll see the inputs that you configured for your component. You’ll also see other default configurations (width, height, position, etc) to style and position this instance of your component.

![](/static/img/components/code/comp-props.png)

At any point, you can double-click an instance of your component or its card in the components panel, to return to the code component editor and make further changes to your component.

## Roadmap

In 2021 we're adding the ability to import component libraries.
