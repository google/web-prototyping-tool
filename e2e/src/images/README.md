# Image Testing

## Image spec files

Test files in this folder are for image testing only. They use the following pattern:

```
{name}.image-spec.ts
```

See `e2e/src/images/test.image-spec.ts` for a simplified sample test when creating a new test suite.

## Running tests

Run all image tests using this command. This will test the current UI against the baseline images to detect changes.

```
npm run e2e:images
```

If any errors are found, they will be reported to the console, and the current error image will be saved locally to compare against the baseline image.

## Create baseline images

Run this command to regenerate all baseline images. Once generated, they could be re-submitted to source.

```
npm run e2e:images-create
```
