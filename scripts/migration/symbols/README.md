## Symbol Migration

From `scripts/migration`

### Build

```
npm run watch:symbols
```

### Run on specific projects

```
  node dist/symbols -p SOME_PROJECT_ID
```

### Verify project has been migrated. Will complete with no issues if valid

```
  node dist/symbols -v SOME_PROJECT_ID
```

### Run on all projects

```
  node dist/symbols -a
```
