# History (Undo-Redo)


Please review this section if you are creating new NGRx store actions, or
modifying old actions'/effects' behaviors, or for any

Undo-redo is integrated in our NGRx store with a meta
reducer, but is an opt-in feature: Action authors **_must explicitly set their
actions as undoable_**, in order for their state changes to be tracked in the
History store (the undo-redo stack). Action authors also need to write
additional effects to undo (and redo) side effects.

---

## Situation: I'm creating a new action that I believe should be undoable.

Are you creating an "eventual" CUD (Create/Update/Delete) action? If not, then
you probably do not need to do anything.

An eventual CRUD action is one that has a corresponding reducer that transitions States, and that has a
corresponding effect that generates side effects such as writing to database.

For example, `BOARD_CREATE` is not an eventual CRUD action: It does not
transition States, or write to database; its corresponding effect generates
`ELEMENT_PROPS_CREATE`, which is an eventual CUD action.

For another example, `BOARD_SET_HOME` is not an eventual CUD action. Its resultant
`PROJECT_DATA_UPDATE` is the eventual CUD action.

### Actions

Your new action needs to implement `IUndoableAction` (instead of Action), which
declares an `undoable = true` instance field.

Exception: If your new action extends ConfigAction, then you don't need to
implement IUndoableAction again, because ConfigAction implements IUndoableAction.

### Reducers

No extra requirements ;)

### Effects

You need to write extra effects to undo-redo the side effects of your (original)
actions.

Create, Update and Delete each calls for different implmentation for
undoing/redoing side effects; please refer to guideline for undo,
and guideline for redo.

An example can be found at `renderer.effect.ts` for `undoRedoElemProps$` (see
how `isUndo` is used.), and `element-properties.effect.ts` for `undoRedoInDb$`.

### Caveat: Bundled actions

Bundled Actions are required if one user interaction results in multiple eventual CUD actions.
These multiple actions are combined into one single bundled action, because one
single Undo command needs to undo multiple state transitions, and to undo
multiple side effects.

Bundled Actions are a wrapper class, defined in `bundled-undoable.action.ts`,
with a constructor taking in those multiple eventual CUD actions. By definition,
the class' `undoable` field is always true, since you only use them when you
care about undoing multiple actions in one go.

Please refer to the usage of and references to the class, and to its associated
utils (mostly `ofTypeIncludingBundled()`), as examples of writing new bundled actions and
effects for bundled actions. In a nutshell, you want to modify your effects to
take Bundled Actions (and use `ofTypeIncludingBundled()` to extract the relevant wrapped
action for effects), both during normal operation and during undo/redo.

<br/>

Finally, if you want to make undoable an entirely new store state slice (i.e. a
new field in `IProjectState`).
Depending on the situation, there might be more boilerplating than merely
modifying `UndoableStateSliceNames`.

## Situation: My states are not being undone/redone even though everything is set up correctly.

If Redux DevTools show that your states are not undone/redone, it's very likely
somebody is mutating your states,
which breaks undo-redo. If so, there would be some manual labor invovled in
debugging, but as a first step, you want to audit any reducer/effect/components/services/...
that consumes those relevant states to see if they are mutating states.
