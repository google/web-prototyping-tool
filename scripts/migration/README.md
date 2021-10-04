# Migration

- A Firebase file `key.json` must be added to this folder to use the migration scripts
- Changing `project-contents` will trigger the screenshot service.
- Be very careful not to break user data.

# User

The user directory contains CLI tools to fetch the current list of users from Firebase. To build the tools, you will need to run:

\$ npm run build:user

To see the available CLI commands for users:

\$ ./dist/user/index.js --help

To list users:

\$ ./dist/user/index.js list-users
