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
import {
  getPropertyMap,
  isBooleanProperty,
  isNumberProperty,
  getPropsRecursive,
} from 'cd-common/models';
import { IAuditView, IAuditVariant, IAuditSubVariant } from './configs/audit.config';
import { deepCopy } from 'cd-utils/object';
import { isNumber } from 'cd-utils/numeric';
import * as consts from 'cd-common/consts';

const DEFAULT_TEXT = 'Hello world!';
const DEFAULT_PARAGRAPH =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua';
const DEFAULT_DATE = new Date('1970-1-1');
const DEFAULT_ICON = 'local_florist';
const DEFAULT_LIST = [
  { name: 'Option 1', value: 1 },
  { name: 'Option 2', value: 2 },
  { name: 'Option 3', value: 3 },
];
const TRUE = 'True';
const FALSE = 'False';
const TITLE_DIVIDER = ' / ';

/** Some properties should be ignored when auto-generating entire audit config. */
const AUTOGEN_IGNORE_PROPS = [
  consts.TOOLTIP_LABEL_ATTR,
  consts.TOOLTIP_POSITION_ATTR,
  consts.HIDDEN_ATTR,
];

interface IPropertyNameValue {
  name: string;
  value: any;
  title?: string;
}

/** Auto-generates the audit config form definition. */
export const autoGenAuditConfig = (component: cd.IComponent): cd.IAuditConfig => {
  return { sections: autoGenAllPropertySections(component) };
};

/** Auto-generates all audit sections for a specific component. */
const autoGenAllPropertySections = (component: cd.IComponent): cd.IAuditSection[] => {
  const sections: cd.IAuditSection[] = [];

  // Avoid duplicate properties names.  This can occur in rare situations, such
  // as 2 properties for 2 separate variants, with the same name
  const nameSet = new Set<string>();

  for (const prop of getPropsRecursive(component.properties)) {
    const name = prop.name;
    // No need to add section for main property, since it's added to all sections
    if (name && name !== component.audit?.variantProperty) {
      if (isValidName(name, nameSet)) {
        sections.push({ properties: [name] });
        nameSet.add(name);
      }
    }
  }
  return sections;
};

const isValidName = (name: string, nameSet: Set<string>): boolean => {
  return !AUTOGEN_IGNORE_PROPS.includes(name) && !nameSet.has(name);
};

/** Creates an audit view for rendering, from a component definition. */
export const createAuditViewFromDefinition = (
  component: cd.IComponent,
  auditConfig?: cd.IAuditConfig
): IAuditView => {
  const auditView: IAuditView = {
    title: component.title,
    elementType: component.id,
    variants: createVariants(component, auditConfig),
  };

  // Set column width
  const audit = auditConfig || component.audit;
  if (!audit?.columnWidth) return auditView;

  let width = audit?.columnWidth;
  if (isNumber(width)) width = `${width}px`;
  auditView.columnWidth = width;
  return auditView;
};

/** Creates all variants for a component, given an audit config. */
const createVariants = (
  component: cd.IComponent,
  auditConfig?: cd.IAuditConfig
): IAuditVariant[] => {
  const propsMap = getPropertyMap(component.properties);
  const audit = auditConfig || component.audit;
  if (!audit) return [];

  const groupLabels = getGroupLabelsForProperties(component.properties);

  // Start with provided sections, or empty list
  let sections: cd.IAuditSection[] = audit.sections || [];

  // For `autoGenerateSections=true`, dynamically create a section for each property
  if (audit.autoGenerateSections) {
    sections = sections.concat(autoGenAllPropertySections(component));
  }

  // If `variantProperty=true`, repeat all other properties for each value, which is
  // usually the variant or type of a component. We need to add each possible
  // value of the property to each section.
  const variantTitles: string[] = [];
  if (audit.variantProperty) {
    const updatedSections: cd.IAuditSection[] = [];

    // Get all options for the variant property.  Since the method can takes multiple
    // properties, but only takes 1 here, only take the first result.
    const mainPropOptions = getAllPossiblePropertyNameValues(
      [audit.variantProperty],
      propsMap,
      groupLabels,
      component,
      audit
    )[0];

    // Loop all sections over every option for variant property
    for (const option of mainPropOptions) {
      for (const section of sections) {
        const copy = deepCopy(section);
        copy.values = { ...copy.values, ...{ [option.name]: option.value } };
        updatedSections.push(copy);
        variantTitles.push(option.title || option.value);
      }
    }
    sections = updatedSections;
  }

  // Convert the sections to variants
  return sections
    .map<IAuditVariant | undefined>((section: cd.IAuditSection, i) => {
      const variantTitle = variantTitles?.length ? variantTitles[i] : undefined;
      return convertSectionToAuditVariant(
        section,
        component,
        audit,
        propsMap,
        groupLabels,
        variantTitle
      );
    })
    .filter((v: IAuditVariant | undefined) => v !== undefined) as IAuditVariant[];
};

const convertSectionToAuditVariant = (
  section: cd.IAuditSection,
  component: cd.IComponent,
  audit: cd.IAuditConfig,
  propsMap: Record<string, cd.IPropertyGroup>,
  groupLabels: Record<string, string>,
  variantTitle?: string
): IAuditVariant | undefined => {
  // Get ste of property names for this section
  const propNames = !!audit.properties
    ? Array.from(new Set([...audit.properties, ...section.properties]))
    : section.properties;

  // Section title
  let sectionTitle = '';
  if (section.title) sectionTitle = section.title;
  else {
    const titles = propNames.map<string>((propName: string) => {
      const prop = propsMap[propName];
      return getTitleForProperty(prop, groupLabels);
    });
    sectionTitle = titles.length > 1 ? titles.join(TITLE_DIVIDER) : titles[0];
    // For variant property, prepend variant to title
    if (variantTitle) {
      sectionTitle = `${variantTitle} | ${sectionTitle}`;
    }
  }

  // Get all possible value sets for properties
  const allValues: IPropertyNameValue[][] = getAllPossiblePropertyNameValues(
    propNames,
    propsMap,
    groupLabels,
    component,
    audit
  );

  // Some input types may be missing
  if (!allValues.length) {
    console.warn(`Values not available for audit section: ${sectionTitle}`);
    return;
  }

  // Get all possible combinations of possible value sets
  const allCombos: IPropertyNameValue[][] = getCombinations(allValues);

  // Convert all possible value sets into component variants
  const variant: IAuditVariant = {
    title: sectionTitle as string,
    subVariants: [],
  };
  for (const combo of allCombos) {
    const subVar: IAuditSubVariant = {
      title: '',
      inputs: {},
    };

    // Global values
    if (audit.values) {
      subVar.inputs = { ...audit.values };
    }

    // Section values
    if (section.values) {
      subVar.inputs = { ...section.values, ...subVar.inputs };
    }

    // Combo values
    const titleSegments = [];
    for (const nameValue of combo) {
      if (nameValue.title) {
        titleSegments.push(nameValue.title);
      } else {
        titleSegments.push(nameValue.name);
      }
      subVar.inputs[nameValue.name] = nameValue.value;
    }
    subVar.title = titleSegments.length > 1 ? titleSegments.join(TITLE_DIVIDER) : titleSegments[0];

    // Run transforms on inputs
    if (audit.transform) {
      // Exclude component if return value if `false`
      if (!audit.transform(subVar.inputs)) continue;
    }

    variant.subVariants.push(subVar);
  }

  return variant;
};

/** Returns a map of group labels to their associated property names. */
const getGroupLabelsForProperties = (props: cd.IPropertyGroup[]): Record<string, string> => {
  const labels: Record<string, string> = {};
  for (const prop of props) {
    if (prop.children && prop.label) {
      for (const child of prop.children) {
        if (child.name) {
          labels[child.name] = prop.label;
        }
      }
    }
  }
  return labels;
};

/**
 * Gets a list of all property name/values for a specific component.  In some
 * cases, possible values need to be guesstimated or generated, such as with
 * text, dates, numbers, etc.
 */
const getAllPossiblePropertyNameValues = (
  propertyNames: string[],
  propsMap: Record<string, cd.IProperty>,
  groupLabels: Record<string, string>,
  component: cd.IComponent,
  auditConfig: cd.IAuditConfig
): IPropertyNameValue[][] => {
  const results: IPropertyNameValue[][] = [];
  for (const propName of propertyNames) {
    // Exclude certain properties
    if (auditConfig.exclude?.includes(propName)) continue;

    const prop = propsMap[propName];

    // Selectable input, use menu data values
    if (prop.menuData) {
      const valueSet = prop.menuData.map((menuItem): IPropertyNameValue => {
        return {
          name: propName,
          value: menuItem.value,
          title: menuItem.title,
        };
      });
      results.push(valueSet);
    }
    // Generic list, Option 1/2/3
    else if (prop.inputType === cd.PropertyInput.List) {
      results.push([{ name: propName, value: DEFAULT_LIST }]);
    }
    // Boolean, true/false
    else if (isBooleanProperty(prop)) {
      results.push([
        { name: propName, value: true, title: TRUE },
        { name: propName, value: false, title: FALSE },
      ]);
      continue;
    }
    // TODO: Account for DynamicList, PortalSlot

    const title = getTitleForProperty(prop, groupLabels);
    const withTitle = `With ${title}`;
    const withoutTitle = `Without ${title}`;

    // Icon, with/without icon
    if (prop.inputType === cd.PropertyInput.Icon) {
      results.push([
        { name: propName, value: DEFAULT_ICON, title: withTitle },
        { name: propName, value: '', title: withoutTitle },
      ]);
    }
    // Text, with/without text
    else if (prop.inputType === cd.PropertyInput.Text) {
      results.push([
        { name: propName, value: DEFAULT_TEXT, title: withTitle },
        { name: propName, value: '', title: withoutTitle },
      ]);
    }
    // TextArea/Rich-text, with/without text
    else if (
      prop.inputType === cd.PropertyInput.TextArea ||
      prop.inputType === cd.PropertyInput.RichText
    ) {
      results.push([
        { name: propName, value: DEFAULT_PARAGRAPH, title: withTitle },
        { name: propName, value: '', title: withoutTitle },
      ]);
    }
    // Date, with/without date
    else if (prop.inputType === cd.PropertyInput.Date) {
      results.push([
        { name: propName, value: DEFAULT_DATE, title: withTitle },
        { name: propName, value: '', title: withoutTitle },
      ]);
    }
    // Number, min/half/max
    else if (isNumberProperty(prop)) {
      const min = prop.min || 0;
      const max = prop.max || 100;
      const defaultVal = prop.defaultValue || component.inputs?.[propName] || Math.round(max / 2);
      results.push([
        { name: propName, value: min, title: `Value: ${min}` },
        { name: propName, value: defaultVal, title: `Value: ${defaultVal}` },
        { name: propName, value: max, title: `Value: ${max}` },
      ]);
    }
  }

  return results;
};

/** Gets all possible combinations of a set of values. */
const getCombinations = (sets: any[][]): any[][] => {
  if (sets.length === 1) return sets[0].map((c) => [c]);
  const otherCombos = sets.reduce((a, b) => {
    return a.reduce((r, v) => {
      return r.concat(b.map((w) => [].concat(v, w)));
    }, []);
  });
  return otherCombos.sort();
};

/**
 * For the title, try to use the label or group label first, then use
 * `property.name` as a last resort.
 */
const getTitleForProperty = (
  prop: cd.IPropertyGroup,
  groupLabels: Record<string, string>
): string => {
  const name = prop.name as string;
  return prop.label || groupLabels[name] || name;
};
