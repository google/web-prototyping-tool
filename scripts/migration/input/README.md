## Input Migration

From `scripts/migration`

### Build

```
npm run watch:inputs
```

### Run on specific projects

```
  node dist/inputs -p SOME_PROJECT_ID
```

### Verify project has been migrated. Will complete with no issues if valid

```
  node dist/inputs -v SOME_PROJECT_ID
```

### Run on all projects

```
  node dist/inputs -a
```
