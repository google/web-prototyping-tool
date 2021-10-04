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

const defaultTemplate = `
import * as utils from '../template.utils';
import { DIV_TAG } from 'cd-common/consts';

export default function() {
  return new utils.TemplateFactory(DIV_TAG)
    .addDefaultAttributes()
    .allowChildren()
    .build();
}
`;

const defaultProperties = (entitySubtype, interfaceName) => {
  return `
  import * as cd from 'cd-interfaces';
  import * as config from '../properties.config';
  import { IPropertyGroup } from '../properties.interface';
  import { ElementPropertyFactory } from '../element-factory';
  
  export class ${entitySubtype}PropertyFactory extends ElementPropertyFactory implements cd.${interfaceName} {
    public childrenAllowed: false = false;
    public elementType: cd.ElementEntitySubType.${entitySubtype} = cd.ElementEntitySubType.${entitySubtype};
    public inputs = {};
    
    constructor(projectId: string, id: string, name = '${entitySubtype}') {
      super(projectId, id, name);
      this.assignBackgroundColor('#EEEEEE');
      this.assignDisplayStyle(cd.Display.Block);
      this.assignOverflow(cd.Overflow.Hidden, cd.Overflow.Hidden);
      this.assignWidth(100);
      this.assignHeight(100);
    }
  }
  
  // PROPERTIES PANEL CONFIG
  
  export const ${entitySubtype.toLowerCase()}Properties: ReadonlyArray<IPropertyGroup> = [
    ...config.DEFAULT_PROP_CONFIG,
    config.PADDING_RADIUS_CONFIG,
    config.OPACITY_OVERFLOW_CONFIG,
    config.ELEMENT_INNER_LAYOUT_CONFIG,
    config.DEFAULT_ADVANCED_CONFIG,
    config.BACKGROUND_CONFIG,
    config.BORDER_CONFIG,
    config.SHADOW_CONFIG,
  ];
  `;
};

const defaultExportTemplate = `
import * as cd from 'cd-interfaces';
import { DIV_TAG } from 'cd-common/consts';
import { TemplateExportFactory } from '../template.export.utils';

export default function(model: cd.PropertyModel, content?: string) {
  return new TemplateExportFactory(DIV_TAG, model).addChild(content).build();
}
`;

const propertiesInterface = (name, entitySubtype) => `
export interface ${name} extends IElementProperties {
  childrenAllowed: false;
  elementType: ElementEntitySubType.${entitySubtype};
}`;

module.exports = {
  defaultTemplate,
  defaultExportTemplate,
  defaultProperties,
  propertiesInterface,
};
