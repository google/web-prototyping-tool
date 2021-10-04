# Avatar

CD Avatar provides a CD Menu Wrapper for user profile images.

## Basic Usage

### HTML Structure

The HTML structure for a CD Avatar is as follows:

```html
  <cd-avatar
    [profileImgUrl]="props.profileImageUrl" // Pass a url to the image resource
    (click)="onAvatarClick($event, props.userEmail)" // Pass the email of the user to the handler
  ></cd-avatar>
```

### Property API

| Property        | Type      | Description                                                    |
| --------------- | --------- | -------------------------------------------------------------- |
| `profileImgUrl` | `string`  | String that is applied to the heading text of the avatar card. |
| `click`         | `handler` | String that is applied to the name text of the avatar card.    |
