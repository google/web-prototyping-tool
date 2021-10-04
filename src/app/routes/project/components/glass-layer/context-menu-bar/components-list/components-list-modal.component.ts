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

import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  EventEmitter,
  Input,
  Output,
  HostBinding,
  ViewChild,
  HostListener,
  ChangeDetectorRef,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { ComponentsService } from '../../../../services/components/components.service';
import { createInstanceOfSymbol } from '../../../../utils/symbol.utils';
import { SymbolScreenshotsService } from '../../../../services/symbol-screenshots/symbol-screenshots.service';
import { DndDirectorService } from 'src/app/routes/project/dnd-director/dnd-director.service';
import { LayerIcons } from 'cd-common/consts';
import { SearchInputComponent } from 'cd-common';
import { createCodeComponentInstance } from 'cd-common/models';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import { AnalyticsEvent } from 'cd-common/analytics';
import { getInvalidSymbolIds } from '../../../../utils/dependency.utils';
import { PropertiesService } from '../../../../services/properties/properties.service';
import { createId } from 'cd-utils/guid';
import * as cd from 'cd-interfaces';

const FOCUS_DELAY = 200;

interface ICustomComponentCatalogItem extends cd.ICatalogItem {
  componentProps: cd.ISymbolProperties | cd.ICodeComponentDocument;
}

@Component({
  selector: 'app-components-list-modal',
  templateUrl: './components-list-modal.component.html',
  styleUrls: ['./components-list-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComponentsListModalComponent implements OnInit, OnDestroy, AfterViewInit {
  private _subscriptions = new Subscription();
  private _animTimeout = 0;
  public filterValue = '';
  public primitiveComponents: cd.IComponent[] = [];
  public materialComponents: cd.IComponent[] = [];
  public Components: cd.IComponent[] = [];
  public codeComponents: ICustomComponentCatalogItem[] = [];
  public symbols: ICustomComponentCatalogItem[] = [];
  public customComponents: ICustomComponentCatalogItem[] = [];
  public componentScreenshots = new Map<string, string>();

  @Input() isolatedSymbolId = '';
  @Input() typesToExclude = new Set<cd.ComponentIdentity>();

  @Output() exit = new EventEmitter<void>();
  @Output() selectElement = new EventEmitter<cd.PropertyModel>();

  @HostBinding('style.width.px')
  width = 0;

  @HostBinding('style.height.px')
  height = 0;

  @Input() set size(value: cd.Dimensions) {
    const { width, height } = value;
    this.width = width;
    this.height = height;
  }

  @ViewChild('searchRef', { read: SearchInputComponent, static: true })
  searchRef!: SearchInputComponent;

  @HostListener('keydown.escape')
  onKeyDown() {
    this.closeModal();
  }

  constructor(
    public componentsService: ComponentsService,
    private _propsService: PropertiesService,
    private _symbolScreenshotsService: SymbolScreenshotsService,
    private _dndService: DndDirectorService,
    private _cdRef: ChangeDetectorRef,
    private _analyticsService: AnalyticsService
  ) {}

  ngOnInit() {
    const { componentsService } = this;
    const { primitiveComponents, materialComponents } = componentsService;
    this.primitiveComponents = primitiveComponents.filter(this.isItemExcluded);
    this.materialComponents = materialComponents.filter(this.isItemExcluded);

    this._subscriptions.add(componentsService.symbols$.subscribe(this.handleSymbols));
    this._subscriptions.add(
      this._symbolScreenshotsService.componentScreenshots$.subscribe(this.handleSymbolScreenshots)
    );

    this._subscriptions.add(componentsService.codeComponents$.subscribe(this.handleCodeComponents));
  }

  ngOnDestroy() {
    window.clearTimeout(this._animTimeout);
    this._subscriptions.unsubscribe();
  }

  ngAfterViewInit() {
    this._animTimeout = window.setTimeout(
      () => this.searchRef.inputRef.nativeElement.focus(),
      FOCUS_DELAY
    );
  }

  private isItemExcluded = (item: cd.IComponent) => {
    return !this.typesToExclude.has(item.id);
  };

  private symbolToCatalogItem = (symbol: cd.ISymbolProperties): ICustomComponentCatalogItem => ({
    title: symbol.name,
    componentProps: symbol,
    icon: LayerIcons.Component,
    id: cd.ElementEntitySubType.SymbolInstance,
  });

  private codeComponentToCatalogItem = (
    codeComponent: cd.ICodeComponentDocument
  ): ICustomComponentCatalogItem => ({
    title: codeComponent.title,
    componentProps: codeComponent,
    icon: codeComponent.icon,
    id: codeComponent.id,
  });

  private handleSymbols = (symbols: cd.ISymbolProperties[]) => {
    const hideSymbols = this.typesToExclude.has(cd.ElementEntitySubType.SymbolInstance);
    if (hideSymbols) return;

    // Symbols should be added, so filter them down and map them top options
    const { isolatedSymbolId } = this;
    const elementProperties = this._propsService.getElementProperties();
    const invalidSymbols = getInvalidSymbolIds(elementProperties, isolatedSymbolId);
    this.symbols = symbols
      .filter((symbol) => !invalidSymbols.has(symbol.id))
      .map(this.symbolToCatalogItem);
    this.updateCustomComponentsList();
  };

  private handleCodeComponents = (codeCmps: cd.ICodeComponentDocument[]) => {
    this.codeComponents = codeCmps
      .map(this.codeComponentToCatalogItem)
      .filter((codeCmp) => !this.typesToExclude.has(codeCmp.id));
    this.updateCustomComponentsList();
  };

  private handleSymbolScreenshots = (symbolMap: Map<string, cd.IScreenshotLookup>) => {
    this.componentScreenshots = [...symbolMap.entries()].reduce((acc, curr) => {
      const [key, value] = curr;
      if (value.url) acc.set(key, value.url);
      return acc;
    }, new Map<string, string>());
    this._cdRef.markForCheck();
  };

  addComponent(component: Partial<ICustomComponentCatalogItem>) {
    const { id: elementType, componentProps } = component;
    if (componentProps) {
      const isCodeComponent = componentProps.type === cd.EntityType.CodeComponent;
      if (isCodeComponent) return this.onCodeCmpSelect(componentProps as cd.ICodeComponentDocument);
      return this.onSymbolComponentSelect(componentProps as cd.ISymbolProperties);
    }
    return this.onComponentSelect(elementType as cd.ElementEntitySubType);
  }

  onComponentSelect(subtype: cd.ElementEntitySubType) {
    const element = this._dndService.buildPropertyModel(subtype);
    if (!element) return;
    this.selectElement.emit(element);
  }

  onSymbolComponentSelect(symbol: cd.ISymbolProperties) {
    const id = createId();
    const props = this._propsService.getElementProperties();
    const element = createInstanceOfSymbol(props, symbol, id);
    this.selectElement.emit(element);
  }

  onCodeCmpSelect(codeComponent: cd.ICodeComponentDocument) {
    const id = createId();
    const element = createCodeComponentInstance(id, codeComponent);
    this._analyticsService.logEvent(AnalyticsEvent.CodeComponentInstanceCreated);
    this.selectElement.emit(element);
  }

  trackByFn(index: number, item: Partial<ICustomComponentCatalogItem>) {
    const identifier = item?.componentProps?.id || item.id;
    return `${index}:${identifier}`;
  }

  onFilterChange(event: string) {
    this.filterValue = event;
  }

  closeModal() {
    this.exit.emit();
  }

  private updateCustomComponentsList() {
    this.customComponents = [...this.symbols, ...this.codeComponents];
    this._cdRef.markForCheck();
  }
}
