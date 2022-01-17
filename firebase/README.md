# Firebase Rules

https://github.com/firebase/quickstart-nodejs/tree/master/firestore-emulator/javascript-quickstart

```
firebase deploy --only firestore:rules
```

# Firebase Cloud Functions

## First-timers TL;DR

Install the global firebase tools

```
npm install -g firebase-tools
```

Build WebPrototypingTool Dependencies from project root

```
npm run build:all

```

Install firebase dependencies

```
cd firebase/functions; npm i
```

## Other Development Flows

### Just build & webpack cloud functions, don't deploy

```
cd firebase/functions; npm run build
```

### Build `cd-\*,` build & webpack cloud functions, don't deploy

```
cd firebase/functions; npm run build:all
```

# Introduction

This folder hosts [Firebase Cloud Functions](https://firebase.google.com/docs/functions/) for WebPrototypingTool.

Right now, these functions...

1. take care of user assets (images), e.g. producing thumbnails
1. queue screenshot tasks for project edits
1. produces thumbnails for screenshots
1. [Send email alerts](#sending-email-alerts)

The functions are placed in this git repo such that we can share
business logic with the main app, and such that deployment _might_ be
streamlined (deployment is currently still a separate process, see below for
details.)

Firebase Cloud Functions are configured and deployed by Firebase CLI. In a
nutshell, the local set-up/development flow is:

1. Install Firebase CLI
1. Initialize a local Firebase project in the git repo
1. Write those cloud functions
1. Use Firebase CLI to Deploy the functions

# Cloud Build Hook (Testing building only, not deployment)

Building cloud functions (but not deployment) is now an integrated step in our
cloud build, in order to catch code breakage.

Deployment of cloud functions are not included in cloud build because we're not
yet sure about automated deployment of cloud functions.

# 0. Realms & Folder Structure

From this point on, think of the entire WebPrototypingTool repository to have two npms realms:

1. The root npm realm for WebPrototypingTool app development **(root folder of the entire WebPrototypingTool project)**
1. The Firebase Cloud Functions npm realm for Cloud Functions development **(`./firebase/functions`)**

Cloud Functions have a separate realm as they run in the cloud (surprise!)
under Node; the realm is strictly Node-based environment & libraries.

Interfacing the two realms is the Firebase CLI, which is installed in the
root realm. It is used to initialize and bootstrap the Cloud Functions realm.

# 1. and 2. Firebase CLI & local project setup

Steps are adapted from the [official documentation](https://firebase.google.com/docs/functions/get-started).

## At WebPrototypingTool project root

1. `npm install --save-dev firebase-tools`\
   Disregard the @google-cloud/functions-emulator message.
1. `./node_modules/.bin/firebase login`
1. `cd firebase`

1. `../node_modules/.bin/firebase init functions`

   1. Select `Typescript`
   1. Select `N` for tslint, and `Y` for dependencies.\
      This generates the `functions` sub-folder.\
      (tslint is not needed as our global git pre-commit hook will lint using the
      root realm's tslint for you.)

1. `cd functions`

## Now you're in the Cloud Functions realm

5. Replace the generated `./tslint.json` with:

   ```
   {
     "extends": "../../tslint.json"
   }
   ```

   , as we want consistent tslinting rules across the board.\
   **Do not replace generated tsconfig.json:** As said, files inside this realm
   is to be compiled against Firebase's Node-based cloud environment, so we
   don't use WebPrototypingTool's tsconfig.

1. `npm install --save @google-cloud/storage @google-cloud/pub-sub` as we deal
   with cloud storage, pub/sub, and various other GCP products here.\
   This saves in to Cloud Functions realm's package.json and node_modules.

1. Use Node 8 ([reference](https://firebase.googleblog.com/2018/08/cloud-functions-for-firebase-config-node-8-timeout-memory-region.html); default is Node 6):

   1. In `package.json`, top level, add:
      ```
      "engines": {
        "node": "8"
      },
      ```
   1. In `tsconfig.json`, compilerOptions, add/modify:
      ```
      "target": "es2017",
      "lib": ["es2017", "dom"]
      ```

1. In `../firebase.conf`, _prepend_ `"rm -rf ./functions/lib",` to `"predeploy"`
   step array. This ensures build target directory is cleaned before build, which
   is easier to debug.

   ```
    "predeploy": [
      "rm -rf ./functions/lib",
      "npm --prefix \"$RESOURCE_DIR\" run build",
    ]
   ```

# 3. Development

Write code in `./firebase/functions/src/`. Remember: You're now developing for
Node. If you want to install new packages for your cloud functions, make sure
you `npm i` in the Cloud Functions realm.

# 4. Deployment

Cloud Functions deployment is done by Firebase CLI, which means you **deploy
from the root realm**.

```
npm run firebase:deploy:functions
```

# 5. Dependency on cd-\* and webpacking

Owner: @

Dependency on cd-\* is handled by webpack, pointing to `./dist/cd-*` folders.

As such, cd-\* must be built before the cloud functions can be built, webpacked
and deployed. To facilitate this, a couple npm run scripts are provided in the
cloud functions realm:

- `npm run build`: Only compiles & webpacks the `src`, does not rebuild cd-\*
- `npm run build:deps`: Only rebuilds cd-\*
- `npm run build:all`: `npm run build:deps && npm run build`

_**Note that the current `npm run deploy` or `firebase:deploy:functions` does not build cd-\*; it only runs `npm run build` to build/webpack `src`.**_

The end result of the entire webpacking (i.e. npm run build in the cloud
functions realm) is one single index.js file in `./firebase/functions/lib`,
to be consumed by Firebase CLI.

# Sending Email Alerts

The following scenarios will result in an email alert going out:

1. A user will receive an email if they are tagged in a comment
1. The project owner will receive an email if a comment is made in their project
1. If a comment is made on an existing thread, the thread initiator will receive an email
1. A user will receive an email if their comment has been replied to
1. A user will receive an email if a thread they are tagged in is archived
1. The project owner will receive an email if a thread in their project is archived
