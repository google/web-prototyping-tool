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

/** Internally exposed built-in property group types. */
export enum PropertyType {
  ActionNavigation, // TODO: Remove this
  AttributeGeneric,
  BoardBackground,
  BoardPreviewVisibility,
  BoardPortal,
  BoardSize,
  /** Initial Size is used by Symbols and Code Components */
  InitialSize,
  IconInput,
  ImageSize,
  ImageCrop,
  ImageSource,
  MapAttributes,
  PortalList,
  StyleAdvanced,
  StyleBackground,
  StyleBorder,
  StyleBoxShadow,
  StyleFilter,
  StyleGeneric,
  StyleInnerLayout,
  StyleOpacity,
  StyleOverflow,
  StylePadding,
  StylePosition,
  StyleRadius,
  StyleSize,
  StyleText,
  StyleTextShadow,
  StyleTypography,
  SymbolOverrides,
  TableColumns,
  TextAdvanced,
  TextInput,
  VideoAttributes,
  EmbedAttributes,
  CheckboxChildren,
  AutoNavItemDestination,
}
