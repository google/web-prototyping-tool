# Presence Service

This is an App Engine service that is receives 'presence-exit' requests from the main app
when the window is unloaded.

There is not enough time for a client to write to Firestore on unload but by using [navigator.sendBeacon](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon), we are able to POST to this service to mark that the client has left the
service.

This is used for the presence detection feature of multi-editor.
