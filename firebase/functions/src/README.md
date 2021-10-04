# Firebase Functions

## Comment Email Alerts (`comment-email-alerts.ts`)

| Function          | Trigger           | Document                                                                                                                     |
| ----------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `onCommentCreate` | `document.create` | comments/{docId} |
| `onCommentUpdate` | `document.update` | comments/{docId} |

### `onCommentCreate():`

1. Only runs when a `commentDoc` is of type `Comment` (immediately returns if type is `Comment Thread`)
1. Creates two objects: Email details for tagged users, and email details for the comment thread owner
1. Publishes a message with those details to `Cloud PubSub`.

### `onCommentUpdate():`

1. If the update is the result of resolving a thread, sends an email to those affected (tagged users, thread owner)
1. If the update is a result of a user being added to an _existing_ comment, sends an email to that user.

> _NOTE: Both scenarios use the same `PubSub` mechanism described in [onCommentCreate](#oncommentcreate)_

---

## Comment Count Changes (`comment-count.ts`)

| Function                               | Trigger           | Document                                                                                                                     |
| -------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `onCommentCreateUpdateCount`           | `document.create` | [comments/{docId} |
| `onCommentDeleteUpdateCount`           | `document.create` | [comments/{docId} |
| `onCommentResolutionChangeUpdateCount` | `document.create` | [comments/{docId} |

### `onCommentCreateUpdateCount()`,

### `onCommentResolutionChangeUpdateCount()`,

### `onCommentDeleteUpdateCount():`

1. Gets the project doc for a given comment
1. Updates `numComments` with the current number of comments based on a previous action (create, delete, resolve, unresolve)
