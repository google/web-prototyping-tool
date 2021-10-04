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

import { IStringMap } from 'cd-interfaces';

export default {
  role: 'Choosing an appropriate role gives assistive technologies information about how to handle each element.',
  'aria-activedescendant':
    'Identifies the currently active element when DOM focus is on a composite widget, textbox, group, or application.',
  'aria-atomic':
    'Indicates whether assistive technologies will present all, or only parts of, the changed region based on the change notifications defined by the aria-relevant attribute.',
  'aria-autocomplete':
    "Indicates whether inputting text could trigger display of one or more predictions of the user's intended value for an input and specifies how predictions would be presented if they are made.",
  'aria-busy':
    'Indicates an element is being modified and that assistive technologies MAY want to wait until the modifications are complete before exposing them to the user.',
  'aria-checked':
    'Indicates whether the element is checked (true), unchecked (false), or represents a group of other elements that have a mixture of checked and unchecked values (mixed).',
  'aria-colcount': 'Defines the total number of columns in a table, grid, or treegrid.',
  'aria-colindex':
    "Defines an element's column index or position with respect to the total number of columns within a table, grid, or treegrid.",
  'aria-colspan':
    'Defines the number of columns spanned by a cell or gridcell within a table, grid, or treegrid.',
  'aria-controls':
    'Identifies another element (or elements) whose contents or presence are controlled by the current element.',
  'aria-current':
    'Indicates the element within a set of related elements is visually styled to indicate it is the current item in the set. ',
  'aria-describedby':
    'Identifies another element (or elements) that describes the current element, whose plain text description is intended to provide more verbose information. Used for auxiliary information.',
  'aria-details':
    'Identifies another element that provides a detailed, extended description for the current element. Used when the referenced element requires HTML markup instead of plain text.',
  'aria-disabled':
    'Indicates that the element is perceivable but disabled, so it is not editable or otherwise operable.',
  'aria-errormessage':
    'Identifies another element that provides an error message for the current element.',
  'aria-expanded':
    'Indicates whether the element, or another grouping element it controls, is currently expanded or collapsed.',
  'aria-flowto':
    "Identifies the next element (or elements) in an alternate reading order of content which, at the user's discretion, allows assistive technology to override the general default of reading in document source order.",
  'aria-haspopup':
    'Indicates the availability and type of interactive popup element, such as menu or dialog, that can be triggered by an element.',
  'aria-hidden':
    'Used to hide visibly rendered content from assistive technologies only if the act of hiding this content is intended to improve the experience by removing redundant or extraneous content.',
  'aria-invalid':
    'Indicates the entered value does not conform to the format expected by the application.',
  'aria-keyshortcuts':
    'List of keyboard shortcuts that an author has implemented to activate or give focus to an element.',
  'aria-label':
    'A string that labels the current element. Used where a text label is not visible on the screen.',
  'aria-labelledby':
    'Identifies another element (or elements) that labels the current element. Used for primary information. Can be used on any element.',
  'aria-level':
    'Defines the hierarchical level of an element within a structure. The value for aria-level is greater than or equal to 1.',
  'aria-live':
    'Indicates that an element will be updated, and describes the types of updates the user agents, assistive technologies, and user can expect from the live region.',
  'aria-modal':
    'Used to indicate that the presence of a "modal" element precludes usage of other content on the page, until the modal dialog loses focus or is no longer displayed.',
  'aria-multiline':
    'Indicates whether a text box accepts multiple lines of input or only a single line.',
  'aria-multiselectable':
    'Indicates that the user may select more than one item from the current selectable descendants.',
  'aria-orientation':
    "Indicates whether the element's orientation is horizontal, vertical, or unknown/ambiguous.",
  'aria-owns':
    'Exposes a parent/child contextual relationship to assistive techologies that is otherwise impossible to infer from the DOM.',
  'aria-placeholder':
    'Defines a short hint (a word or short phrase) intended to aid the user with data entry when the control has no value. A hint could be a sample value or a brief description of the expected format.',
  'aria-posinset':
    "Defines an element's number or position in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM.",
  'aria-pressed': 'Indicates the current "pressed" state of toggle buttons.',
  'aria-readonly': 'Indicates that the element is not editable, but is otherwise operable.',
  'aria-relevant':
    'Describes what types of changes have occurred to an aria-live region, and determines which changes are relevant and should be announced.',
  'aria-required':
    'Indicates that user input is required on the element before a form may be submitted.',
  'aria-roledescription':
    'Defines a human-readable, author-localized description for the role of an element.',
  'aria-rowcount':
    'Defines the total number of rows in a table, grid, or treegrid. Not required if all rows are present in the DOM.',
  'aria-rowindex':
    "Defines an element's row index or position with respect to the total number of rows within a table, grid, or treegrid. Not required if all rows are present in the DOM.",
  'aria-rowspan':
    'Defines the number of rows spanned by a cell or gridcell within a table, grid, or treegrid.',
  'aria-selected': 'Indicates the current "selected" state of various widgets.',
  'aria-setsize':
    'Defines the number of items in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM.',
  'aria-sort': 'Indicates if items in a table or grid are sorted in ascending or descending order.',
  'aria-valuemax': 'Defines the maximum allowed number value for a range widget.',
  'aria-valuemin': 'Defines the minimum allowed number value for a range widget.',
  'aria-valuenow':
    'Defines the current value for a range widget, such as a slider, spinbutton or progressbar.',
  'aria-valuetext':
    'Defines the human readable text alternative of<a href="https://www.w3.org/TR/wai-aria/#aria-valuenow" target="_blank">aria-valuenow</a> for a range widget when the rendered value cannot be meaningfully represented as a number.',
} as IStringMap<string>;
