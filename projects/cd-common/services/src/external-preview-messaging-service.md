# External Preview Messaging Service

## Description

This service is meant to be used for bi-directional communication between a third-party and the WebPrototypingTool app.

## Message Payload

| Field            | Type                      | Optional | Description                                                          |
| ---------------- | ------------------------- | -------- | -------------------------------------------------------------------- |
| cdPreviewMessage | True                      | No       | **Needs to be `true` in order for system to catch message properly** |
| type             | PreviewMessageType        | No       | The type of post message                                             |
| command          | PreviewMessageCommand     | Yes      | The command to run, based on the type of message                     |
| id               | String                    | Yes      | The ID of a board from a project                                     |
| params           | _'Angular Router'_ Params | Yes      | Query params from Angular's Router                                   |

### **PreviewMessageType** Enum

| Name       | Value        | Description                                                                                                       |
| ---------- | ------------ | ----------------------------------------------------------------------------------------------------------------- |
| Navigation | 'navigation' | Designates a `navigation` event, meant to either force a navigation event OR be triggered _by_ a navigation event |

### **PreviewMessageCommand** Enum

| Name | Value  | Description                                                                 |
| ---- | ------ | --------------------------------------------------------------------------- |
| Home | 'home' | Meant to tell the `preview` section to navigate to the project's home board |
