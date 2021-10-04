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
import { matButtonConfig } from './button-audit.config';
import { matSelectConfig } from './select-audit.config';
import { matInputConfig } from './input-audit.config';
import { matDatepickerConfig } from './datepicker-audit.config';
import { matCheckboxConfig } from './checkbox-audit.config';
import { matSwitchConfig } from './switch-audit.config';
import { matRadiobuttonsConfig } from './radiobuttons-audit.config';
import { matSliderConfig } from './slider-audit.config';
import { matSpinnerConfig } from './spinner-audit.config';
import { matProgressBarConfig } from './progressbar-audit.config';
import { matChipsListConfig } from './chipslist-audit.config';
import { matTabsConfig } from './tabs-audit.config';
import { matStepperConfig } from './stepper-audit.config';
import { matExpansionPanelConfig } from './expansionpanel-audit.config';

export interface IAuditView {
  title: string;
  elementType: cd.ComponentIdentity;
  variants: IAuditVariant[];
  columnWidth?: string;
}

export interface IAuditVariant {
  title: string;
  subVariants: IAuditSubVariant[];
  hidden?: boolean;
}

export interface IAuditSubVariant {
  title: string;
  inputs: any;
  hidden?: boolean;
}

export const CUSTOM_AUDIT_VIEWS: IAuditView[] = [
  matButtonConfig,
  matSelectConfig,
  matInputConfig,
  matDatepickerConfig,
  matCheckboxConfig,
  matSwitchConfig,
  matRadiobuttonsConfig,
  matSliderConfig,
  matSpinnerConfig,
  matProgressBarConfig,
  matChipsListConfig,
  matTabsConfig,
  matStepperConfig,
  matExpansionPanelConfig,
];
