# WebPrototypingTool Renderer

The WebPrototypingTool Renderer is a separate Angular app that is hosted on a different domain from the main
application. In the main application, we create an iframe to the Renderer and send
post messages to it to instruct to compile board templates. Also in the main app, inside each board,
we create additional iframes called Render Outlets. These iframes are essentially just empty HTML
pages, that register themselves with the Renderer.

Because the Render Outlets are running on the same domain as the Renderer, the Renderer is able to
insert content directly into them. The Renderer converts WebPrototypingTool's element property models into
html and then ultimtely into an Angular component via Angular's Jit Compiler. The Rendere will
insert this component into a Render Outlet and bind the appropriate properties.

## Architecture Diagram

![alt text](./AppArchitecture.png 'WebPrototypingTool Renderer Architecture Diagram')

## Separate Domain benefits

This provides us with security and performance benefits. For security, by running a separate
domain in a sandboxed iframe, we ensure that any render content will not have any access to
the user's cookies therefore preventing any database access, etc.

For performance, we are able to leverage the fact that Chrome creates a separeate JavaScript VM for
each domain. This means that any renderering computation will be performed in a separate process and
not block the main application.
See https://www.chromium.org/developers/design-documents/oop-iframes

## Renderering Pipeline

The following section describes each step in our rendering pipeline to inject content into render outlet iframes.

### **1. Renderer**: Compile default component set

The Renderer will generate 'universal' component that is capable of renderering any/all of the components currently loaded
into the project.

### **2. Renderer**: Define global register function

The Renderer on startup will attach a global function to the window called `registerRenderOutlet`.
Because, the Renderer is running on the same domain, the render outlet iframes will be able to
access and call this function.

### **3. Renderer**: Init message to main app

After initial compilation is complete and the global register function is defined, the Renderer will
send an init message to the main app to signify that it is ready to begin rendering content. The
main app will wait to create any render outlet iframes until this message is received.

### **4. Render Outlets**: Register document to board id

Within each board in the main app, a render outlet iframe is created. The `name` attribute of each
outlet iframe is set to the board id that should be rendered in this iframe. The `src` of each
outlet iframe is pointed at an HTML file that is hosted on Renderer domain. Inside this HTML file
there is a script that accesses the board id from the name attribute and then calls the
`registerRenderOutlet` function to register this iframe's document with the board id.

`render-outlet.html`:

```
const rendererFrame = window.parent.frames[0];
rendererFrame.registerRenderOutlet(window.name, document);
```

### **5. Renderer**: Bootstrap app into outlet iframe

As soon as a render outlet has registered, we inject a minimal Angular application into it.

### **6. Renderers**: Inject root styles

Our base Material theme styles plus overrides are injected as a CSS stylesheet into the outlet
document.

### **7. Renderers**: Load fonts

For the current project, whatever fonts have been configured in the the theme panel are injected
into the document.

### **8. Renderers**: Define Design System CSS vars

For each color, variable, and type scale entry, we generate a series of CSS custom properties that
we define on each outlet document and update when a user makes changes to a project theme.

### **9. Renderers**: Inject content component

An instance of the 'universal' component that was compiled previously is created and injected into
the body of the iframe.

### **10. Renderers**: Generate render results

The renderer queries the DOM for each rendered element that corresponds to a WebPrototypingTool property model
(i.e. an item in the layers tree), and gets it's bounding box. These results are then
post-messaged back to the main app.
