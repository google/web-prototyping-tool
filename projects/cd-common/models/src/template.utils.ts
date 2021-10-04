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

/* eslint-disable max-lines */

import * as cd from 'cd-interfaces';
import * as consts from 'cd-common/consts';

import { stringMatchesRegex, htmlEscapeDoubleQuotes } from 'cd-utils/string';
import { classNameFromProps } from 'cd-common/utils';

//#region Consts
export const ELEMENT_ID = 'elementId';

export const PROPS = 'props';
export const INDEX_VAR = 'i';
export const INPUTS = 'inputs';

const ATTR_PREFIX = 'attr';
const BRACKET_OPEN = '[';
const BRACKET_CLOSE = ']';
const SPACE = ' ';
const PARENTHESIS_OPEN = '(';
const PARENTHESIS_CLOSE = ')';
const DOUBLE_CURLY_OPEN = '{{';
const DOUBLE_CURLY_CLOSE = '}}';
const COLON = ':';
const PIPE = '|';
const NG_IF = '*ngIf';
const NG_FOR = '*ngFor';
const NG_EVENT = '$event';
const STYLE_MAP = 'styleMap';
const STYLE_DIRECTIVE_ID = 'styleId';
const CHILD_ITERATOR = `<ng-container *ngIf="${PROPS}?.childIds; let childIds" [ngTemplateOutlet]="children" [ngTemplateOutletContext]="{ $implicit:childIds }"></ng-container>`;
const NG_SWITCH_CASE = '*ngSwitchCase';
const NG_SWITCH_DEFAULT = '*ngSwitchDefault';
const OUTPUT_CHANGE_RENDERER_BINDING = 'onOutputChange';
const DEFAULT_MARKER_CONDITION = `!${consts.OUTLET_CMP_INPUT_INSTANCE_ID}`;
const CLASS_PREFIX_PIPE = 'classPrefixPipe';
const CSS_VAR_PIPE = 'cssVarPipe';
const CONDITIONAL_ATTR_PIPE = 'conditionalAttrPipe';

const COERCE_TYPE_MAP: Record<cd.CoerceValueType, string> = {
  [cd.CoerceValue.String]: 'coerceStringPipe',
  [cd.CoerceValue.Boolean]: 'coerceBooleanPipe',
  [cd.CoerceValue.Number]: 'coerceNumberPipe',
};

const DATASET_LOOKUP_PIPE = 'datasetLookupPipe';
const DATA_BINDING_LOOKUP_PIPE = 'dataBindingLookupPipe';
const DATA_REFRESH_TRIGGER = `dataBindingRefreshTrigger`;
const VALID_PROP_REGEX = /^[_$a-zA-Z][_$\w]*$/;

// pipe lookup for data binding => '| dataBindingRefreshTrigger'
const DATA_BINDING_LOOKUP = `${PIPE} ${DATA_BINDING_LOOKUP_PIPE}${COLON}${DATA_REFRESH_TRIGGER}`;
export const HAS_VALUE_PIPE = `${PIPE} hasValuePipe:${consts.OUTLET_CMP_INPUT_PROPERTIES_MAP}`;

//#endregion

//#region Utils

/**
 * Used to ensure model for referenceId exists and prevent circular dependencies with cd-outlets
 */
export const circularOutletGuard = (refId: string) => {
  const referencedModelExists = `${refId} ${HAS_VALUE_PIPE}`;
  return `(${refId} | ${consts.CIRCULAR_GAURD_PIPE}:${consts.OUTLET_CMP_ANCESTORS_ATTR}:${consts.OUTLET_CMP_INPUT_RENDER_ID}) && ${referencedModelExists}`;
};

export const wrapInParenthesis = (value: string) => {
  return `${PARENTHESIS_OPEN}${value}${PARENTHESIS_CLOSE}`;
};

export const wrapInCurlyBraces = (value: string): string => {
  return `${DOUBLE_CURLY_OPEN} ${value} ${DOUBLE_CURLY_CLOSE}`;
};

export const wrapInSingleQuotes = (value: string) => `'${value}'`;
/** Takes a value and wraps it in brackets [value] */
export const wrapInBrackets = (value: string): string => {
  return BRACKET_OPEN + value + BRACKET_CLOSE;
};

export const getAttributeDataIdFromElement = (elem: HTMLElement): string => {
  return elem.dataset[consts.DATASET_ID_PROP] || '';
};

export const buildNgFor = (itemName: string, items: string, index = false): string => {
  const suffix = index ? ` let ${INDEX_VAR} = index` : '';
  return `let ${itemName} of ${items};${suffix}`;
};

export const generateCallback = (functionName: string): string => {
  return `${functionName}(${NG_EVENT})`;
};

export const isValidAttribute = (value: any): boolean => {
  return value !== false && value !== null && value !== undefined;
};

/**
 * Generates binding to a callback within outlet-manager
 * used to dispatch actions or update values on selection, check, input etc
 * e.g OutputChange($event.value,elementId,'value')
 * if writeValue = false we don't update the inputBinding to the value
 */
const generateOutputCallback = (value: string, inputBinding: string, writeValue: boolean) => {
  const args = [value, ELEMENT_ID, `'${inputBinding}'`];
  if (!writeValue) args.push(String(false));
  const wrappedArgs = wrapInParenthesis(args.toString());
  return OUTPUT_CHANGE_RENDERER_BINDING + wrappedArgs;
};

/**
 * Returns true if tagName represents a void element
 * https://www.w3.org/TR/html5/syntax.html#void-elements
 */
export const isVoidTag = (tagName: string): boolean => {
  return consts.VOID_ELEMENTS.includes(tagName.toLowerCase());
};

export const mergeKeyValue = (key: string, value: any): string => {
  const escapedValue = htmlEscapeDoubleQuotes(String(value));
  const val = value ? `="${escapedValue}"` : '';
  return key + val;
};

export const convertAttrsToString = (attrs: cd.IStringMap<any>): string => {
  const attrEntries = Object.entries(attrs);
  const merged = attrEntries.map(([key, val]) => mergeKeyValue(key, val));
  return merged.length ? ` ${merged.join(SPACE)}` : '';
};

export const generateClosingTag = (tagName: string): string => {
  return isVoidTag(tagName) ? '' : `</${tagName}>`;
};

/** Recursively generates all child content for a set of components. */
export const generateContent = (
  // Passthrough to avoid circular dependency
  getComponentFn: (id: cd.ComponentIdentity | undefined) => cd.IComponent | undefined,
  rootIds: string[]
): string => {
  return rootIds.reduce<string>((html, id) => {
    const props = TemplateFactory.projectProperties[id];
    if (!props) return html;

    // Recursively generate content
    const { childIds, elementType } = props;
    const hasChildren = childIds && childIds.length > 0;
    const content: string = hasChildren ? generateContent(getComponentFn, childIds) : '';

    // Get template function for type
    const cmp = getComponentFn(elementType);
    if (!cmp) return '';

    const templateFunction = cmp.template;
    if (!templateFunction) return html;

    // Pass reference to assembleTemplateForExport function to generators
    // so they can assemble sub templates (e.g. symbol instance or portal)
    html += templateFunction(cd.TemplateBuildMode.Simple, props, content);

    return html;
  }, '');
};

//#endregion

//#region Property path utils

/**  Returns `path?.value` or `path['value']` */
export const lookupPropAtPath = (path: string, value: string) => {
  const isValidProp = stringMatchesRegex(value, VALID_PROP_REGEX);
  const suffix = isValidProp ? `?.${value}` : wrapInBrackets(`'${value}'`);
  return path + suffix;
};

/**  Returns `inputs?.value` or `inputs?[value]` */
export const inputProp = (value: string) => {
  return lookupPropAtPath(INPUTS, value);
};

/**  Returns `props?.value` or `props?[value]` */
export const propsBinding = (value: string) => {
  return lookupPropAtPath(PROPS, value);
};

/** Return `value | dataBindingRefreshTrigger */
const addDataBindingLookupPipe = (value: string) => {
  return `${value} ${DATA_BINDING_LOOKUP}`;
};

/** Returns `value | coerceTypePipe:coerceType` or */
const addTypCoercionPipe = (value: string, coerceType: cd.CoerceValueType) => {
  return `${value} ${PIPE} ${COERCE_TYPE_MAP[coerceType]}`;
};

/**
 * Returns `props?.inputs?.value` or `props?.inputs[value]`
 *
 * Also will append dataBindingLookupPipe and coerceTypePipe if specified
 */
export const inputPropsBinding = (
  value: string,
  addDataBindingLookup = false,
  coerceType?: cd.CoerceValueType
) => {
  const prefix = `${PROPS}?.${INPUTS}`;
  let propLookup = lookupPropAtPath(prefix, value);
  if (addDataBindingLookup) propLookup = addDataBindingLookupPipe(propLookup);
  if (coerceType) propLookup = addTypCoercionPipe(propLookup, coerceType);
  return propLookup;
};

/** `props?.inputs?.value | pipe` */
export const inputPropsBindingWithPipe = (
  value: string,
  pipe: string,
  addDataBindingLookup = false,
  coerceType?: cd.CoerceValueType
) => {
  const propLookup = inputPropsBinding(value, addDataBindingLookup, coerceType);
  const pipeSuffix = pipe ? ` ${PIPE} ${pipe}` : '';
  return `${propLookup}${pipeSuffix}`;
};

//#endregion

//#region Factory

/**
 * Builds a string HTML template for a component or element.
 * Multiple build modes are supported, including Internal, Simple, Application.
 */
export class TemplateFactory {
  /** All property models for the current project. */
  public static projectProperties: cd.ElementPropertiesMap = {};

  /** Add assets for the current project. */
  public static projectAssets: Record<string, cd.IProjectAsset> = {};

  private _attrs: Record<string, string> = {};
  private _directives: string[] = [];
  private _content = '';
  private _wrapperTemplate?: TemplateFactory;
  private _tagNameBinding = '';
  private _tagNamesBound: string[] = [];
  private _exportTagName?: string;

  /**
   * @param mode - The build mode determines what attributes, properties,
   *    and classes get added, as well as what methods are run.
   * @param tagName - The element tag name.
   */
  constructor(
    public readonly mode: cd.TemplateBuildMode,
    public tagName: string,
    model?: cd.IComponentInstance
  ) {
    if (mode === cd.TemplateBuildMode.Simple && model) {
      this.addModelAttributes(model.attrs, model.a11yInputs);
      // Attaches a unique classname during export
      if (model.id) {
        const className = classNameFromProps(model);
        this.addCSSClass(className);
      }
    }
  }

  addDefaultAttributes(dataId = true, markerCondition = DEFAULT_MARKER_CONDITION) {
    // This will conditionally add a render rect marker class when markerCondition is met
    // Default condition will add marker when element is not contained
    // inside of a portal or symbol instance
    this.addConditionalCSSClass(consts.RENDER_RECT_MARKER_CLASS, markerCondition);

    // All rendered elements use this class to apply style overrides when needed (e.g. drag/drop preview)
    this.addCSSClass(consts.RENDERED_ELEMENT_CLASS);

    if (dataId) {
      this.addDataIdAttribute();

      // In addition to data-id elements receive a data-full-id-path attribute which provides the
      // full id path to the element. For example: board1-group1-element1
      this.addFullIdPathAttribute();
    }

    this.addBoundAttribute(consts.CD_STYLE_DIRECTIVE, `${STYLE_MAP}${wrapInBrackets(ELEMENT_ID)}`);
    this.addBoundAttribute(
      consts.CD_STYLE_CLASS_PREFIX_ATTR,
      consts.OUTLET_CMP_INPUT_ELEMENT_CLASS_PREFIX
    );
    this.addClassPropsBinding(consts.TEMPLATE_PREVIEW_STYLES_CLASS, consts.SHOW_PREVIEW_STYLES);

    // Add cdHidden directive
    this.addPropsBoundInputAttribute(
      consts.CD_HIDDEN_DIRECTIVE,
      consts.HIDDEN_ATTR,
      true,
      cd.CoerceValue.Boolean
    );

    this.addPropsBoundInputAttribute(consts.CD_CO_TOOLTIP, consts.TOOLTIP_LABEL_ATTR);
    this.addPropsBoundInputAttribute(consts.CD_CO_TOOLTIP_POSITION, consts.TOOLTIP_POSITION_ATTR);
    this.addPropsBoundAttribute(consts.CD_ATTRS_DIRECTIVE, consts.ATTRS);
    this.addPropsBoundAttribute(consts.CD_A11Y_ATTRS_DIRECTIVE, consts.A11Y_INPUTS);
    return this;
  }

  addModelAttributes(attrs: cd.IKeyValue[] = [], a11yInputs?: cd.IA11yInputs) {
    const ariaAttrs = a11yInputs?.ariaAttrs || [];
    const allAttrs = [...attrs, ...ariaAttrs];

    for (const { name, value } of allAttrs) {
      if (!isValidAttribute(value)) continue;
      this.addAttribute(name, value);
    }
  }

  setExportTagName(exportTagName: string) {
    this._exportTagName = exportTagName;
  }

  /**
   * This CSS class applies width/height: fit-content. It is applied to ensure the dimensions
   * wrap inner content and works with position:absolute. Applied on a case by case basis
   */
  addFitContentClass() {
    this.addCSSClass(consts.FIT_CONTENT_CLASS);
    return this;
  }

  /** This is used to ensure that a board's styles changes in when changing boardIds in preview */
  addStyleDirectiveId(id = ELEMENT_ID) {
    this.addBoundAttribute(STYLE_DIRECTIVE_ID, id);
    return this;
  }

  addDataIdAttribute(id = ELEMENT_ID) {
    this.addAttrBoundAttribute(consts.TEMPLATE_ID_ATTR, id);
    return this;
  }

  /**
   * Add data attribute for data-full-id-path
   */
  addFullIdPathAttribute(id = ELEMENT_ID) {
    const fullIdValue = `${id} | ${consts.FULL_ID_PATH_PIPE} : ${consts.OUTLET_CMP_INPUT_ANCESTORS}`;
    this.addAttrBoundAttribute(consts.TEMPLATE_FULL_ID_PATH_ATTR, fullIdValue);
    return this;
  }

  addHandler(eventName: string, callbackFunctionName: string) {
    const eventAttribute = wrapInParenthesis(eventName);
    const eventCallback = generateCallback(callbackFunctionName);
    this.addAttribute(eventAttribute, eventCallback);
    return this;
  }

  addWrapper(template: TemplateFactory) {
    this._wrapperTemplate = template;
    return this;
  }

  /* Angular Logic */

  add_ngIf_conditionProps(value: string, isInput = false) {
    const propsPath = isInput ? inputPropsBinding(value) : propsBinding(value);
    this._attrs[NG_IF] = propsPath;
    return this;
  }

  add_ngIf_Attribute(expression: string) {
    this._attrs[NG_IF] = expression;
    return this;
  }

  add_ngIf_let(expression: string, letName: string) {
    return this.add_ngIf_Attribute(`${expression}; let ${letName}`);
  }

  add_ngIf_else_Attribute(expression: string, templateName: string) {
    return this.add_ngIf_Attribute(`${expression}; else ${templateName}`);
  }

  add_ngFor_Attribute(
    key: string,
    binding: string,
    index = false,
    supportsDataBinding = false,
    coerceType?: cd.CoerceValueType,
    pipe?: string
  ) {
    const ref = pipe
      ? inputPropsBindingWithPipe(binding, pipe, supportsDataBinding, coerceType)
      : inputPropsBinding(binding, supportsDataBinding, coerceType);
    const ngForValue = buildNgFor(key, ref, index);
    this._attrs[NG_FOR] = ngForValue;
    return this;
  }

  /** [ngSwitch]="props?.inputs?.value" */
  addPropsBoundInputSwitch(value: string) {
    this.addPropsBoundInputAttribute(consts.NG_SWITCH, value);
    return this;
  }

  /** *ngSwitchDefault */
  addSwitchDefault() {
    this.addDirective(NG_SWITCH_DEFAULT);
    return this;
  }

  /** *ngSwitchCase="value" */
  addSwitchCase(value: string) {
    this._attrs[NG_SWITCH_CASE] = value;
    return this;
  }

  /** Builds a switch for a tag name bound to an input. */
  addTagBoundInputSwitch(binding: string, tagNames: string[]) {
    this._tagNameBinding = binding;
    this._tagNamesBound = tagNames;
    return this;
  }

  addDirective(directive: string) {
    this._directives.push(directive);
    return this;
  }

  /* CSS Classes / Styles */

  /** Appends a classname to the class attribute */
  addCSSClass(className: string) {
    const currentClasses = this._attrs[consts.CLASS_ATTR];
    const classValue = currentClasses ? `${currentClasses} ${className}` : className;
    this._attrs[consts.CLASS_ATTR] = classValue;
    return this;
  }

  /** [class.className]="condition" */
  addConditionalCSSClass(className: string, condition: string) {
    const binding = `${consts.CLASS_ATTR}.${className}`;
    return this.addBoundAttribute(binding, condition);
  }

  /** [class.className]="props?.binding" || [class.className]="props?.input?.binding" */
  addClassPropsBinding(
    className: string,
    binding: string,
    isInput?: boolean,
    addDataBindingLookup = false,
    coerceType?: cd.CoerceValueType
  ) {
    const classKey = `${consts.CLASS_ATTR}.${className}`;
    this.addPropsBoundAttribute(classKey, binding, isInput, addDataBindingLookup, coerceType);
    return this;
  }

  /**
   * [style.--var]=`'value'` or [style.--var]=`"'value'"`
   *
   * Addittional quotes are needed if this var is being used for the content property of a psuedo element
   */
  addCssVar(varName: string, value: string, addAdditionalQuotesForCSSContent = false) {
    const binding = wrapInBrackets(`${consts.STYLE_ATTR}.${varName}`);
    const val = addAdditionalQuotesForCSSContent ? `"'${value}'"` : `'${value}'`;
    this.addAttribute(binding, val);
  }

  /** [style.--var]="props?.input[inputName] | cssVarPipe" */
  addCssVarInputBinding(varName: string, inputName?: string) {
    const binding = wrapInBrackets(`${consts.STYLE_ATTR}.${varName}`);
    const value = inputPropsBindingWithPipe(inputName || varName, CSS_VAR_PIPE);
    this.addAttribute(binding, value);
  }

  /* Attributes */

  /** key="value" */
  addAttribute(key: string, value: any, addIfUndefined = true) {
    if (!addIfUndefined && !value) return this;
    this._attrs[key] = value;
    return this;
  }

  /** Adds the attribute only if value is true. */
  addBooleanAttribute(key: string, value: boolean | undefined) {
    if (value === true) this.addAttribute(key, '');
    return this;
  }

  /** [attr.binding]="value" */
  addAttrBoundAttribute(binding: string, value: string) {
    this.addBoundAttribute(`${ATTR_PREFIX}.${binding}`, value);
    return this;
  }

  /**
   * Input values should be converted to boolean attributes.
   * @see {@link ConditionalAttrPipe}
   * [attr.binding]="props?.inputs?.value | conditionalAttrPipe"
   * [attr.binding]="props?.inputs[value] | conditionalAttrPipe"
   */
  addAttrBoundInputAttribute(
    binding: string,
    value: string,
    addDataBindingLookup = false,
    coerceType?: cd.CoerceValueType
  ) {
    const ref = inputPropsBinding(value, addDataBindingLookup, coerceType);
    this.addBoundAttribute(`${ATTR_PREFIX}.${binding}`, `${ref} | ${CONDITIONAL_ATTR_PIPE}`);
    return this;
  }

  /** [binding]="value" */
  addBoundAttribute(binding: string, value?: string) {
    const key = wrapInBrackets(binding);
    this._attrs[key] = value || binding;
    return this;
  }

  /** [binding]="props?.value" */
  addPropsBoundAttribute(
    binding: string,
    value?: string,
    isInput = false,
    dataBindable = false,
    coerceType?: cd.CoerceValueType
  ) {
    const key = wrapInBrackets(binding);
    const ref = value ? value : binding;

    // const prefixedRef = isInput ? inputProp(ref) : ref;
    const propsPath = isInput
      ? inputPropsBinding(ref, dataBindable, coerceType)
      : propsBinding(ref);
    this._attrs[key] = propsPath;
    return this;
  }

  /** [binding]="props?.inputs?.value" */
  addPropsBoundInputAttribute(
    binding: string,
    value?: string,
    dataBindable = false,
    coerceType?: cd.CoerceValueType
  ) {
    return this.addPropsBoundAttribute(binding, value, true, dataBindable, coerceType);
  }

  /** Adds an array of props as [binding]="props?.inputs?.value" */
  addPropsBoundInputAttributes(bindings: string[]) {
    for (const binding of bindings) {
      this.addPropsBoundInputAttribute(binding);
    }
    return this;
  }

  /** [binding]="props?.inputs?.binding | datasetLookupPipe:dataBindingRefreshTrigger" */
  addPropsBoundDatasetLookup(binding: string, value: string) {
    const inputLookup = inputPropsBinding(value);
    const datasetLookup = `${inputLookup} ${PIPE} ${DATASET_LOOKUP_PIPE}${COLON}${DATA_REFRESH_TRIGGER}`;
    return this.addBoundAttribute(binding, datasetLookup);
  }

  /**
   * [binding]="props?.inputs?.value | safeResourceURL"
   * [binding]="props?.inputs[value] | safeResourceURL"
   */
  addSafePropsBoundResourceAttribute(binding: string, value?: string, isInput = true) {
    const key = wrapInBrackets(binding);
    const ref = value ? value : binding;
    const propsPath = isInput ? inputPropsBinding(ref) : propsBinding(ref);

    this._attrs[key] = `${propsPath} ${PIPE} ${consts.RESOURCE_URL_SAFE_PIPE}`;
    return this;
  }

  /* Binding */

  /**
   * Adds a hook to the outlet component to update the data model
   * (change)="onOutputChange($event.checked, elementId, 'checked')"
   * @param eventBinding The event binding name (change, clicked, etc)
   * @param inputBinding The input this event should update on an element
   * @param eventKey optionally extract a value from the eventBinding i.e $event.foo
   * @param writeValue the value does not write to the property model if false
   */
  addOutputBinding(
    eventBinding: string,
    inputBinding: string,
    eventKey?: string,
    writeValue?: boolean
  ) {
    const evt = NG_EVENT + (eventKey ? `.${eventKey}` : '');
    const callback = generateOutputCallback(evt, inputBinding, writeValue !== false);
    const binding = wrapInParenthesis(eventBinding);
    this.addAttribute(binding, callback);
    return this;
  }

  /** Similar to Output binding but this does not write to the property model, it just dispatches an action */
  addOutputEvent(eventBinding: string, value: string, inputBinding: string) {
    // Note that false at the end is the distinction that this does not write to the property model
    const callback = generateOutputCallback(value, inputBinding, false);
    const binding = wrapInParenthesis(eventBinding);
    this.addAttribute(binding, callback);
    return this;
  }

  /** Creates a simple empty value event that does not write to model */
  addOutputEventEmpty(eventBinding: string) {
    return this.addOutputBinding(eventBinding, eventBinding, undefined, false);
  }

  /**
   * Generate use of classPrefixPipe pipe to generate elementClassPrefix
   * [elementClassPrefix]="elementId | classPrefixPipe : elementClassPrefix"
   */
  addElementClassPrefixBinding(addNgForIndexToId = false, slotName?: string) {
    let elementId = addNgForIndexToId ? `${ELEMENT_ID} + i` : ELEMENT_ID;
    if (slotName) elementId += ` + '-${slotName}'`;
    const value = `${elementId} ${PIPE} ${CLASS_PREFIX_PIPE} : ${consts.OUTLET_CMP_INPUT_ELEMENT_CLASS_PREFIX}`;
    return this.addBoundAttribute(consts.OUTLET_CMP_INPUT_ELEMENT_CLASS_PREFIX, value);
  }

  /** Inner text / Children */

  /** Appends child content string */
  addChild(content?: string) {
    if (!content) return this;
    this._content += content;
    return this;
  }

  /** <div>{{ props?.[input?.].value }}</div> */
  addInnerTextBinding(
    value: string,
    isInput = true,
    addDataBindingLookup = false,
    coerceType?: cd.CoerceValueType
  ) {
    const binding = isInput
      ? inputPropsBinding(value, addDataBindingLookup, coerceType)
      : propsBinding(value);
    const textContent = wrapInCurlyBraces(binding);
    this.addChild(textContent);
    return this;
  }

  allowChildren(condition = true) {
    if (!condition || !this.isInternal) return this;
    this._content += CHILD_ITERATOR;
    return this;
  }

  /* Conditionals */

  /** For an internally rendered template only. */
  get isInternal(): boolean {
    return this.mode === cd.TemplateBuildMode.Internal;
  }

  /** Not for internal, either simple or application. */
  get isExport(): boolean {
    return !this.isInternal;
  }

  /** For exporting to simple HTML for user copy/paste. */
  get isSimple(): boolean {
    return this.mode === cd.TemplateBuildMode.Simple;
  }

  /** For exporting as a complete application. */
  get isApplication(): boolean {
    return this.mode === cd.TemplateBuildMode.Application;
  }

  /** Runs commands only if internal. */
  if(condition: boolean, callback: (me: TemplateFactory) => void) {
    if (condition) callback(this);
    return this;
  }

  /** Runs commands only if internal. */
  ifInternal(callback: (me: TemplateFactory) => void) {
    if (this.isInternal) callback(this);
    return this;
  }

  /** Runs commands only if export. */
  ifExport(callback: (me: TemplateFactory) => void) {
    if (this.isExport) callback(this);
    return this;
  }

  /* Build */

  /** Builds the final template. */
  build(log = false): string {
    // Build a switch for multiple tag names, otherwise build a tag name
    return this._tagNamesBound.length ? this.buildTagSwitch(log) : this.buildTag(log);
  }

  /** Builds the template for the current tag. */
  private buildTag(log = false): string {
    const tagName = this.isExport && this._exportTagName ? this._exportTagName : this.tagName;

    let directives = this._directives.join(SPACE);
    if (directives) directives = ` ${directives} `;

    let attributes = convertAttrsToString(this._attrs);
    if (attributes) attributes = ` ${attributes}`;

    const openingTag = `<${tagName}${directives}${attributes}>`;
    let output = openingTag + this._content + generateClosingTag(tagName);

    // Add Wrapper
    if (this._wrapperTemplate) {
      output = this._wrapperTemplate.addChild(output).build();
    }

    // Logging
    if (log) console.log(output);

    return output;
  }

  /** Builds a switch template for multiple tag names. */
  private buildTagSwitch(log = false): string {
    this.tagName = consts.NG_CONTAINER;
    const containerFactory = new TemplateFactory(this.mode, consts.NG_CONTAINER);
    containerFactory.addPropsBoundInputSwitch(this._tagNameBinding);
    for (const tagName of this._tagNamesBound) {
      this.tagName = tagName;
      const tagInQuotes = wrapInSingleQuotes(tagName);
      this.addSwitchCase(tagInQuotes);
      containerFactory.addChild(this.buildTag());
    }
    return containerFactory.build(log);
  }
}

//#endregion
