# Testing

## Firebase Tests

Any data structure added must have a rule defined and tests added.
Testing for Firebase [rules](../firebase/firestore.rules) exists here: [firebase/test/test.js](../firebase/test/test.js)

## Unit Tests

To run ALL unit tests ...

`npm run test:full`

Or to run specific packages or configurations, pass in the config name.
See [packages.json](../package.json) for all configs.

`npm run test:{config name}`

For instance, to run only the tests for the app ...

`npm run test:app`

Warning: Some configurations, such as utils, require Chrome headless.
Otherwise, you may receive a "Chrome failed" error.

`npm run test:utils:headless`

## Integration Tests

When running the app locally in the dev environment we're running health checks for every database write to identify issues with the data model. In production these checks only occur on project load, due to performance implications and report issues to analytics.

See [src/app/routes/project/store/reducers/health.metareducer.ts](../src/app/routes/project/store/reducers/health.metareducer.ts)

## Performance Tests

Currently performance checks are done ad-hoc using chrome developer tools. Ideally we would add [github.com/GoogleChromeLabs/lighthousebot](https://github.com/GoogleChromeLabs/lighthousebot) in the future to measure over time. Additionally, Angular has the concept of [budgets](https://github.com/angular/angular-cli/blob/master/docs/documentation/stories/budgets.md) which would be great to add.
