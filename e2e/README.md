## Setup

First install our specific version of chromium.

```
npm run install-e2e-chrome
```

# VERSION INCOMPATIBILITY NOTE

If versions mismatch and the e2e tests no longer run, we have safe alternative versions of protractor and puppeteer that will for sure work with eachother. The following is how to augment configs and npm packages to make that happen:

## NPM Packages

The following package versions work well:

- Protractor: 7.0.0
- Puppeteer: 5.3.1

## package.json adjustments

The following script needs to be added to the package.json:

```
"install-e2e-chrome": "webdriver-manager update --versions.chrome=86.0.4240.22",
```

This script is what's used to install the correct version of Protractor's webdriver

## protractor.conf.js adjustments

The following lines must be added to the Protractor config in the `exports.config` object:

```
chromeDriver: '../node_modules/protractor/node_modules/webdriver-manager/selenium/chromedriver_86.0.4240.22',
```

This will point protractor to use the correct version instead of the auto-installed version.
