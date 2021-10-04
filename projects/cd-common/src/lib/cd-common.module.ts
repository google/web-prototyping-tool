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

// Angular
import { NgModule } from '@angular/core';
/// Modules
import { AnimateInModule } from './directives/animate-in/animate-in.module';
import { AvatarDetailsModule } from './components/avatar-details/avatar-details.module';
import { AvatarModule } from './components/avatar/avatar.module';
import { BadgeModule } from './directives/badge/badge.module';
import { BorderInputModule } from './components/input/border/border-input.module';
import { ButtonModule } from './components/button/button.module';
import { CheckboxModule } from './components/checkbox/checkbox.module';
import { ChipInputModule } from './components/input/chip-input/chip-input.module';
import { ChipModule } from './components/chip/chip.module';
import { ColorInputModule } from './components/input/color/color-input.module';
import { ColorPickerModule } from './components/color-picker/color-picker.module';
import { ColorSliderModule } from './components/color-slider/color-slider.module';
import { ConfirmationDialogModule } from './components/confirmation-dialog/confirmation-dialog.module';
import { DataPickerModule } from './components/data-picker/data-picker.module';
import { DotsSelectorModule } from './components/dots-selector/dots-selector.module';
import { EditableNotesModule } from './components/editable-notes/editable-notes.module';
import { FileInputModule } from './components/file-input/file-input.module';
import { FontPickerModule } from './components/font-picker/font-picker.module';
import { HeaderModule } from './components/header/header.module';
import { IconInputModule } from './components/input/icon/icon-input.module';
import { IconModule } from './components/icon/icon.module';
import { IconPickerModule } from './components/icon-picker/icon-picker.module';
import { InjectedContentModule } from './components/injected-content/injected-content.module';
import { InputGroupModule } from './components/input-group/input-group.module';
import { InputModule } from './components/input/input.module';
import { InputResetModule } from './directives/input-reset/input-reset.module';
import { KeyValueEditorModule } from './components/key-value-editor/key-value-editor.module';
import { LoadingOverlayModule } from './components/loading-overlay/loading-overlay.module';
import { MeasuredTextModule } from './components/measured-text/measured-text.module';
import { MenuButtonModule } from './components/menu-button/menu-button.module';
import { MenuComboButtonModule } from './components/menu-combo-button/menu-combo-button.module';
import { MenuListItemModule } from './components/menu-list-item/menu-list-item.module';
import { MenuListModule } from './components/menu-list/menu-list.module';
import { MenuModule } from './components/menu/menu.module';
import { MenuWrapperModule } from './components/menu-wrapper/menu-wrapper.module';
import { ModeToggleButtonModule } from './components/mode-toggle-button/mode-toggle-button.module';
import { ProgressPieModule } from './components/progress-pie/progress-pie.module';
import { RangeModule } from './components/input/range/range.module';
import { RichTextEditorModule } from './components/rich-text-editor/rich-text-editor.module';
import { ScrollViewModule } from './components/scroll-view/scroll-view.module';
import { SearchBoxModule } from './components/search-box/search-box.module';
import { SearchInputModule } from './components/search-input/search-input.module';
import { SelectButtonModule } from './components/select-button/select-button.module';
import { SelectGridModule } from './components/select-grid/select-grid.module';
import { SelectInputModule } from './components/input/select-input/select-input.module';
import { SelectModule } from './components/select/select.module';
import { SelectWrapperModule } from './components/input/select-wrapper/select-wrapper.module';
import { ShadowModule } from './components/input/shadow/shadow.module';
import { SidePanelModule } from './components/side-panel/side-panel.module';
import { SliderModule } from './components/slider/slider.module';
import { SpinnerModule } from './components/spinner/spinner.module';
import { SvgDirectivesModule } from './directives/svg/svg.module';
import { SwatchModule } from './components/swatch/swatch.module';
import { SwitchModule } from './components/switch/switch.module';
import { TabGroupModule } from './components/tab-group/tab-group.module';
import { TextareaModule } from './components/textarea/textarea.module';
import { TextStylePropsModule } from './components/properties/text-style-props/text-style-props.module';
import { ToggleButtonGroupModule } from './components/toggle-button-group/toggle-button-group.module';
import { PropertyGroupModule } from './components/properties/property-group/property-group.module';
import { ValidIconModule } from './components/valid-icon/valid-icon.module';
import { CodeEditorModule } from './components/code-editor/code-editor.module';
import { AlignModule } from './components/properties/align-props/align.module';
import { PropertyListItemModule } from './components/properties/property-list-item/property-list-item.module';

@NgModule({
  exports: [
    AnimateInModule,
    AlignModule,
    AvatarDetailsModule,
    AvatarModule,
    BadgeModule,
    BorderInputModule,
    ButtonModule,
    CheckboxModule,
    ChipInputModule,
    ChipModule,
    CodeEditorModule,
    ColorInputModule,
    ColorPickerModule,
    ColorSliderModule,
    ConfirmationDialogModule,
    DataPickerModule,
    DotsSelectorModule,
    EditableNotesModule,
    FileInputModule,
    FontPickerModule,
    HeaderModule,
    IconInputModule,
    PropertyListItemModule,
    IconModule,
    IconPickerModule,
    InjectedContentModule,
    InputGroupModule,
    InputModule,
    InputResetModule,
    KeyValueEditorModule,
    LoadingOverlayModule,
    MeasuredTextModule,
    MenuButtonModule,
    MenuComboButtonModule,
    MenuListItemModule,
    MenuListModule,
    MenuModule,
    MenuWrapperModule,
    ModeToggleButtonModule,
    ProgressPieModule,
    PropertyGroupModule,
    RangeModule,
    RichTextEditorModule,
    ScrollViewModule,
    SearchBoxModule,
    SearchInputModule,
    SelectButtonModule,
    SelectGridModule,
    SelectInputModule,
    SelectModule,
    SelectWrapperModule,
    ShadowModule,
    SidePanelModule,
    SliderModule,
    SpinnerModule,
    SvgDirectivesModule,
    SwatchModule,
    SwitchModule,
    TabGroupModule,
    TextareaModule,
    TextStylePropsModule,
    ToggleButtonGroupModule,
    ValidIconModule,
  ],
})
export class CdCommonModule {}
