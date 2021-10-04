/*
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as cd from 'cd-interfaces';
import { deepCopy } from 'cd-utils/object';
import {
  isRoot,
  isSymbolInstance,
  getModelEntries,
  isBoard,
  ReadOnlyPropertyEntries,
} from 'cd-common/models';
import { Theme, themeFromId } from 'cd-themes';
import { findCircularRefs } from '../../utils/dependency.utils';

interface IRepairedResults {
  elementProperties: cd.ElementPropertiesMap;
  designSystem?: cd.IDesignSystemDocument;
}

export class ElementPropertiesFixer {
  private _elementProperties: cd.ElementPropertiesMap;
  private _designSystem?: cd.IDesignSystemDocument;
  private _boardIds: Set<string>;
  constructor(
    props: cd.ElementPropertiesMap,
    designSystem?: cd.IDesignSystemDocument,
    boardIds: string[] = []
  ) {
    this._boardIds = new Set(boardIds);
    this._elementProperties = deepCopy(props);
    this._designSystem = designSystem ? deepCopy(designSystem) : undefined;
  }

  get ids() {
    return Object.keys(this._elementProperties);
  }

  processEntries = (
    fn: (
      previousValue: cd.ElementPropertiesMap,
      currentValue: [string, cd.PropertyModel],
      currentIndex: number,
      array: ReadOnlyPropertyEntries
    ) => {}
  ) => {
    const definedEntries = getModelEntries(this._elementProperties);
    const props = definedEntries.reduce<cd.ElementPropertiesMap>(fn, {});
    this._elementProperties = props;
  };

  removeBoardsMissingFromProject() {
    const { _boardIds } = this;
    this.processEntries((acc, curr) => {
      const [id, model] = curr;
      if (isBoard(model) && !_boardIds.has(id)) {
        return acc; // Remove this board, it is missing from project.boardIds
      }
      acc[id] = model;
      return acc;
    });
    return this;
  }

  repairChildIdsOnElementsWhoseChildrenDontPointToThem() {
    const { _elementProperties } = this;
    this.processEntries((acc, curr) => {
      const [key, value] = curr;
      value.childIds = value.childIds.filter(
        (childId) => key === _elementProperties[childId]?.parentId
      );
      acc[key] = value;
      return acc;
    });
    return this;
  }

  repairTheme() {
    const { _designSystem } = this;
    if (!_designSystem || _designSystem.themeId !== Theme.AngularMaterial) return this;
    const newTheme = themeFromId[Theme.AngularMaterial]().theme;
    // Replace all theme values in design system document with latest values in  theme
    this._designSystem = { ..._designSystem, ...newTheme };
    return this;
  }

  /** Removes childIds that dont exist in the property model */
  repairOrphanedChildIds() {
    const { ids } = this;
    this.processEntries((acc, curr) => {
      const [key, value] = curr;
      value.childIds = value.childIds.filter((childId) => ids.includes(childId));
      acc[key] = value;
      return acc;
    });
    return this;
  }

  removeElementsWhoseParentIdDoesntExist() {
    const { ids } = this;
    this.processEntries((acc, curr) => {
      const [key, value] = curr;
      const parentId = value.parentId;
      if (!isRoot(value) && parentId && !ids.includes(parentId)) {
        return acc;
      }

      acc[key] = value;
      return acc;
    });

    return this;
  }

  removeSymbolInstancesWithNonMissingSymbolRefs() {
    const { ids } = this;
    this.processEntries((acc, curr) => {
      const [id, model] = curr;
      if (isSymbolInstance(model)) {
        const symbolRef = (model as cd.ISymbolInstanceProperties).inputs.referenceId;
        if (!symbolRef || !ids.includes(symbolRef)) return acc;
      }
      acc[id] = model;
      return acc;
    });

    return this;
  }

  removeElementChildren(ids: string[]) {
    const { _elementProperties } = this;
    for (const id of ids) {
      const element = _elementProperties[id];
      if (element) {
        const childIds = element?.childIds || [];
        if (childIds.length) this.removeElementChildren(childIds);
        delete _elementProperties[id];
      }
    }
  }

  /** Looks at the parentId of an element and determines if it exists in that element's childIds */
  removeOrphanedElements() {
    const { _elementProperties } = this;
    let childrenToDelete: string[] = [];
    const definedEntries = getModelEntries(this._elementProperties);
    for (const [key, value] of definedEntries) {
      const parentId = value.parentId;
      if (isRoot(value)) continue;
      const parent = parentId && _elementProperties[parentId];
      if (parent && parent.childIds.includes(key)) continue;
      const childIds = value.childIds || [];
      childrenToDelete = [...childrenToDelete, key, ...childIds];
    }

    this.removeElementChildren(childrenToDelete);
    return this;
  }

  /**
   * @deprecated Revist this
   */
  repairOrphanedElements() {
    const { ids } = this;
    this.processEntries((acc, curr, _idx, elemList) => {
      const [key, value] = curr;
      const parentId = value.parentId;
      if (!isRoot(value) && parentId && !ids.includes(parentId)) {
        // Is there a parent pointed at this child element?
        const parent = elemList.find(([, elemValue]) => elemValue.childIds.includes(key));
        if (parent) {
          value.parentId = parent[1].id;
          acc[key] = value;
        }
      } else {
        acc[key] = value;
      }

      return acc;
    });

    return this;
  }

  /**
   * TODO: Revist this
   */

  repairIfElementExistsOnTheirParent() {
    const { _elementProperties } = this;
    const remappedChildIds = new Map<string, string[]>();
    const definedEntries = getModelEntries(_elementProperties);
    for (const [key, value] of definedEntries) {
      const parentId = value.parentId;
      if (parentId) {
        const parent = _elementProperties[parentId];
        const childIds = (parent && parent.childIds) || [];
        if (!childIds.includes(key)) {
          const ids = remappedChildIds.get(parentId) || childIds;
          remappedChildIds.set(parentId, [...ids, key]);
        }
      }
    }

    for (const [key, value] of remappedChildIds) {
      const props = _elementProperties[key];
      if (!props) continue;
      props.childIds = value;
    }

    return this;
  }

  // For any referenceId or childPortal overrides for portals or tabs within a symbol
  // Ensure that the override is pointing at an id that exists
  repairNonExistentPortalOverrides() {
    const { _elementProperties } = this;
    this.processEntries((acc, curr) => {
      const [id, model] = curr;
      if (isSymbolInstance(model)) {
        const instance = model as cd.ISymbolInstanceProperties;
        const updatedInstanceInputs: cd.SymbolInstanceInputs = {};
        const { instanceInputs } = instance;
        const entries = Object.entries(instanceInputs);

        for (const [key, value] of entries) {
          const updatedValue = { ...value };
          const inputs = { ...updatedValue?.inputs };
          const portalInputs = inputs as cd.IPortalParentInputs & cd.IRootInstanceInputs;

          // check for invalid portal referenceId override
          const portalRefId = portalInputs?.referenceId;
          const portalRefDoesntExist = portalRefId && !_elementProperties[portalRefId];

          // check for invalid childPortals override
          const portals = portalInputs?.childPortals || [];
          const portalsInvalid = portals.some((p) => p.value && !_elementProperties[p.value]);

          // nullify undefined reference id
          if (portalRefDoesntExist) {
            const nulledInputs = { ...inputs, referenceId: null } as cd.IRootInstanceInputs;
            updatedValue.inputs = nulledInputs;
          }
          // filter out values of non-existent child portals references
          else if (portalsInvalid) {
            const childPortals = portals.map((p) => {
              if (p.value && !_elementProperties[p.value]) return { ...p, value: null };
              return p;
            }) as cd.IGenericConfig[];

            const nulledInputs = { ...inputs, childPortals } as cd.IPortalParentInputs;
            updatedValue.inputs = nulledInputs;
          }

          updatedInstanceInputs[key] = updatedValue;
        }

        instance.instanceInputs = updatedInstanceInputs;
      }
      acc[id] = model;
      return acc;
    });
    return this;
  }

  repairNonExistentSymbolInstanceInputs() {
    const { _elementProperties } = this;
    this.processEntries((acc, curr) => {
      const [id, model] = curr;
      if (isSymbolInstance(model)) {
        const instance = model as cd.ISymbolInstanceProperties;
        const { dirtyInputs, instanceInputs } = instance;
        const updatedDirtyInputs: cd.IStringMap<boolean | undefined | null> = {};
        const updatedInstanceInputs: cd.SymbolInstanceInputs = {};

        // only preserve key if referenced element is defined
        for (const key of Object.keys(dirtyInputs)) {
          if (_elementProperties[key]) updatedDirtyInputs[key] = dirtyInputs[key];
        }
        for (const key of Object.keys(instanceInputs)) {
          if (_elementProperties[key]) updatedInstanceInputs[key] = instanceInputs[key];
        }

        instance.dirtyInputs = updatedDirtyInputs;
        instance.instanceInputs = updatedInstanceInputs;
      }
      acc[id] = model;
      return acc;
    });
    return this;
  }

  /**
   * For each circular reference path, remove the link to the last node in the path
   *
   * Example:
   * Circular reference path: ['id1', 'id2', 'id1']
   *
   * -> delete 'id1' from childIds of 'id2'
   */
  repairCircularReferences() {
    const { _elementProperties } = this;
    const circularRefs = findCircularRefs(_elementProperties);
    for (const circularRef of circularRefs) {
      // go to second-to-last id in path and delete last id from its childIds
      const lastId = circularRef.pop();
      const secondToLastId = circularRef.pop();
      const secondToLastModel = secondToLastId && _elementProperties[secondToLastId];
      if (secondToLastModel) {
        secondToLastModel.childIds = secondToLastModel.childIds.filter((id) => id !== lastId);
      }
    }
    return this;
  }

  build(): IRepairedResults {
    const { _designSystem } = this;
    const elementProperties = deepCopy(this._elementProperties);
    const designSystem = _designSystem ? deepCopy(_designSystem) : undefined;
    return { elementProperties, designSystem };
  }
}
