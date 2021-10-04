# Avatar with details

CD Avatar Details provides user metadata alongside a user's avatar.

## Basic Usage

### HTML Structure

The HTML structure for an Avatar Details component is as follows:

```html
<cd-avatar-details
  [avatarTitle]="props.avatarTitle" // Defaults to 'Owner'
  [user]="props.user" // Of type: IUser
></cd-avatar-details>
```

### Property API

| Property      | Type     | Description                                                    |
| ------------- | -------- | -------------------------------------------------------------- |
| `avatarTitle` | `string` | String that is applied to the heading text of the avatar card. |
| `user`        | `string` | String that is applied to the name text of the avatar card.    |
