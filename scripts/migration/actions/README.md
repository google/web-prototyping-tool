## Input Migration

From `scripts/migration`

### Build

```
npm run watch:actions
```

### Run on specific projects

```
  node dist/actions -p SOME_PROJECT_ID
```

### Verify project has been migrated. Will complete with no issues if valid

```
  node dist/actions -v SOME_PROJECT_ID
```

### Run on all projects

```
  node dist/actions -a
```
