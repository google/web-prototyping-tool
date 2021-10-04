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

import { createInstance, getComponents, getComponent } from 'cd-common/models';
import { createId } from 'cd-utils/guid';
import { UnitTypes } from 'cd-metadata/units';
import {
  IAuditView,
  IAuditVariant,
  IAuditSubVariant,
  CUSTOM_AUDIT_VIEWS,
} from './configs/audit.config';
import { createAuditViewFromDefinition, autoGenAuditConfig } from './dynamic-audit';
import { toTitleCase } from 'cd-utils/string';
import * as cd from 'cd-interfaces';

const DEFAULT_GAP_SIZE = 4;

export interface IParsedSections {
  sectionIds: string[];
  propModels: cd.PropertyModel[];
}

export const getBlankIParsedSections = (): IParsedSections => ({
  sectionIds: [],
  propModels: [],
});

/** Creates styles for a wrapped horizontal grid row. **/
export const getHorizStack = (columnWidth?: string) => ({
  display: 'grid',
  gridRowGap: DEFAULT_GAP_SIZE,
  gridAutoFlow: columnWidth ? '' : 'column',
  gridAutoColumns: columnWidth ? '' : 'min-content',
  gridTemplateColumns: columnWidth ? `repeat(auto-fill, minmax(${columnWidth}, auto))` : '',
  justifyContent: 'start',
  justifyItems: 'start',
  alignContent: 'start',
  gridColumnGap: DEFAULT_GAP_SIZE,
  alignItems: 'start',
});

export const getVertStack = () => ({
  display: 'flex',
  flexDirection: 'column',
  gridRowGap: 0,
  justifyContent: 'center',
  gridAutoRows: 'min-content',
  justifyItems: 'center',
  gridColumnGap: 0,
  alignItems: 'center',
});

export const generateSubVariantsForVariant = (
  subVariants: IAuditSubVariant[],
  projectId: string,
  elementType: cd.ComponentIdentity
): [string[], (cd.PropertyModel | cd.IComponentInstance)[]] => {
  const startingTuple: [string[], (cd.PropertyModel | cd.IComponentInstance)[]] = [[], []];
  return subVariants.reduce((acc, curr) => {
    // Ignore hidden sub-variants
    if (curr.hidden) return acc;

    const [subVarGroupIds, propModelsToAdd] = acc;
    const newPropModels: (cd.PropertyModel | cd.IComponentInstance)[] = [];

    // Contains element and label
    const { title: subVarTitle, inputs } = curr;

    const subVarElId = createId();
    const subVarElement = createInstance(elementType, projectId, subVarElId);
    if (inputs) {
      subVarElement.addInputs(inputs);
    }
    newPropModels.push(subVarElement.build());

    const subVarTitleElId = createId();
    const subVarTitleElement = createInstance(
      cd.ElementEntitySubType.Text,
      projectId,
      subVarTitleElId
    )
      .addInputs<cd.ITextInputs>({ innerHTML: subVarTitle })
      // NOTE: Setting this manually so this is not changed per design system
      .addBaseStyle({
        whiteSpace: 'nowrap',
        fontWeight: '400',
        fontSize: '12px',
        fontFamily: 'Roboto',
        color: '#5F6368',
      })
      .build();
    newPropModels.push(subVarTitleElement);

    const subVarGroupId = createId();
    const subVarGroup = createInstance(cd.ElementEntitySubType.Generic, projectId, subVarGroupId)
      .assignWidth(100, UnitTypes.Percent)
      .assignPadding(10, 10, 10, 10)
      .assignHeight('auto')
      .assignDisplayStyle(cd.Display.Grid)
      .addBaseStyle(getVertStack())
      .assignBackgroundColor('transparent')
      .assignChildIds([subVarElement.id, subVarTitleElement.id])
      .assignOverflow(cd.Overflow.Visible, cd.Overflow.Visible)
      .build();
    newPropModels.push(subVarGroup);

    return [
      [...subVarGroupIds, subVarGroupId],
      [...propModelsToAdd, ...newPropModels],
    ];
  }, startingTuple);
};

export const generateSectionsForVariants = (
  variants: IAuditVariant[],
  projectId: string,
  elementType: cd.ComponentIdentity,
  columnWidth?: string
): IParsedSections => {
  return variants.reduce((acc, variant) => {
    // Ignore hidden variants
    if (variant.hidden) return acc;

    const { title, subVariants } = variant;
    const idsToAdd = [];
    const propModelsToAdd = [];

    // Variant header
    const variantHeaderId = createId();
    const variantHeader = createInstance(cd.ElementEntitySubType.Text, projectId, variantHeaderId)
      .addInputs<cd.ITextInputs>({ innerHTML: title })
      .build();
    idsToAdd.push(variantHeaderId);
    propModelsToAdd.push(variantHeader);

    const [subVariantGroupIds, subVariantPropModels] = generateSubVariantsForVariant(
      subVariants,
      projectId,
      elementType
    );

    // Contains all sub variants for element
    const sectionGroupId = createId();
    const sectionGroup = createInstance(cd.ElementEntitySubType.Generic, projectId, sectionGroupId)
      .assignWidth(100, UnitTypes.Percent)
      .assignHeight('auto')
      .assignDisplayStyle(cd.Display.Grid)
      .addBaseStyle(getHorizStack(columnWidth))
      .assignBackgroundColor('transparent')
      .assignOverflow(cd.Overflow.Visible, cd.Overflow.Visible)
      .assignChildIds(subVariantGroupIds)
      .build();

    idsToAdd.push(sectionGroupId);
    propModelsToAdd.push(sectionGroup);

    return {
      sectionIds: [...acc.sectionIds, ...idsToAdd],
      propModels: [...acc.propModels, ...propModelsToAdd, ...subVariantPropModels],
    };
  }, getBlankIParsedSections());
};

export const EXCLUDED_SELECT_ITEMS: cd.ComponentIdentity[] = [
  cd.ElementEntitySubType.Board,
  cd.ElementEntitySubType.Symbol,
  cd.ElementEntitySubType.SymbolInstance,
  cd.ElementEntitySubType.Text,
  cd.ElementEntitySubType.Image,
  cd.ElementEntitySubType.Icon,
  cd.ElementEntitySubType.BoardPortal,
  cd.ElementEntitySubType.Generic,
  cd.ElementEntitySubType.IFrame,
];

/** Generates select items from registered components. */
export const generateAuditPageSelectList = (): cd.ISelectItem[] => {
  const items: cd.ISelectItem[] = [];
  const components = getComponents(cd.ComponentLibrary.All, true);
  for (const cmp of components) {
    if (!EXCLUDED_SELECT_ITEMS.includes(cmp.id)) {
      const title = !!cmp.library ? `${toTitleCase(cmp.library)} - ${cmp.title}` : cmp.title;
      items.push({ value: cmp.id, title: title });
    }
  }
  return items;
};

/**
 * Retrieves the audit view for rendering the audit page for each component.
 * 1) Use audit config if provided on definition
 * 2) Use manually created version if available
 * 3) Auto-generate a version from definition
 */
export const getAuditViewForComponent = (id: cd.ComponentIdentity): IAuditView => {
  const component = getComponent(id);
  if (!component) throw new Error(`Not component found for id ${id}`);

  // Use definition audit config
  if (component.audit) {
    return createAuditViewFromDefinition(component);
  }

  // Use custom view if available
  const view = CUSTOM_AUDIT_VIEWS.find((v) => v.elementType === id);
  if (view) return view;

  // Use auto-generated audit config
  const auditConfig = autoGenAuditConfig(component);
  return createAuditViewFromDefinition(component, auditConfig);
};
