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

const utils = require('./utils');
const config = require('./config');
const path = require('path');

if (process.argv.length === 2) {
  console.error('Expected at least one argument!');
  process.exit(1);
}

const [, , argName] = process.argv;

const LIB_PATH = '../../projects';
const MODEL_LIB_PATH = `${LIB_PATH}/cd-common/models/src`;
const ENTITY_SUBTYPE_PATH = `${LIB_PATH}/cd-interfaces/src/entity-types.ts`;
const PROPS_INTERFACE_PATH = `${LIB_PATH}/cd-interfaces/src/element-properties.ts`;
const componentName = argName.toLowerCase();
const dirPath = path.resolve(__dirname, `${MODEL_LIB_PATH}/${componentName}`);
const camelName = utils.toCamelCase(componentName);
const entitySubtype = utils.capitalizeFirstLetter(camelName);
const interfaceName = `I${entitySubtype}Properties`;

const buildPath = fileName => `${dirPath}/${fileName}`;
const templatePath = buildPath(`${componentName}.template.ts`);
const propsPath = buildPath(`${componentName}.properties.ts`);
const exportTemplatePath = buildPath(`${componentName}.export.template.ts`);

(async () => {
  utils.createDir(dirPath); // Create directory in cd-common/models

  await utils.writeFile(templatePath, config.defaultTemplate); // Create template file

  await utils.writeFile(exportTemplatePath, config.defaultExportTemplate); // Create export template file

  await utils.writeFile(propsPath, config.defaultProperties(entitySubtype, interfaceName)); // Create properties file

  await addElementSubTypeToEnumInCdIntefaces();

  await addPropertiesInterfaceToCdIntefaces();

  await addComponentToCataglogPrimitives();

  await addComponentToPropertiesReducer();

  await addComponentToTemplateReducer();

  await addComponentToPropertyLookup();

  await addComponentToExportReducer();

  await utils.exec('node scripts/license -na');

  await utils.exec('npm run build:interfaces');

  console.log(`${componentName} Model Generated`);
})();

const addElementSubTypeToEnumInCdIntefaces = () => {
  const entityPath = path.resolve(__dirname, ENTITY_SUBTYPE_PATH);
  return utils.readFile(entityPath).then(value => {
    const ENTITY_SUBTYPE_REGEX = /(enum ElementEntitySubType.+)+[^{\}]+(?=})/g;
    const enumValue = value.match(ENTITY_SUBTYPE_REGEX)[0];
    const newLine = `  ${entitySubtype} = '${entitySubtype}',\n`;
    if (enumValue.includes(newLine)) return console.log('Already includes entity', entityPath);
    const output = value.replace(enumValue, enumValue + newLine);
    return utils.writeFile(entityPath, output);
  });
};

const addPropertiesInterfaceToCdIntefaces = () => {
  const interfacePath = path.resolve(__dirname, PROPS_INTERFACE_PATH);
  return utils.readFile(interfacePath).then(value => {
    const propsInterface = config.propertiesInterface(interfaceName, entitySubtype);
    if (value.includes(propsInterface)) {
      return console.log('Already includes interface', entityPath);
    }

    const output = value + `\n ${propsInterface}`;
    return utils.writeFile(interfacePath, output);
  });
};

const addComponentToCataglogPrimitives = () => {
  const catalogPath = path.resolve(__dirname, `${MODEL_LIB_PATH}/component-catalog.config.ts`);
  return utils.readFile(catalogPath).then(value => {
    const PRIMARY_CATALOG_REGEX = /(PRIMARY_CATALOG.+)+[^[\]]+(?=])/g;
    const primaryValue = value.match(PRIMARY_CATALOG_REGEX)[0];
    const newLine = `  {
     title: '${entitySubtype}',
     preview: 'info',
     elementType: ElementEntitySubType.${entitySubtype},
   },\n`;

    if (primaryValue.includes(newLine)) {
      return console.log('Already includes catalog entry', catalogPath);
    }

    const output = value.replace(primaryValue, primaryValue + newLine);
    return utils.writeFile(catalogPath, output);
  });
};

const addComponentToPropertiesReducer = () => {
  const propsReducerPath = path.resolve(__dirname, `${MODEL_LIB_PATH}/properties.reducer.ts`);
  return utils.readFile(propsReducerPath).then(value => {
    // Add import declaration to top of file
    const importName = `${entitySubtype}PropertyFactory`;
    const importValue = `import { ${importName} } from './${componentName}/${componentName}.properties';\n`;
    if (value.includes(importValue)) {
      return console.log('Already includes import', propsReducerPath);
    }

    let output = utils.appendImportsToFile(value, importValue);
    // Add factory reducer
    const FACTORY_REGEX = /(entityFactoryReducer: EntityFactoryBuilder.+)+[^{\}]+(?=})/g;
    const reducerValue = output.match(FACTORY_REGEX)[0];
    const newReducerLine = `  [ElementEntitySubType.${entitySubtype}]: ${importName},\n`;
    output = output.replace(reducerValue, reducerValue + newReducerLine);

    // Add to exports
    const EXPORT_REGEX = /(export.+)+[^{\}]+(?=})/g;
    const exportList = output.match(EXPORT_REGEX);
    const lastExport = exportList[exportList.length - 1];
    const exportValue = `  ${importName},\n`;
    output = output.replace(lastExport, lastExport + exportValue);

    return utils.writeFile(propsReducerPath, output);
  });
};

const addComponentToTemplateReducer = () => {
  const templateReducerPath = path.resolve(__dirname, `${MODEL_LIB_PATH}/template.reducer.ts`);
  return utils.readFile(templateReducerPath).then(value => {
    // Add import declaration to top of file
    const importName = `${entitySubtype}Template`;
    const importValue = `import ${importName} from './${componentName}/${componentName}.template';\n`;
    if (value.includes(importValue)) {
      return console.log('Already includes import', templateReducerPath);
    }

    let output = utils.appendImportsToFile(value, importValue);

    // Add template reducer
    const TEMPLATE_REDUCER_REGEX = /(templateForType: TemplateGeneratorMap.+)+[^{\}]+(?=})/g;
    const reducerValue = output.match(TEMPLATE_REDUCER_REGEX)[0];
    const newReducerLine = `  [cd.ElementEntitySubType.${entitySubtype}]: ${importName},\n`;
    output = output.replace(reducerValue, reducerValue + newReducerLine);

    return utils.writeFile(templateReducerPath, output);
  });
};

const addComponentToPropertyLookup = () => {
  const propsLookupPath = path.resolve(__dirname, `${MODEL_LIB_PATH}/properties.lookup.ts`);
  return utils.readFile(propsLookupPath).then(value => {
    // Add import declaration to top of file
    const importName = `${entitySubtype.toLowerCase()}Properties`;
    const importValue = `import { ${importName} } from './${componentName}/${componentName}.properties';\n`;
    if (value.includes(importValue)) {
      return console.log('Already includes import', propsLookupPath);
    }

    let output = utils.appendImportsToFile(value, importValue);

    // Add to switch statement
    const SWITCH_REGEX = /(switch.+)+[^{\}]+(?=default)/g;
    const reducerValue = output.match(SWITCH_REGEX)[0];
    const newReducerLine = `case cd.ElementEntitySubType.${entitySubtype}: return ${importName};\n  `;
    output = output.replace(reducerValue, reducerValue + newReducerLine);

    return utils.writeFile(propsLookupPath, output);
  });
};

const addComponentToExportReducer = () => {
  const exportReducerPath = path.resolve(__dirname, `${MODEL_LIB_PATH}/template.export.reducer.ts`);

  return utils.readFile(exportReducerPath).then(value => {
    const importName = `${entitySubtype}Template`;
    const importValue = `import ${importName} from './${componentName}/${componentName}.export.template';\n`;
    if (value.includes(importValue)) {
      return console.log('Already includes import', exportReducerPath);
    }

    let output = utils.appendImportsToFile(value, importValue, true);

    // Add factory reducer
    const EXPORT_REGEX = /(exportTemplateForType: TemplateExportGeneratorMap.+)+[^{\}]+(?=})/g;
    const reducerValue = output.match(EXPORT_REGEX)[0];
    const newReducerLine = `  [cd.ElementEntitySubType.${entitySubtype}]: ${importName},\n`;
    output = output.replace(reducerValue, reducerValue + newReducerLine);

    return utils.writeFile(exportReducerPath, output);
  });
};
