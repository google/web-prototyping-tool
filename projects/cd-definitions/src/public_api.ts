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

import { ElementEntitySubType } from 'cd-interfaces';
import { registerComponent } from 'cd-common/models';

// Core
import { Board } from './core/board/board';
import { SymbolIsolated } from './core/symbol/symbol';
import { SymbolInstance } from './core/symbol-instance/symbol-instance';
import { Portal } from './core/portal/portal';

// Primitive
import { Text } from './primitive/text/text';
import { Image } from './primitive/image/image';
import { Icon } from './primitive/icon/icon';
import { Generic } from './primitive/generic/generic';
import { Embed } from './primitive/embed/embed';
import {
  TextInput,
  TEXT_PRIMITIVE_INPUT_VALUE,
  TEXT_PRIMITIVE_PLACEHOLDER,
} from './primitive/input';
import { Media } from './primitive/media';
import { AutoNav } from './material/auto-nav/auto-nav';

// Material
import { MaterialButton } from './material/button/button';
import { MaterialToggleButtonGroup } from './material/toggle-button-group/toggle-button-group';
import { MaterialCheckbox } from './material/checkbox/checkbox';
import { MaterialChips } from './material/chips/chips';
import { MaterialDatePicker } from './material/datepicker/datepicker';
import { MaterialInput } from './material/input/input';
import { MaterialStepper } from './material/stepper/stepper';
import { MaterialRadioButton } from './material/radio-button/radio-button';
import { MaterialSwitch } from './material/switch/switch';
import { MaterialSlider, MAT_SLIDER_VALUE } from './material/slider/slider';
import { MaterialSpinner } from './material/spinner/spinner';
import { MaterialSelect } from './material/select/select';
import { MaterialTabs } from './material/tabs/tabs';
import { MaterialProgressBar, MAT_PROGRESS_BAR_VALUE } from './material/progress-bar/progress-bar';
import { MaterialExpansionPanel } from './material/expansion-panel/expansion-panel';

export {
  MAT_SLIDER_VALUE,
  TEXT_PRIMITIVE_PLACEHOLDER,
  TEXT_PRIMITIVE_INPUT_VALUE,
  MAT_PROGRESS_BAR_VALUE,
};

export const registerComponentDefinitions = () => {
  // Core
  registerComponent(ElementEntitySubType.Board)(Board);
  registerComponent(ElementEntitySubType.Symbol)(SymbolIsolated);
  registerComponent(ElementEntitySubType.SymbolInstance)(SymbolInstance);

  // Primitive
  registerComponent(ElementEntitySubType.Text)(Text);
  registerComponent(ElementEntitySubType.Image)(Image);
  registerComponent(ElementEntitySubType.Icon)(Icon);
  registerComponent(ElementEntitySubType.Generic)(Generic);
  // Imported/Library as Primitive to show on menu, but really part of Core
  registerComponent(ElementEntitySubType.BoardPortal)(Portal);
  registerComponent(ElementEntitySubType.IFrame)(Embed);
  registerComponent(ElementEntitySubType.TextInput)(TextInput);
  registerComponent(ElementEntitySubType.Media)(Media);

  // Material
  registerComponent(ElementEntitySubType.Button)(MaterialButton);
  registerComponent(ElementEntitySubType.Input)(MaterialInput);
  registerComponent(ElementEntitySubType.Select)(MaterialSelect);
  registerComponent(ElementEntitySubType.Datepicker)(MaterialDatePicker);
  registerComponent(ElementEntitySubType.Checkbox)(MaterialCheckbox);
  registerComponent(ElementEntitySubType.Switch)(MaterialSwitch);
  registerComponent(ElementEntitySubType.RadioButtonGroup)(MaterialRadioButton);
  registerComponent(ElementEntitySubType.Slider)(MaterialSlider);
  registerComponent(ElementEntitySubType.ToggleButtonGroup)(MaterialToggleButtonGroup);
  registerComponent(ElementEntitySubType.Spinner)(MaterialSpinner);
  registerComponent(ElementEntitySubType.ProgressBar)(MaterialProgressBar);
  registerComponent(ElementEntitySubType.ChipList)(MaterialChips);
  registerComponent(ElementEntitySubType.Tabs)(MaterialTabs);
  registerComponent(ElementEntitySubType.Stepper)(MaterialStepper);
  registerComponent(ElementEntitySubType.ExpansionPanel)(MaterialExpansionPanel);
  registerComponent(ElementEntitySubType.AutoNav)(AutoNav);
};

export { Board } from './core/board/board';
export { SymbolFactory } from './core/symbol/symbol';
export { SymbolInstanceFactory } from './core/symbol-instance/symbol-instance';
export { MatSelectFixModule } from './material/select/select-fix/mat-select-fix.module';
export { DateFixModule } from './material/datepicker/date-fix/date-fix.module';

export * from './material/material-shared';

export { DefsDirectivesModule } from './material/directives/directives.module';
